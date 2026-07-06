import hashlib
import json
import random
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.user import User
from app.models.menu import WeekMenu, MenuMeal
from app.models.recipe import Recipe
from app.models.user_recipe import UserRecipe
from app.schemas.menu import (
    WeekMenuOut, WeekMenuSave,
    MenuGenerationOut, MenuGenerateIn, MenuGeneratePreviewIn,
)
from app.schemas.recipe import RecipeOut
from app.services.auth import get_current_user
from app.services import menu_generator as gen
from app.routers.recipes import _user_recipe_to_recipe_dict

router = APIRouter(prefix="/menu", tags=["menu"])


def _load_week_menu(db: Session, user_id: int, week_start: date) -> WeekMenu | None:
    return (
        db.query(WeekMenu)
        .options(
            selectinload(WeekMenu.meals).selectinload(MenuMeal.recipe).selectinload(Recipe.ingredients),
            selectinload(WeekMenu.meals).selectinload(MenuMeal.user_recipe).selectinload(UserRecipe.ingredients),
        )
        .filter(WeekMenu.user_id == user_id, WeekMenu.week_start == week_start)
        .first()
    )


def _serialize_menu(menu: WeekMenu) -> dict:
    """Собирает ответ вручную — recipe может быть системным или пользовательским."""
    out_meals = []
    for m in menu.meals:
        if m.recipe is not None:
            recipe_payload = RecipeOut.model_validate(m.recipe).model_dump()
        elif m.user_recipe is not None:
            recipe_payload = _user_recipe_to_recipe_dict(m.user_recipe, None)
        else:
            continue  # не должно случаться, но пропускаем на всякий случай

        out_meals.append({
            "id": m.id,
            "day_index": m.day_index,
            "meal_type": m.meal_type,
            "recipe": recipe_payload,
        })

    return {
        "id": menu.id,
        "week_start": menu.week_start,
        "name": menu.name,
        "meals": out_meals,
    }


