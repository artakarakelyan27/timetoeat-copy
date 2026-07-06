"""Схемы пользовательских рецептов.

Формат `UserRecipeCreate` подогнан под то что отправляет визард на фронте
(CreateRecipeView + recipeEditor.form):
  - title         → name
  - description, image_url, category, cuisine
  - prep_time_min + cook_time_min → time_minutes (сумма)
  - servings — пока не используется в БД, но принимается без ошибки
  - ingredients: [{name, amount, unit}] → quantity = amount + unit
  - steps: list[str]
  - tags: list[str]
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Any, Literal


class UserIngredientCreate(BaseModel):
    """Формат ингредиента из визарда: {name, amount, unit}."""
    name: str
    amount: str | int | float | None = None
    unit: str | None = None
    quantity: str | None = None  # альтернативный формат: уже собранная строка
    category: str | None = "📦 Прочее"


class UserIngredientOut(BaseModel):
    id: int
    name: str
    quantity: str | None = None
    category: str | None = "📦 Прочее"
    order: int = 0

    model_config = {"from_attributes": True}

    @field_validator("category", mode="before")
    @classmethod
    def _category_default(cls, v):
        return v if v is not None else "📦 Прочее"


class UserRecipeCreate(BaseModel):
    """Принимаемый payload из визарда.

    Поля совпадают с recipeEditor.form. Лишние поля Pydantic просто игнорирует
    (extra='ignore' по умолчанию), так что фронт может слать что угодно сверху.
    """
    # Принимаем оба варианта названия — title (фронтовый визард) и name (наш канон)
    title: str | None = None
    name: str | None = None

    description: str | None = None
    image_url: str | None = None
    emoji: str | None = "🍽️"
    bg_color: str | None = "#E4F5EA"

    meal_type: str | None = None
    cuisine: str | None = None
    category: str | None = None

    # Из визарда: prep_time_min + cook_time_min. Складываем в time_minutes.
    prep_time_min: int | None = None
    cook_time_min: int | None = None
    time_minutes: int | None = None

    # Количество порций. Раньше принималось, но не сохранялось — теперь
    # колонка есть в БД (миграция 001_add_servings), сохраняем как есть.
    # None / отсутствие = 1 (одна порция по умолчанию).
    servings: int | None = None

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
    ingredients: list[UserIngredientCreate] = Field(default_factory=list)
    visibility: Literal["private", "public"] = "private"


class UserRecipeOut(BaseModel):
    id: int
    name: str
    slug: str | None = None
    emoji: str | None = "🍽️"
    bg_color: str | None = "#E4F5EA"
    description: str | None = None
    meal_type: str | None = None
    cuisine: str | None = None
    category: str | None = None
    time_minutes: int | None = None
    # Количество порций, на которое рассчитан рецепт.
    # Нужно фронту для корректного масштабирования при добавлении в покупки:
    # final_amount = ing.q × adult_equivalent / servings.
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
    ingredients: list[UserIngredientOut] = Field(default_factory=list)

    # Поля юзерского рецепта
    created_by: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    # Намерение пользователя при создании. Определяет, попадёт ли рецепт
    # в общую ленту (только при visibility=public + is_active=True) или
    # останется только в личном кабинете автора.
    visibility: str = "private"
    # Имя автора — для бейджа «Добавлено пользователем «Имя»» в ленте.
    # Заполняется в роутере через JOIN с users.
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
        "is_active",
        mode="before",
    )
    @classmethod
    def _bool_default_false(cls, v):
        return False if v is None else v

    @field_validator("servings", mode="before")
    @classmethod
    def _servings_default(cls, v):
        # Защита от 0 / None в БД (хотя миграция ставит NOT NULL DEFAULT 1).
        if v is None or v == 0:
            return 1
        return v

    @field_validator("steps", "tags", mode="before")
    @classmethod
    def _list_default_empty(cls, v):
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