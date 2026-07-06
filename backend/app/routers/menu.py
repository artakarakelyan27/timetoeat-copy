from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from datetime import date

from app.database import get_db
from app.models.user import User
from app.models.menu import WeekMenu, MenuMeal
from app.models.recipe import Recipe
from app.models.user_recipe import UserRecipe
from app.schemas.menu import WeekMenuOut, WeekMenuSave
from app.schemas.recipe import RecipeOut
from app.services.auth import get_current_user
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