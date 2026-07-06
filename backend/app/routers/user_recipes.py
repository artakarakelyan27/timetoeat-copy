"""Роутер пользовательских рецептов.

Эндпоинты:
  POST   /user-recipes          — создать (визард). is_active=False по умолчанию.
  GET    /user-recipes/me       — мои рецепты (любого статуса).
  GET    /user-recipes/{id}     — один рецепт. Виден автору всегда, остальным — только active.
  PATCH  /user-recipes/{id}     — редактирование (только автор и пока is_active=False).
  DELETE /user-recipes/{id}     — удалить (только автор).
  PATCH  /user-recipes/{id}/activate — модерация (только админ из ADMIN_EMAILS в .env).

Активные user-recipes также подмешиваются в общий GET /recipes (см. recipes.py).
"""
import os
import re
import unicodedata
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.user import User
from app.models.user_recipe import UserRecipe
from app.models.recipe import Ingredient
from app.schemas.user_recipe import UserRecipeCreate, UserRecipeOut, UserIngredientCreate
from app.services.auth import get_current_user

router = APIRouter(prefix="/user-recipes", tags=["user-recipes"])


def _serialize_with_author(recipe: UserRecipe, db: Session) -> UserRecipeOut:
    """Сериализует UserRecipe в UserRecipeOut и подкладывает author_name.
    Имя автора берётся через relationship author (lazy-load), кешируется
    SQLAlchemy на время сессии. Если у юзера нет имени — None, и фронт
    нарисует бейдж как «Добавлено пользователем» без имени."""
    out = UserRecipeOut.model_validate(recipe)
    if recipe.author is not None:
        out.author_name = (recipe.author.name or "").strip() or None
    return out


# Список email-адресов админов берётся из .env. Простейшая модель прав без
# отдельной таблицы ролей — для текущего масштаба этого достаточно.
def _is_admin(user: User) -> bool:
    admin_emails = os.getenv("ADMIN_EMAILS", "").lower()
    if not admin_emails:
        return False
    admins = {e.strip() for e in admin_emails.split(",") if e.strip()}
    return user.email.lower() in admins


def _build_quantity(ing: dict | UserIngredientCreate) -> str | None:
    """Собирает строку 'amount + unit' из ингредиента визарда.
    Если фронт уже прислал собранный quantity — возвращаем его."""
    if isinstance(ing, dict):
        q = ing.get("quantity")
        if q:
            return str(q).strip() or None
        amount = ing.get("amount")
        unit = ing.get("unit")
    else:
        if ing.quantity:
            return ing.quantity.strip() or None
        amount = ing.amount
        unit = ing.unit

    if amount is None and not unit:
        return None
    parts = []
    if amount is not None and str(amount).strip():
        parts.append(str(amount).strip())
    if unit and str(unit).strip():
        parts.append(str(unit).strip())
    return " ".join(parts) or None


def _slugify(value: str) -> str:
    """Slug для юзерских рецептов. К нему добавляется uuid-хвост, чтобы
    избежать конфликтов между разными авторами."""
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value[:60] or "recipe"


# UserIngredientCreate уже импортирован сверху


