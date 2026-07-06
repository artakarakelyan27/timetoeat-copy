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