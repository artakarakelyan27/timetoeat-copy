from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, and_, not_, func, exists, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.recipe import Recipe, Ingredient
from app.models.user_recipe import UserRecipe
from app.models.user import User
from app.schemas.recipe import RecipeOut, RecipeCreate
from app.services.auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])


# Карта ограничений — паттерны для match по названию и ингредиентам.
RESTRICTION_PATTERNS: dict[str, list[str]] = {
    "vegan": [
        "курин", "куриц", "говяд", "телятин", "свинин", "бекон", "грудинк",
        "карбонад", "баранин", "ягнятин", "колбас", "сосиск", "ветчин",
        "буженин", "пастром", "салям", "фарш", "котлет", "стейк", "ребрышк",
        "индейк", "индюш", "утк", "гус", "печень", "печенк", "сердечк",
        "почки", "язык", "гуанчале", "панчетт", "прошютт", "хамон",
        "сёмг", "семг", "лосос", "форел", "тунец", "сельд", "скумбри",
        "минта", "треск", "хек", "горбуш", "кета", "сардин", "анчоус",
        "рыб", "икра", "креветк", "кальмар", "осьминог", "мид", "устриц",
        "крабы", "крабов",
        "молок", "молочн", "сливк", "сметан", "творог", "кефир", "ряженк",
        "йогурт", "сыр", "пармезан", "моцарелл", "фета", "брынз", "рикотт",
        "сливочн",
        "яйц", "яиц", "омлет",
        "мёд", "мед",
    ],
    "veg": [
        "курин", "куриц", "говяд", "телятин", "свинин", "бекон", "грудинк",
        "карбонад", "баранин", "ягнятин", "колбас", "сосиск", "ветчин",
        "буженин", "фарш", "котлет", "стейк", "ребрышк",
        "индейк", "индюш", "утк", "гус",
        "печень", "печенк", "сердечк", "почки", "язык",
        "гуанчале", "панчетт", "прошютт", "хамон",
        "сёмг", "семг", "лосос", "форел", "тунец", "сельд", "скумбри",
        "минта", "треск", "хек", "горбуш", "кета", "сардин", "анчоус",
        "рыб", "икра", "креветк", "кальмар", "осьминог", "мид", "устриц",
        "крабы", "крабов",
    ],
    "gluten":   ["пшеничн", "мука", "макарон", "паста", "спагетти", "хлеб",
                 "батон", "булк", "пшениц", "ячмен", "рожь", "панировк",
                 "сухар"],
    "lactose":  ["молок", "молочн", "сливк", "сметан", "творог", "кефир",
                 "йогурт", "сыр", "пармезан", "моцарелл", "фета", "брынз",
                 "рикотт", "сливочн"],
    "nuts":     ["орех", "миндал", "фундук", "грецк", "кешью", "фисташк",
                 "кедров", "арахис", "пекан"],
    "seafood":  ["креветк", "кальмар", "осьминог", "мидии", "устриц", "крабы",
                 "крабов", "морепродукт", "икра"],
    "pork":     ["свинин", "свиное", "свиной", "бекон", "грудинк",
                 "карбонад", "ветчин", "буженин", "гуанчале", "панчетт",
                 "прошютт", "хамон"],
    "halal":    ["свинин", "свиное", "свиной", "бекон", "грудинк",
                 "карбонад", "ветчин", "буженин", "гуанчале", "панчетт",
                 "прошютт", "хамон", "вино", "коньяк", "ром ", "ликёр",
                 "пиво", "сид"],
}


def _capitalized_variants(p: str) -> list[str]:
    """Для русских паттернов SQLite LIKE не делает case-insensitive matching
    (LOWER() работает только с ASCII). Дублируем каждый паттерн с заглавной
    первой буквой — этого достаточно для типичного контента."""
    if not p:
        return [p]
    if "\\" in p or p.startswith(" ") or p.endswith(" "):
        return [p]
    return [p, p[0].upper() + p[1:]]


