from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, JSON,
    DateTime, CheckConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class UserRecipe(Base):
    """Пользовательский рецепт. Структура полностью повторяет Recipe + поля
    модерации (created_by обязательный, created_at, updated_at, is_active).

    По умолчанию is_active=False — рецепт не виден в общей ленте, пока
    модератор/админ не активирует. Сам автор видит свои рецепты в любом
    статусе (отдельный экран 'Мои рецепты' — будет на клиенте).

    Лежит в отдельной таблице (а не в recipes с флагом source) — потому что
    юзерский контент имеет другой жизненный цикл: модерация, удаление, права
    редактирования, отдельные индексы по created_by/created_at для админских
    выборок. Смешивать с системным каталогом — лишний оверхед.
    """
    __tablename__ = "user_recipes"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, index=True, nullable=True)       # слаги юзерских могут дублировать системные
    name = Column(String, nullable=False)
    emoji = Column(String, default="🍽️")
    bg_color = Column(String, default="#E4F5EA")
    description = Column(Text, nullable=True)

    meal_type = Column(String, nullable=True)              # у юзерских допустимо NULL (визард не всегда указывает)
    cuisine = Column(String, nullable=True)
    category = Column(String, nullable=True)
    time_minutes = Column(Integer, nullable=True)
    kcal = Column(Float, nullable=True)
    proteins = Column(Float, nullable=True)
    fats = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)

    # Количество порций, на которое рассчитан рецепт.
    # Используется для масштабирования ингредиентов при добавлении в список
    # покупок: если рецепт на 2 порции и семья 4 человека — умножаем на 2,
    # а не на 4 (как раньше, когда servings вообще не сохранялся).
    # NOT NULL DEFAULT 1: легаси-записи считаются рассчитанными на 1 порцию.
    servings = Column(Integer, nullable=False, default=1, server_default="1")

    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_fast = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    is_lactose_free = Column(Boolean, default=False)

    steps = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    image_url = Column(String, nullable=True)

    # ── Поля специфичные для юзерских рецептов ──
    # FK на автора. NOT NULL — анонимные юзерские рецепты не допускаются.
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # Дата создания и последнего обновления — для модерации и аудита.
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    # Флаг публикации. По умолчанию false — рецепт не показывается в общей ленте.
    # Активацию делает админ через отдельный эндпоинт.
    is_active = Column(Boolean, default=False, nullable=False, index=True)

    # ── Связи ──
    author = relationship("User", foreign_keys=[created_by])
    ingredients = relationship(
        "Ingredient",
        back_populates="user_recipe",
        cascade="all, delete-orphan",
        order_by="Ingredient.order",
        primaryjoin="UserRecipe.id == Ingredient.user_recipe_id",
    )
    # Намерение пользователя при создании. 'private' — рецепт виден только
    # автору, никогда не попадает в общую ленту. 'public' — рецепт после
    # модерации (is_active=True) появится в /api/recipes.
    visibility = Column(
        String(16),
        nullable=False,
        default="private",
        server_default="private",
        index=True,
    )