@router.get("/week/{week_start}", response_model=WeekMenuOut)
def get_week_menu(
    week_start: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    menu = _load_week_menu(db, current_user.id, week_start)
    if not menu:
        raise HTTPException(status_code=404, detail="Меню на эту неделю не найдено")
    return _serialize_menu(menu)


@router.put("/week/{week_start}", response_model=WeekMenuOut)
def save_week_menu(
    week_start: date,
    data: WeekMenuSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Собираем все слоты без дедупликации — пользователь может разместить
    # несколько блюд в один приём пищи (суп + второе, несколько перекусов).
    sys_ids = {m.recipe_id for m in data.meals if m.recipe_id is not None}
    user_ids = {m.user_recipe_id for m in data.meals if m.user_recipe_id is not None}
    if sys_ids:
        found_sys = {r.id for r in db.query(Recipe.id).filter(Recipe.id.in_(sys_ids)).all()}
        missing = sys_ids - found_sys
        if missing:
            raise HTTPException(status_code=400, detail=f"Системные рецепты не найдены: {sorted(missing)}")

    # Проверяем пользовательские — только свои или опубликованные.
    # user_ids уже собран на строке 78 из data.meals — отдельная дедупликация
    # не нужна (см. комментарий выше: блюда в один приём не дедуплицируем).
    if user_ids:
        found_user = {
            r.id for r in db.query(UserRecipe.id).filter(
                UserRecipe.id.in_(user_ids),
                (
                    (UserRecipe.created_by == current_user.id) |
                    ((UserRecipe.visibility == "public") & (UserRecipe.is_active == True))  # noqa: E712
                ),
            ).all()
        }
        missing = user_ids - found_user
        if missing:
            raise HTTPException(status_code=400, detail=f"Пользовательские рецепты недоступны: {sorted(missing)}")

    # Upsert меню
    menu = db.query(WeekMenu).filter(
        WeekMenu.user_id == current_user.id,
        WeekMenu.week_start == week_start,
    ).first()

    if menu:
        db.query(MenuMeal).filter(MenuMeal.week_menu_id == menu.id).delete()
        menu.name = data.name
    else:
        menu = WeekMenu(user_id=current_user.id, week_start=week_start, name=data.name)
        db.add(menu)
        db.flush()

    for meal_data in data.meals:
        db.add(MenuMeal(
            week_menu_id=menu.id,
            recipe_id=meal_data.recipe_id,
            user_recipe_id=meal_data.user_recipe_id,
            day_index=meal_data.day_index,
            meal_type=meal_data.meal_type,
        ))

    db.commit()
    return _serialize_menu(_load_week_menu(db, current_user.id, week_start))


@router.delete("/week/{week_start}", status_code=204)
def delete_week_menu(
    week_start: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    menu = db.query(WeekMenu).filter(
        WeekMenu.user_id == current_user.id,
        WeekMenu.week_start == week_start,
    ).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Меню не найдено")
    db.delete(menu)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════
# ГЕНЕРАЦИЯ МЕНЮ (этап A: расчёт на бэке, фронт только рендерит)
# ═══════════════════════════════════════════════════════════════════════
def _recipe_view_system(r: Recipe) -> dict:
    """ORM Recipe → recipe-view dict в формате, который ждёт menu_generator."""
    return {
        "id": r.id,
        "name": r.name or "",
        "kcal": r.kcal,
        "protein": r.proteins,
        "fat": r.fats,
        "carbs": r.carbs,
        "type": r.meal_type,
        "time": r.time_minutes,
        "tags": r.tags or [],
        "ings": [{"n": i.name} for i in (r.ingredients or [])],
        "desc": r.description,
        "category": r.category,
        "servings": 1,
        "_orm": r,
        "_is_user": False,
        "_author_name": None,
    }


def _recipe_view_user(ur: UserRecipe, author_name: str | None) -> dict:
    """ORM UserRecipe → recipe-view dict. id сдвигаем на +1_000_000 (как в ленте),
    чтобы не пересекаться с системными и корректно сохранять в MenuMeal."""
    return {
        "id": ur.id + 1_000_000,
        "name": ur.name or "",
        "kcal": ur.kcal,
        "protein": ur.proteins,
        "fat": ur.fats,
        "carbs": ur.carbs,
        "type": ur.meal_type,
        "time": ur.time_minutes,
        "tags": ur.tags or [],
        "ings": [{"n": i.name} for i in (ur.ingredients or [])],
        "desc": ur.description,
        "category": ur.category,
        "servings": getattr(ur, "servings", 1) or 1,
        "_orm": ur,
        "_is_user": True,
        "_author_name": author_name,
    }


def _build_pool(db: Session) -> list[dict]:
    """Пул для генерации = системные + активные публичные пользовательские рецепты
    (та же выборка, что отдаёт лента GET /recipes)."""
    # order_by обязателен: детерминизм генерации по seed требует стабильного
    # порядка пула (иначе последовательность rng-шума и тай-брейков «поедет»).
    system = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients))
        .order_by(Recipe.id)
        .all()
    )
    user_rows = (
        db.query(UserRecipe, User.name.label("author_name"))
        .outerjoin(User, User.id == UserRecipe.created_by)
        .options(selectinload(UserRecipe.ingredients))
        .filter(UserRecipe.is_active == True)  # noqa: E712
        .filter(UserRecipe.visibility == "public")
        .order_by(UserRecipe.id)
        .all()
    )
    views = [_recipe_view_system(r) for r in system]
    views.extend(_recipe_view_user(ur, author_name) for ur, author_name in user_rows)
    return views


def _serialize_view(view: dict) -> dict:
    """recipe-view → payload RecipeOut для фронта."""
    if view["_is_user"]:
        return _user_recipe_to_recipe_dict(view["_orm"], view["_author_name"])
    return RecipeOut.model_validate(view["_orm"]).model_dump()


def _stable_seed(*parts) -> int:
    """Детерминированный seed из частей (стабилен между процессами, в отличие от hash())."""
    s = "|".join(str(p) for p in parts)
    return int(hashlib.sha256(s.encode("utf-8")).hexdigest()[:12], 16)