@router.post("", response_model=UserRecipeOut, status_code=201)
def create_user_recipe(
    data: UserRecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Создать пользовательский рецепт. is_active=False — рецепт уйдёт на
    модерацию и не появится в общей ленте, пока админ не активирует."""

    # Имя рецепта: визард шлёт title, наш канон — name. Принимаем оба.
    name = (data.name or data.title or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Укажите название рецепта")

    # Время приготовления: время = prep + cook, либо отдельное time_minutes.
    time_minutes = data.time_minutes
    if time_minutes is None:
        prep = data.prep_time_min or 0
        cook = data.cook_time_min or 0
        if prep or cook:
            time_minutes = prep + cook

    # Slug: имя_юзера + slug + короткий uuid. Делаем уникальным чтобы не
    # ловить коллизии при одинаковых названиях у разных юзеров.
    slug = f"{_slugify(name)}-{uuid.uuid4().hex[:8]}"

    recipe = UserRecipe(
        slug=slug,
        name=name,
        emoji=data.emoji or "🍽️",
        bg_color=data.bg_color or "#E4F5EA",
        description=data.description,
        meal_type=data.meal_type,
        cuisine=data.cuisine,
        category=data.category,
        time_minutes=time_minutes,
        # Количество порций — раньше игнорировалось (см. FIX-SERVINGS-01).
        # Минимум 1, никогда не None — иначе делим на ноль в scaleIngredients.
        servings=max(1, data.servings or 1),
        kcal=data.kcal,
        proteins=data.proteins,
        fats=data.fats,
        carbs=data.carbs,
        is_vegetarian=data.is_vegetarian,
        is_vegan=data.is_vegan,
        is_fast=data.is_fast or (time_minutes is not None and time_minutes <= 30),
        is_gluten_free=data.is_gluten_free,
        is_lactose_free=data.is_lactose_free,
        steps=[s for s in (data.steps or []) if s and s.strip()],
        tags=[t for t in (data.tags or []) if t and t.strip()],
        image_url=data.image_url,
        created_by=current_user.id,
        # Намерение автора. private → виден только в /user-recipes/me.
        # public → ждёт модерации, потом попадает в общую ленту.
        visibility=data.visibility,
        # Приватный рецепт активен сразу — он и так не виден никому, кроме автора.
        # Публичный — на модерации (is_active=False), активирует админ через
        # PATCH /user-recipes/{id}/activate.
        is_active=(data.visibility == "private"),
    )
    db.add(recipe)
    db.flush()

    # Ингредиенты — в общую таблицу, но через user_recipe_id (а не recipe_id).
    for i, ing in enumerate(data.ingredients or []):
        if not ing.name or not ing.name.strip():
            continue
        db.add(Ingredient(
            user_recipe_id=recipe.id,
            recipe_id=None,
            name=ing.name.strip(),
            quantity=_build_quantity(ing),
            category=ing.category or "📦 Прочее",
            order=i,
        ))

    db.commit()
    db.refresh(recipe)
    return _serialize_with_author(recipe, db)


@router.get("/me", response_model=list[UserRecipeOut])
def my_user_recipes(
    is_active: bool | None = Query(None, description="Фильтр по статусу"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Свои рецепты: видны автору в любом статусе (для UI 'Мои рецепты')."""
    q = (
        db.query(UserRecipe)
        .options(
            selectinload(UserRecipe.ingredients),
            selectinload(UserRecipe.author),  # eager-load чтобы не было N+1 при сериализации
        )
        .filter(UserRecipe.created_by == current_user.id)
    )
    if is_active is not None:
        q = q.filter(UserRecipe.is_active == is_active)
    recipes = q.order_by(UserRecipe.created_at.desc()).offset(offset).limit(limit).all()
    return [_serialize_with_author(r, db) for r in recipes]


@router.get("/{recipe_id}", response_model=UserRecipeOut)
def get_user_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Один рецепт. Автор видит свой всегда, чужие — только активные."""
    recipe = (
        db.query(UserRecipe)
        .options(
            selectinload(UserRecipe.ingredients),
            selectinload(UserRecipe.author),
        )
        .filter(UserRecipe.id == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    if recipe.created_by != current_user.id and not recipe.is_active:
        # Чужой неактивный — для запросившего его не существует
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    return _serialize_with_author(recipe, db)


@router.delete("/{recipe_id}", status_code=204)
def delete_user_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = db.query(UserRecipe).filter(UserRecipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    if recipe.created_by != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Можно удалять только свои рецепты")
    db.delete(recipe)
    db.commit()


@router.patch("/{recipe_id}/activate", response_model=UserRecipeOut)
def admin_activate_user_recipe(
    recipe_id: int,
    is_active: bool = Query(..., description="Новое значение флага активности"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Модерация — только для админов из ADMIN_EMAILS. Включает или выключает
    публикацию рецепта в общей ленте."""
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Только для администраторов")

    recipe = db.query(UserRecipe).filter(UserRecipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    recipe.is_active = is_active
    db.commit()
    db.refresh(recipe)
    return _serialize_with_author(recipe, db)