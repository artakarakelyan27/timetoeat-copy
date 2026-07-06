"""Кэш результатов матчинга сырых названий ингредиентов.

Принцип: каждое уникальное raw_name матчится один раз, результат
сохраняется здесь. Следующий вызов match() возвращает кэш за O(1).

По мере накопления в таблице 5–10k строк любой новый рецепт обрабатывается
практически мгновенно без повторного запуска алгоритмов матчинга.
"""

from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class IngredientMatchCache(Base):
    __tablename__ = "ingredient_match_cache"

    # raw_name — первичный ключ: именно то, что пришло из рецепта / списка
    raw_name = Column(String, primary_key=True, index=True)

    # NULL означает «не удалось найти совпадение» — тоже кэшируем,
    # чтобы не гонять алгоритм повторно по заведомо неизвестным строкам.
    canonical_food_id = Column(
        Integer,
        ForeignKey("canonical_foods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # 1.0 — точное совпадение, 0.75–0.99 — trigram, 0.0 — не найдено
    confidence = Column(Float, nullable=False, default=0.0)

    matched_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
