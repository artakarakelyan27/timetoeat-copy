from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, JSON,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    emoji = Column(String, default="🍽️")
    bg_color = Column(String, default="#E4F5EA")
    description = Column(Text, nullable=True)

    meal_type = Column(String, nullable=False)
    cuisine = Column(String, nullable=True)
    category = Column(String, nullable=True)
    time_minutes = Column(Integer, nullable=True)
    kcal = Column(Integer, nullable=True)
    proteins = Column(Float, nullable=True)
    fats = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)

    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_fast = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    is_lactose_free = Column(Boolean, default=False)

    steps = Column(JSON, default=list)
    tags = Column(JSON, nullable=True, default=list)
    ingredient_ids = Column(JSON, nullable=True, default=None)
    image_url = Column(String, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    ingredients = relationship(
        "Ingredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="Ingredient.order",
        primaryjoin="Recipe.id == Ingredient.recipe_id",
    )
    menu_meals = relationship("MenuMeal", back_populates="recipe")
    author = relationship("User", foreign_keys=[created_by])


class Ingredient(Base):
    """Ингредиент рецепта.

    Полиморфная связь: ингредиент принадлежит ЛИБО системному рецепту
    (recipe_id), ЛИБО пользовательскому (user_recipe_id). Одно из двух полей
    обязательно заполнено, второе — NULL. CHECK на уровне БД гарантирует
    что не оба сразу и не оба NULL одновременно.

    Альтернатива (одна FK + поле source) хуже: SQLAlchemy не умеет ходить
    по такой связи без виртуальных таблиц, и удаление каскадом ломается.
    """
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True, index=True)
    user_recipe_id = Column(Integer, ForeignKey("user_recipes.id"), nullable=True, index=True)

    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)
    category = Column(String, default="📦 Прочее")
    order = Column(Integer, default=0)
    canonical_food_id = Column(Integer, ForeignKey("canonical_foods.id"), nullable=True, index=True)

    recipe = relationship("Recipe", back_populates="ingredients", foreign_keys=[recipe_id])
    user_recipe = relationship("UserRecipe", back_populates="ingredients", foreign_keys=[user_recipe_id])

    __table_args__ = (
        # XOR: ровно одна из FK заполнена. Защищает от багов кода, где случайно
        # создали ингредиент без привязки или с обоими ID одновременно.
        CheckConstraint(
            "(recipe_id IS NOT NULL AND user_recipe_id IS NULL) "
            "OR (recipe_id IS NULL AND user_recipe_id IS NOT NULL)",
            name="ck_ingredient_one_parent",
        ),
    )