def _build_restriction_filter_for(model, ingredients_link_field: str, restrictions: list[str]):
    """Универсальный билдер фильтра ограничений для любой модели рецепта.

    model — это Recipe или UserRecipe.
    ingredients_link_field — имя поля FK в Ingredient ('recipe_id' / 'user_recipe_id').

    Логика та же что и раньше: для veg/vegan/gluten/lactose доверяем явно
    выставленному булевому флагу, для остальных — только эвристика по паттернам.
    """
    conditions = []

    flag_map = {
        "vegan":   getattr(model, "is_vegan", None),
        "veg":     getattr(model, "is_vegetarian", None),
        "gluten":  getattr(model, "is_gluten_free", None),
        "lactose": getattr(model, "is_lactose_free", None),
    }

    for r in restrictions:
        patterns = RESTRICTION_PATTERNS.get(r)
        if not patterns:
            continue

        all_variants = []
        for p in patterns:
            all_variants.extend(_capitalized_variants(p))

        ing_fk = getattr(Ingredient, ingredients_link_field)
        ingredient_subq = (
            select(Ingredient.id)
            .where(ing_fk == model.id)
            .where(or_(*[Ingredient.name.like(f"%{p}%") for p in all_variants]))
        )
        name_match = or_(*[model.name.like(f"%{p}%") for p in all_variants])
        has_forbidden = or_(name_match, exists(ingredient_subq))

        flag_col = flag_map.get(r)
        if flag_col is not None:
            condition = or_(flag_col == True, not_(has_forbidden))  # noqa: E712
        else:
            condition = not_(has_forbidden)

        conditions.append(condition)

    return and_(*conditions) if conditions else None


def _build_cuisine_filter_for(model, cuisines: list[str]):
    """Жёсткий фильтр по кухням, поддерживающий разные регистры значений."""
    if not cuisines:
        return None
    expanded = set()
    for c in cuisines:
        if not c:
            continue
        c_clean = c.strip()
        expanded.add(c_clean)
        expanded.add(c_clean.lower())
        expanded.add(c_clean.capitalize())
    return model.cuisine.in_(list(expanded))


def _user_recipe_to_recipe_dict(ur: UserRecipe, author_name: str | None = None) -> dict:
    """Преобразует UserRecipe в dict, совместимый с RecipeOut.

    Ингредиенты у юзерского рецепта живут в той же таблице ingredients,
    поэтому работают как у обычного — просто через relationship.

    author_name передаётся отдельным параметром, чтобы вызывающая сторона
    могла подгрузить его одним JOIN'ом (избегаем N+1).
    """
    return {
        "id": ur.id + 1_000_000,  # сдвигаем ID чтобы не было коллизий с системными
        "_user_recipe_id": ur.id,
        "slug": ur.slug,
        "name": ur.name,
        "emoji": ur.emoji,
        "bg_color": ur.bg_color,
        "description": ur.description,
        "meal_type": ur.meal_type,
        "cuisine": ur.cuisine,
        "category": ur.category,
        "time_minutes": ur.time_minutes,
        # Количество порций — нужно фронту для масштабирования покупок.
        # Системные рецепты считаем как 1 порция (поля нет в Recipe).
        "servings": getattr(ur, "servings", 1) or 1,
        "kcal": ur.kcal,
        "proteins": ur.proteins,
        "fats": ur.fats,
        "carbs": ur.carbs,
        "is_vegetarian": ur.is_vegetarian,
        "is_vegan": ur.is_vegan,
        "is_fast": ur.is_fast,
        "is_gluten_free": ur.is_gluten_free,
        "is_lactose_free": ur.is_lactose_free,
        "steps": ur.steps or [],
        "tags": ur.tags or [],
        "image_url": ur.image_url,
        "ingredients": ur.ingredients,
        "created_by": ur.created_by,
        # Имя автора — для бейджа «Добавлено пользователем «Имя»» в ленте.
        # Берётся из JOIN с users; если у юзера нет имени — None, фронт
        # отрисует бейдж без имени.
        "author_name": (author_name.strip() if author_name and author_name.strip() else None),
    }