def _wrap_generation(result: dict, menu_id: int | None, week_start: date,
                     name: str, meals_payload: list[dict]) -> dict:
    """Собирает тело MenuGenerationOut из результата генератора."""
    fa = result.get("fallback_applied")
    return {
        "menu": {"id": menu_id, "week_start": week_start, "name": name, "meals": meals_payload},
        "adult_equivalent": result["adult_equivalent"],
        "meal_targets": result["meal_targets"],
        "use_snack": result["use_snack"],
        "slots": result["slots"],
        "fallback_applied": ({"level": fa["level"], "label": fa["label"]} if fa else None),
        "stats": result["stats"],
    }


@router.post("/week/{week_start}/generate", response_model=MenuGenerationOut)
def generate_week_menu_endpoint(
    week_start: date,
    body: MenuGenerateIn | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Генерирует меню на неделю из preferences юзера, СОХРАНЯЕТ его (перезаписывая
    старое на эту неделю) и возвращает вместе с метаданными для UI.

    seed=None → стабильный seed(user, week): перезагрузка страницы даёт то же меню.
    Кнопка «Перегенерировать» шлёт новый seed и осознанно перетасовывает."""
    pool = _build_pool(db)
    prefs = (body.preferences if (body and body.preferences is not None)
             else current_user.preferences) or {}
    seed = body.seed if (body and body.seed is not None) else _stable_seed(current_user.id, week_start.isoformat())
    result = gen.generate_week_menu(pool, prefs, random.Random(seed))
    name = "Меню на неделю"

    # Upsert меню (та же логика, что save_week_menu)
    menu = db.query(WeekMenu).filter(
        WeekMenu.user_id == current_user.id,
        WeekMenu.week_start == week_start,
    ).first()
    if menu:
        db.query(MenuMeal).filter(MenuMeal.week_menu_id == menu.id).delete()
        menu.name = name
    else:
        menu = WeekMenu(user_id=current_user.id, week_start=week_start, name=name)
        db.add(menu)
        db.flush()

    # Создаём слоты; храним ссылку на объект, чтобы после flush достать реальный id.
    created = []
    for day in result["week_menu"]:
        for m in day["meals"]:
            view = m["recipe"]
            rid = view["id"]
            mm = MenuMeal(
                week_menu_id=menu.id,
                recipe_id=(None if rid >= 1_000_000 else rid),
                user_recipe_id=(rid - 1_000_000 if rid >= 1_000_000 else None),
                day_index=day["dayIdx"],
                meal_type=m["slot"],
            )
            db.add(mm)
            created.append((mm, view, m["slot"], day["dayIdx"], bool(m["isBatch"])))
    db.flush()

    meals_payload = [
        {
            "id": mm.id,
            "day_index": day_idx,
            "meal_type": slot,
            "is_batch": is_batch,
            "recipe": _serialize_view(view),
        }
        for (mm, view, slot, day_idx, is_batch) in created
    ]

    db.commit()
    return _wrap_generation(result, menu.id, week_start, name, meals_payload)


@router.post("/generate-preview", response_model=MenuGenerationOut)
def generate_menu_preview(
    body: MenuGeneratePreviewIn,
    db: Session = Depends(get_db),
):
    """Генерация для онбординга (aha-экран) до регистрации: preferences приходят
    в теле, меню НЕ сохраняется (юзера ещё нет). После регистрации фронт вызывает
    авторизованный /week/{week_start}/generate, чтобы зафиксировать меню."""
    pool = _build_pool(db)
    prefs = body.preferences or {}
    seed = body.seed if body.seed is not None else _stable_seed(
        "preview", json.dumps(prefs, sort_keys=True, ensure_ascii=False, default=str)
    )
    result = gen.generate_week_menu(pool, prefs, random.Random(seed))

    # week_start для preview косметический — берём понедельник текущей недели.
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    name = "Меню на неделю"

    meals_payload = []
    idx = 0
    for day in result["week_menu"]:
        for m in day["meals"]:
            meals_payload.append({
                "id": idx,
                "day_index": day["dayIdx"],
                "meal_type": m["slot"],
                "is_batch": bool(m["isBatch"]),
                "recipe": _serialize_view(m["recipe"]),
            })
            idx += 1

    return _wrap_generation(result, None, week_start, name, meals_payload)