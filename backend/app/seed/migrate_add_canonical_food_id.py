"""Миграция: добавление canonical_food_id в таблицы ingredients и shopping_items.

Запуск (из корня проекта):
    python -m app.seed.migrate_add_canonical_food_id

Что делает:
  1. Создаёт таблицы canonical_foods и ingredient_match_cache (если нет).
  2. Добавляет колонку canonical_food_id в таблицы ingredients и shopping_items.
  3. Запускает сид canonical_foods из YAML.
  4. Прогоняет FoodMatcher по всем существующим ингредиентам (заполняет кэш
     и проставляет canonical_food_id там, где совпадение уверенное ≥ 0.70).
  5. Выводит статистику: сколько ингредиентов сматчено, сколько — нет.

Безопасность:
  - ADD COLUMN IF NOT EXISTS — идемпотентно, повторный запуск безопасен.
  - Не трогает данные, только добавляет колонку и FK.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import text, inspect
from sqlalchemy.orm import Session

from app.database import engine, Base
from app.models.canonical_food import CanonicalFood
from app.models.ingredient_match_cache import IngredientMatchCache
from app.models.recipe import Ingredient
from app.seed.seed_canonical_foods import load_yaml, seed
from app.services.food_matcher import FoodMatcher


def _column_exists(conn, table: str, column: str) -> bool:
    inspector = inspect(conn)
    cols = [c["name"] for c in inspector.get_columns(table)]
    return column in cols


def run_migration() -> None:
    print("=== Миграция: canonical_food_id ===\n")

    # 1. Создать новые таблицы
    Base.metadata.create_all(
        bind=engine,
        tables=[CanonicalFood.__table__, IngredientMatchCache.__table__],
    )
    print("✓ Таблицы canonical_foods и ingredient_match_cache созданы (или уже существуют)")

    # 2. Добавить колонки (SQLite-safe: отдельный ALTER для каждой)
    with engine.begin() as conn:
        for table in ("ingredients", "shopping_items"):
            try:
                exists = _column_exists(conn, table, "canonical_food_id")
            except Exception:
                exists = False

            if not exists:
                conn.execute(
                    text(
                        f"ALTER TABLE {table} "
                        f"ADD COLUMN canonical_food_id INTEGER "
                        f"REFERENCES canonical_foods(id)"
                    )
                )
                print(f"✓ Колонка canonical_food_id добавлена в {table}")
            else:
                print(f"  canonical_food_id уже есть в {table}, пропускаем")

    # 3. Сидировать справочник
    entries = load_yaml()
    with Session(engine) as db:
        inserted, updated = seed(db, entries)
    print(f"✓ Справочник: {inserted} вставлено, {updated} обновлено")

    # 4. Прогнать матчер по существующим ингредиентам
    MIN_SCORE = 0.70
    matched = unmatched = 0
    unmatched_names: list[str] = []

    with Session(engine) as db:
        matcher = FoodMatcher(db)
        ingredients = db.query(Ingredient).all()
        total = len(ingredients)
        print(f"\nПрогон матчера по {total} ингредиентам...")

        for ing in ingredients:
            if ing.canonical_food_id:
                continue  # уже проставлено — не трогаем

            food_id, score = matcher.match(ing.name)
            if food_id and score >= MIN_SCORE:
                ing.canonical_food_id = food_id
                matched += 1
            else:
                unmatched += 1
                unmatched_names.append(ing.name)

        db.commit()

    print(f"\n✓ Сматчено:  {matched} / {total}")
    print(f"  Не найдено: {unmatched} / {total}")

    if unmatched_names:
        unique_unmatched = sorted(set(unmatched_names))
        print(f"\nНе сматчено ({len(unique_unmatched)} уникальных):")
        for name in unique_unmatched[:50]:
            print(f"  - {name!r}")
        if len(unique_unmatched) > 50:
            print(f"  ... и ещё {len(unique_unmatched) - 50}")
        print(
            "\n→ Добавь эти названия в aliases в canonical_foods.yaml "
            "или создай новые записи, затем запусти скрипт повторно."
        )

    print("\n=== Миграция завершена ===")


if __name__ == "__main__":
    run_migration()
