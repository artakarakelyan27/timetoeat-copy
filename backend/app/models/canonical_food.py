"""Канонический справочник продуктов питания.

Каждая запись — «эталонное» понятие (например «куриное филе»), к которому
привязываются:
  - Ingredient.canonical_food_id  (строка ингредиента рецепта)
  - ShoppingItem.canonical_food_id (позиция списка покупок)
  - store product (товар магазина при сравнении цен)

Это позволяет объединять «куриная грудка 400 г» + «куриное филе 200 г»
из разных рецептов в одну строку списка покупок.
"""

from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base


class CanonicalFood(Base):
    __tablename__ = "canonical_foods"

    # ID выбирается по диапазону категорий:
    #   1xxx — молочные продукты / яйца
    #   2xxx — мясо и рыба
    #   3xxx — овощи
    #   4xxx — фрукты и ягоды
    #   5xxx — бакалея (крупы, мука, макароны, масло)
    #   6xxx — консервы
    #   7xxx — специи, соусы, приправы
    #   8xxx — хлеб и выпечка
    #   9xxx — напитки
    #   9900+ — прочее (добавляется вручную при необходимости)
    id = Column(Integer, primary_key=True)

    # Каноническое название — единственное и нормализованное
    name = Column(String, nullable=False, unique=True, index=True)

    # Список написаний из рецептов / пользовательского ввода
    # SQLite: JSON; PostgreSQL: можно заменить на ARRAY(String)
    aliases = Column(JSON, nullable=False, default=list)

    # Категория для группировки в списке покупок
    # Значения: "молочные продукты", "мясо и рыба", "овощи",
    #           "фрукты и ягоды", "бакалея", "консервы",
    #           "специи и соусы", "хлеб и выпечка", "напитки", "прочее"
    category = Column(String, nullable=False, index=True)

    # Базовая единица для суммирования: "g" | "ml" | "piece"
    base_unit = Column(String(8), nullable=False, default="g")

    # Сколько граммов в 1 штуке (яйцо ≈ 60 г, куриная грудка ≈ 250 г)
    # Нужно для конвертации piece → g
    piece_weight_g = Column(Float, nullable=True)

    # Плотность (г/мл) для перевода объёма в граммы (молоко 1.03, мука 0.6)
    density_g_per_ml = Column(Float, nullable=True)

    # Нутрициология — на 100 г (или 100 мл для жидкостей)
    kcal_per_100g = Column(Float, nullable=True)
    protein_per_100g = Column(Float, nullable=True)
    fat_per_100g = Column(Float, nullable=True)
    carbs_per_100g = Column(Float, nullable=True)

    def __repr__(self) -> str:
        return f"<CanonicalFood id={self.id} name={self.name!r}>"
