from pydantic import BaseModel, model_validator
from datetime import date
from .recipe import RecipeOut


class MenuMealOut(BaseModel):
    id: int
    day_index: int
    meal_type: str
    recipe: RecipeOut

    model_config = {"from_attributes": True}


class MenuMealSave(BaseModel):
    day_index: int
    meal_type: str
    recipe_id: int | None = None
    user_recipe_id: int | None = None

    @model_validator(mode="after")
    def _exactly_one(self) -> "MenuMealSave":
        has_sys = self.recipe_id is not None
        has_user = self.user_recipe_id is not None
        if has_sys == has_user:
            raise ValueError(
                "В слоте меню должен быть указан ровно один из recipe_id или user_recipe_id"
            )
        return self


class WeekMenuOut(BaseModel):
    id: int
    week_start: date
    name: str
    meals: list[MenuMealOut]

    model_config = {"from_attributes": True}


class WeekMenuSave(BaseModel):
    week_start: date | None = None
    name: str = "Меню на неделю"
    meals: list[MenuMealSave]


# ── Генерация меню (этап A: расчёт на бэке) ────────────────────────────
class GeneratedMealOut(BaseModel):
    """Слот сгенерированного меню. id — MenuMeal.id (для сохранённого меню)
    или порядковый индекс (для preview без сохранения)."""
    id: int | None = None
    day_index: int
    meal_type: str
    is_batch: bool = False
    recipe: RecipeOut


class GeneratedMenuOut(BaseModel):
    id: int | None = None
    week_start: date
    name: str
    meals: list[GeneratedMealOut]


class MenuGenerationOut(BaseModel):
    """Полный ответ генератора: меню + метаданные для бейджей/шильдиков фронта."""
    menu: GeneratedMenuOut
    adult_equivalent: float
    meal_targets: dict = {}
    use_snack: bool = False
    slots: list[str] = []
    fallback_applied: dict | None = None
    stats: dict = {}


class MenuGenerateIn(BaseModel):
    """Тело для авторизованной генерации.

    seed=None → стабильный seed(user, week): перезагрузка даёт то же меню.
    preferences=None → берутся сохранённые current_user.preferences. Клиент может
    прислать актуальные prefs (например, ещё не синхронизированные с сервером через
    профиль) — расчёт всё равно целиком на бэке.
    """
    seed: int | None = None
    preferences: dict | None = None


class MenuGeneratePreviewIn(BaseModel):
    """Тело для онбординга (без юзера): prefs передаются явно, меню не сохраняется."""
    preferences: dict | None = None
    seed: int | None = None