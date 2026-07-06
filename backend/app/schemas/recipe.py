from pydantic import BaseModel, Field, field_validator
from typing import Any


class IngredientOut(BaseModel):
    id: int
    name: str
    quantity: str | None = None
    category: str | None = "📦 Прочее"
    order: int = 0
    canonical_food_id: int | None = None

    model_config = {"from_attributes": True}

    @field_validator("category", mode="before")
    @classmethod
    def _category_default(cls, v):
        return v if v is not None else "📦 Прочее"

    @field_validator("order", mode="before")
    @classmethod
    def _order_default(cls, v):
        return v if v is not None else 0


class CatalogIngredientOut(BaseModel):
    id: int
    name: str
    category: str | None = "прочее"

    model_config = {"from_attributes": True}


class IngredientCreate(BaseModel):
    name: str
    quantity: str | None = None
    category: str = "📦 Прочее"
    order: int = 0


class RecipeOut(BaseModel):
    """Сериализация рецепта для фронта.

    Все валидаторы mode="before" нужны потому, что в БД часть старых рецептов
    имеет NULL в полях, для которых на схеме указан non-Optional тип (bool, list).
    Pydantic v2 не подставляет дефолт автоматически когда приходит None — он
    бросает ValidationError. Поэтому на каждое такое поле висит "before"-фильтр,
    который маппит None → разумный дефолт.
    """
    id: int
    slug: str | None = None
    name: str
    emoji: str | None = "🍽️"
    bg_color: str | None = "#E4F5EA"
    description: str | None = None
    meal_type: str | None = None
    cuisine: str | None = None
    category: str | None = None
    time_minutes: int | None = None
    # Количество порций, на которое рассчитан рецепт.
    # У системных recipes колонки в БД нет — RecipeOut.servings отдаёт 1
    # (предполагаемое legacy-значение: системный рецепт считаем «на 1 порцию»).
    # У пользовательских — пробрасывается из ur.servings в _user_recipe_to_recipe_dict.
    # Фронт делит ингредиенты на servings при масштабировании под семью.
    servings: int = 1
    kcal: float | None = None
    proteins: float | None = None
    fats: float | None = None
    carbs: float | None = None
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_fast: bool = False
    is_gluten_free: bool = False
    is_lactose_free: bool = False
    steps: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    ingredients: list[IngredientOut] = Field(default_factory=list)
    catalog_ingredients: list[CatalogIngredientOut] = Field(default_factory=list)
    created_by: int | None = None
    # Имя автора — для пользовательских рецептов в общей ленте. У системных
    # рецептов остаётся None, и фронт не рисует бейдж.
    author_name: str | None = None

    model_config = {"from_attributes": True}

    @field_validator("emoji", mode="before")
    @classmethod
    def _emoji_default(cls, v):
        return v if v is not None else "🍽️"

    @field_validator("bg_color", mode="before")
    @classmethod
    def _bg_default(cls, v):
        return v if v is not None else "#E4F5EA"

    @field_validator(
        "is_vegetarian", "is_vegan", "is_fast", "is_gluten_free", "is_lactose_free",
        mode="before",
    )
    @classmethod
    def _bool_default_false(cls, v):
        return False if v is None else v

    @field_validator("servings", mode="before")
    @classmethod
    def _servings_default(cls, v):
        # У системных recipes колонки servings нет, SQLAlchemy вернёт AttributeError
        # → from_attributes даст None → нормализуем к 1.
        # Также защищаемся от случайного 0 в БД — деление на 0 в scaleIngredients.
        if v is None or v == 0:
            return 1
        return v

    @field_validator("steps", "tags", mode="before")
    @classmethod
    def _list_default_empty(cls, v):
        # SQLAlchemy с JSON-колонкой может вернуть строку (если данные положили
        # сырым SQL'ом) или None — нормализуем к списку.
        if v is None:
            return []
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except (ValueError, TypeError):
                return []
        return v


class RecipeCreate(BaseModel):
    slug: str
    name: str
    emoji: str = "🍽️"
    bg_color: str = "#E4F5EA"
    description: str | None = None
    meal_type: str
    cuisine: str | None = None
    category: str | None = None
    time_minutes: int | None = None
    kcal: float | None = None
    proteins: float | None = None
    fats: float | None = None
    carbs: float | None = None
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_fast: bool = False
    is_gluten_free: bool = False
    is_lactose_free: bool = False
    steps: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    ingredients: list[IngredientCreate] = Field(default_factory=list)