@router.get("", response_model=list[RecipeOut])
def list_recipes(
    meal_type: str | None = Query(None),
    cuisine: str | None = Query(None, description="Одна кухня (legacy)"),
    cuisines: list[str] | None = Query(None, description="Несколько кухонь — OR между ними"),
    category: str | None = Query(None),
    is_vegetarian: bool | None = Query(None),
    is_vegan: bool | None = Query(None),
    is_fast: bool | None = Query(None),
    is_gluten_free: bool | None = Query(None),
    is_lactose_free: bool | None = Query(None),
    restrictions: list[str] | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Список рецептов с фильтрами.

    Возвращает И системные рецепты, И активные (is_active=true) пользовательские —
    юзер видит их одной лентой. Свои неактивные рецепты автор видит через
    отдельный эндпоинт GET /user-recipes/me.
    """
    # ── Системные рецепты ──
    q = db.query(Recipe).options(selectinload(Recipe.ingredients))

    if meal_type:
        q = q.filter(Recipe.meal_type == meal_type)
    if cuisine and not cuisines:
        q = q.filter(Recipe.cuisine == cuisine)
    if cuisines:
        cf = _build_cuisine_filter_for(Recipe, cuisines)
        if cf is not None:
            q = q.filter(cf)
    if category:
        q = q.filter(Recipe.category == category)
    if is_vegetarian is not None:
        q = q.filter(Recipe.is_vegetarian == is_vegetarian)
    if is_vegan is not None:
        q = q.filter(Recipe.is_vegan == is_vegan)
    if is_fast is not None:
        q = q.filter(Recipe.is_fast == is_fast)
    if is_gluten_free is not None:
        q = q.filter(Recipe.is_gluten_free == is_gluten_free)
    if is_lactose_free is not None:
        q = q.filter(Recipe.is_lactose_free == is_lactose_free)
    if restrictions:
        rf = _build_restriction_filter_for(Recipe, "recipe_id", restrictions)
        if rf is not None:
            q = q.filter(rf)

    system_recipes = q.order_by(Recipe.id).all()

    # ── Активные пользовательские рецепты ──
    # Только visibility="public" — приватные рецепты (visibility="private",
    # is_active=True) не должны протекать в общую ленту, даже если is_active.
    # JOIN с users — чтобы достать author_name одним запросом, без N+1.
    uq = (
        db.query(UserRecipe, User.name.label("author_name"))
        .outerjoin(User, User.id == UserRecipe.created_by)
        .options(selectinload(UserRecipe.ingredients))
        .filter(UserRecipe.is_active == True)  # noqa: E712 — публикуем только активные
        .filter(UserRecipe.visibility == "public")
    )

    if meal_type:
        uq = uq.filter(UserRecipe.meal_type == meal_type)
    if cuisine and not cuisines:
        uq = uq.filter(UserRecipe.cuisine == cuisine)
    if cuisines:
        cf = _build_cuisine_filter_for(UserRecipe, cuisines)
        if cf is not None:
            uq = uq.filter(cf)
    if category:
        uq = uq.filter(UserRecipe.category == category)
    if is_vegetarian is not None:
        uq = uq.filter(UserRecipe.is_vegetarian == is_vegetarian)
    if is_vegan is not None:
        uq = uq.filter(UserRecipe.is_vegan == is_vegan)
    if is_fast is not None:
        uq = uq.filter(UserRecipe.is_fast == is_fast)
    if is_gluten_free is not None:
        uq = uq.filter(UserRecipe.is_gluten_free == is_gluten_free)
    if is_lactose_free is not None:
        uq = uq.filter(UserRecipe.is_lactose_free == is_lactose_free)
    if restrictions:
        rf = _build_restriction_filter_for(UserRecipe, "user_recipe_id", restrictions)
        if rf is not None:
            uq = uq.filter(rf)

    user_recipes_rows = uq.order_by(UserRecipe.id).all()

    # Объединяем в один список. Юзерские рецепты конвертируем в dict —
    # Pydantic из RecipeOut примет и model_validate(orm_obj), и model_validate(dict).
    # Имя автора передаём вторым параметром, чтобы попало в бейдж на фронте.
    combined = list(system_recipes)
    combined.extend(_user_recipe_to_recipe_dict(ur, author_name) for ur, author_name in user_recipes_rows)

    # Применяем offset/limit ПОСЛЕ объединения. Для текущего масштаба (десятки
    # рецептов) это нормально; если каталог разрастётся — стоит переделать
    # на UNION ALL в SQL.
    return combined[offset:offset + limit]


def _escape_like(s: str) -> str:
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/search", response_model=list[RecipeOut])
def search_recipes(
    q: str,
    limit: int = Query(8, ge=1, le=50),
    db: Session = Depends(get_db),
):
    if not q or len(q.strip()) < 2:
        return []
    pattern = f"%{_escape_like(q.strip())}%"

    system = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(or_(
            Recipe.name.ilike(pattern, escape="\\"),
            Recipe.description.ilike(pattern, escape="\\"),
        ))
        .order_by(Recipe.id)
        .limit(limit)
        .all()
    )

    user_part = (
        db.query(UserRecipe, User.name.label("author_name"))
        .outerjoin(User, User.id == UserRecipe.created_by)
        .options(selectinload(UserRecipe.ingredients))
        .filter(UserRecipe.is_active == True)  # noqa: E712
        .filter(UserRecipe.visibility == "public")
        .filter(or_(
            UserRecipe.name.ilike(pattern, escape="\\"),
            UserRecipe.description.ilike(pattern, escape="\\"),
        ))
        .order_by(UserRecipe.id)
        .limit(limit)
        .all()
    )

    combined = list(system)
    combined.extend(_user_recipe_to_recipe_dict(ur, author_name) for ur, author_name in user_part)
    return combined[:limit]


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Один рецепт. Поддерживает обе модели — если ID >= 1_000_000,
    значит это сдвинутый ID юзерского рецепта."""
    if recipe_id >= 1_000_000:
        row = (
            db.query(UserRecipe, User.name.label("author_name"))
            .outerjoin(User, User.id == UserRecipe.created_by)
            .options(selectinload(UserRecipe.ingredients))
            .filter(UserRecipe.id == recipe_id - 1_000_000)
            .filter(UserRecipe.is_active == True)  # noqa: E712
            .filter(UserRecipe.visibility == "public")
            .first()
        )
        if not row:
            raise HTTPException(status_code=404, detail="Рецепт не найден")
        ur, author_name = row
        return _user_recipe_to_recipe_dict(ur, author_name)

    recipe = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(Recipe.id == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    return recipe


@router.post("", response_model=RecipeOut, status_code=201)
def create_recipe(
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Создание СИСТЕМНОГО рецепта — только для админа в будущем.

    Юзеры создают свои рецепты через POST /user-recipes (uses UserRecipe table
    с is_active=False). Этот эндпоинт оставлен для импорта/seed-скриптов.
    """
    if db.query(Recipe.id).filter(Recipe.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Рецепт с таким slug уже существует")

    recipe_data = data.model_dump(exclude={"ingredients"})
    recipe = Recipe(**recipe_data, created_by=current_user.id)
    db.add(recipe)
    db.flush()
    for i, ing_data in enumerate(data.ingredients):
        payload = ing_data.model_dump()
        payload["order"] = i
        db.add(Ingredient(recipe_id=recipe.id, **payload))
    db.commit()
    db.refresh(recipe)
    return recipe