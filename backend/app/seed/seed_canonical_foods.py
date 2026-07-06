"""Сидирование справочника канонических продуктов из YAML.

Запуск:
    python -m app.seed.seed_canonical_foods

Логика:
  - Если запись с таким id уже есть — обновляем (UPSERT по id).
  - Если нет — вставляем новую.
  - Записи, которых больше нет в YAML, НЕ удаляются автоматически
    (чтобы не порвать FK из ingredient_match_cache).
"""

import os
import sys
from pathlib import Path

# Чтобы запускать как скрипт из корня проекта
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import yaml
from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models.canonical_food import CanonicalFood

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "canonical_foods.yaml"


def load_yaml() -> list[dict]:
    with open(DATA_FILE, encoding="utf-8") as f:
        return yaml.safe_load(f)


def seed(db: Session, entries: list[dict]) -> tuple[int, int]:
    """Возвращает (inserted, updated)."""
    inserted = updated = 0

    existing = {cf.id: cf for cf in db.query(CanonicalFood).all()}

    for entry in entries:
        food_id = entry["id"]
        if food_id in existing:
            cf = existing[food_id]
            cf.name = entry["name"]
            cf.aliases = entry.get("aliases", [])
            cf.category = entry.get("category", "прочее")
            cf.base_unit = entry.get("base_unit", "g")
            cf.piece_weight_g = entry.get("piece_weight_g")
            cf.density_g_per_ml = entry.get("density_g_per_ml")
            cf.kcal_per_100g = entry.get("kcal_per_100g")
            cf.protein_per_100g = entry.get("protein_per_100g")
            cf.fat_per_100g = entry.get("fat_per_100g")
            cf.carbs_per_100g = entry.get("carbs_per_100g")
            updated += 1
        else:
            cf = CanonicalFood(
                id=food_id,
                name=entry["name"],
                aliases=entry.get("aliases", []),
                category=entry.get("category", "прочее"),
                base_unit=entry.get("base_unit", "g"),
                piece_weight_g=entry.get("piece_weight_g"),
                density_g_per_ml=entry.get("density_g_per_ml"),
                kcal_per_100g=entry.get("kcal_per_100g"),
                protein_per_100g=entry.get("protein_per_100g"),
                fat_per_100g=entry.get("fat_per_100g"),
                carbs_per_100g=entry.get("carbs_per_100g"),
            )
            db.add(cf)
            inserted += 1

    db.commit()
    return inserted, updated


def main() -> None:
    # Создаём таблицу если её нет (безопасно при повторных запусках)
    Base.metadata.create_all(bind=engine, tables=[CanonicalFood.__table__])

    entries = load_yaml()
    print(f"Загружено из YAML: {len(entries)} записей")

    with Session(engine) as db:
        inserted, updated = seed(db, entries)

    print(f"✓ Вставлено: {inserted}, обновлено: {updated}")


if __name__ == "__main__":
    main()
