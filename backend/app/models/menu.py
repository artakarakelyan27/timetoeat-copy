from sqlalchemy import Column, Integer, String, ForeignKey, Date, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class WeekMenu(Base):
    """Один план питания на неделю для пользователя."""
    __tablename__ = "week_menus"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    name = Column(String, default="Меню на неделю")

    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_user_week"),
    )

    user = relationship("User", back_populates="week_menus")
    meals = relationship("MenuMeal", back_populates="week_menu", cascade="all, delete-orphan")


class MenuMeal(Base):
    """Одно блюдо в плане питания.

    Ссылается ЛИБО на системный рецепт (recipe_id), ЛИБО на пользовательский
    (user_recipe_id) — ровно один из двух. CHECK-констрейнт это гарантирует.
    """
    __tablename__ = "menu_meals"

    id = Column(Integer, primary_key=True, index=True)
    week_menu_id = Column(Integer, ForeignKey("week_menus.id"), nullable=False)
    # Системный рецепт. Nullable — слот может ссылаться на user_recipe вместо этого.
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    # Пользовательский рецепт. Null для системных слотов.
    user_recipe_id = Column(Integer, ForeignKey("user_recipes.id"), nullable=True)
    day_index = Column(Integer, nullable=False)   # 0=Пн … 6=Вс
    meal_type = Column(String, nullable=False)    # breakfast/lunch/dinner/snack

    __table_args__ = (
        # UNIQUE убран намеренно: пользователь может добавить несколько блюд
        # в один слот (например, суп + второе на обед, или несколько блюд
        # на ужин). Дедупликация дублей при сохранении делается на фронте.
        CheckConstraint(
            "(recipe_id IS NOT NULL AND user_recipe_id IS NULL) "
            "OR (recipe_id IS NULL AND user_recipe_id IS NOT NULL)",
            name="ck_meal_recipe_xor",
        ),
    )

    week_menu = relationship("WeekMenu", back_populates="meals")
    recipe = relationship("Recipe", back_populates="menu_meals")
    user_recipe = relationship("UserRecipe", foreign_keys=[user_recipe_id])