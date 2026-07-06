"""
Импорт товаров из CSV (Магнит) в существующую таблицу `products`.
Подбирает связь с `ingredients_catalog` по нормализованному имени.

Запуск:
    python import_products_csv.py /var/www/time-to-eat/products.csv

Что делает:
  • Парсит quantity ("330 г", "1.5 л") → package_size + package_unit
  • Считает price_per_base_unit (цена за грамм/мл/штуку)
  • Ищет каталоговый ингредиент по совпадению значимых токенов в названии
  • Делает upsert по product_id (стабильный хэш URL)
  • Поля без данных в CSV (brand) → NULL
  • in_stock = 1 если price есть, 0 если NULL

Не дропает существующие 168 товаров — они остаются.
Перезапускать можно сколько угодно — обновятся существующие, добавятся новые.
"""
import sys
import os
import csv
import re
import argparse
import hashlib
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from sqlalchemy import text


# ─── единицы измерения и парсинг quantity ───
UNIT_MAP = {
    "г": "g", "гр": "g", "грамм": "g", "грамма": "g", "граммов": "g",
    "кг": "kg", "килограмм": "kg", "килограмма": "kg",
    "мл": "ml", "миллилитр": "ml",
    "л": "l", "литр": "l", "литра": "l", "литров": "l",
    "шт": "pcs", "штука": "pcs", "штук": "pcs",
}

# Множители для приведения к base_unit (g/ml/pcs)
TO_BASE = {
    "g": 1, "kg": 1000,
    "ml": 1, "l": 1000,
    "pcs": 1,
}


def parse_quantity(raw: str) -> tuple[float | None, str | None]:
    """
    "330 г"     → (330.0, "g")
    "1.5 л"     → (1500.0, "ml")    -- приводим к мл
    "10 шт"     → (10.0, "pcs")
    "по вкусу"  → (None, None)
    """
    if not raw:
        return None, None
    s = raw.lower().replace(",", ".").strip()

    m = re.match(r"^([\d.]+)\s*([а-я]+)\.?$", s)
    if not m:
        return None, None

    try:
        value = float(m.group(1))
    except ValueError:
        return None, None

    unit_raw = m.group(2).strip()
    unit = UNIT_MAP.get(unit_raw)
    if not unit:
        return None, None

    # приводим кг→г, л→мл (в БД остаются базовые единицы для сравнения цен)
    if unit == "kg":
        return value * 1000, "g"
    if unit == "l":
        return value * 1000, "ml"
    return value, unit


def parse_price(raw: str) -> float | None:
    if not raw or not raw.strip():
        return None
    try:
        v = float(raw.replace(",", ".").strip())
        return v if v > 0 else None
    except ValueError:
        return None


def normalize(s: str) -> str:
    """Нормализация для сопоставления с каталогом."""
    if not s:
        return ""
    s = s.lower().replace("ё", "е")
    s = re.sub(r"[^а-яa-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def stable_product_id(url: str) -> int:
    """
    Генерируем стабильный 32-битный int из URL.
    Magnit URL уже содержит число (https://magnit.ru/product/0000000658-...),
    но для надёжности — берём md5 от URL и кладём в int.
    """
    h = hashlib.md5(url.encode()).hexdigest()
    return int(h[:8], 16)  # первые 32 бита, без знака


# ─── каталог: загрузка и индексация ───
def load_catalog(db) -> tuple[dict[str, int], list[tuple[str, int]]]:
    """
    Возвращает:
      • exact_index: {normalized_name → id}  для O(1) точных совпадений
      • token_index: [(normalized_name, id)] для перебора при неточном поиске
    """
    rows = db.execute(text("SELECT id, name FROM ingredients_catalog")).fetchall()
    exact = {}
    tokens = []
    for cid, cname in rows:
        norm = normalize(cname)
        if not norm:
            continue
        exact[norm] = cid
        tokens.append((norm, cid))
    return exact, tokens


def find_ingredient_id(
    product_name: str,
    exact_index: dict[str, int],
    token_index: list[tuple[str, int]],
) -> int | None:
    """
    Ищет в каталоге наиболее подходящий ingredient_id.
    Стратегия:
      1. Точное совпадение нормализованного имени → score=∞
      2. Имя каталога — подстрока имени товара → score=len(имя_каталога)
      3. None
    Берём самый длинный матч (например 'помидоры черри' длиннее 'помидоры').
    """
    p_norm = normalize(product_name)
    if not p_norm:
        return None

    # точное совпадение редко, но проверяем
    if p_norm in exact_index:
        return exact_index[p_norm]

    # длиннейшее имя каталога которое является подстрокой
    best_id = None
    best_len = 0
    for cat_name, cat_id in token_index:
        if len(cat_name) < 3:
            continue
        # каталоговое имя должно встречаться в названии товара как **слово**
        # (через границы пробелов), иначе 'лук' матчит 'лукошко'
        pattern = rf"(^|\s){re.escape(cat_name)}(\s|$)"
        if re.search(pattern, p_norm):
            if len(cat_name) > best_len:
                best_len = len(cat_name)
                best_id = cat_id
    return best_id


# ─── сам импорт ───
def run(csv_path: str, store_id: int = 1, batch_size: int = 500) -> None:
    if not os.path.isfile(csv_path):
        print(f"❌ Файл не найден: {csv_path}")
        sys.exit(1)

    db = SessionLocal()
    try:
        print("Загружаю каталог ингредиентов...")
        exact_index, token_index = load_catalog(db)
        print(f"  каталог: {len(token_index)} записей")

        # существующие product_id для upsert
        existing = {pid for (pid,) in db.execute(
            text("SELECT product_id FROM products WHERE product_id IS NOT NULL")
        ).fetchall()}
        print(f"В таблице products уже: {len(existing)} записей с product_id")

        inserted = updated = matched = unmatched = errors = 0
        now = datetime.now(timezone.utc).isoformat()

        with open(csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, 1):
                try:
                    url = (row.get("url") or "").strip()
                    name = (row.get("name") or "").strip()
                    if not url or not name:
                        continue

                    pid = stable_product_id(url)
                    price = parse_price(row.get("price"))
                    pkg_size, pkg_unit = parse_quantity(row.get("quantity") or "")
                    ppbu = (price / pkg_size) if (price and pkg_size) else None
                    in_stock = 1 if price is not None else 0

                    # связка с каталогом
                    ing_id = find_ingredient_id(name, exact_index, token_index)
                    if ing_id:
                        matched += 1
                    else:
                        unmatched += 1

                    params = {
                        "product_id":          pid,
                        "ingredient_id":       ing_id,
                        "store_id":            store_id,
                        "name":                name,
                        "brand":               None,                      # нет в CSV
                        "package_size":        pkg_size,
                        "package_unit":        pkg_unit,
                        "price_current":       price,
                        "price_per_base_unit": ppbu,
                        "in_stock":            in_stock,
                        "last_updated":        now,
                    }

                    if pid in existing:
                        db.execute(text("""
                            UPDATE products SET
                                ingredient_id = :ingredient_id,
                                store_id = :store_id,
                                name = :name,
                                brand = :brand,
                                package_size = :package_size,
                                package_unit = :package_unit,
                                price_current = :price_current,
                                price_per_base_unit = :price_per_base_unit,
                                in_stock = :in_stock,
                                last_updated = :last_updated
                            WHERE product_id = :product_id
                        """), params)
                        updated += 1
                    else:
                        db.execute(text("""
                            INSERT INTO products (
                                product_id, ingredient_id, store_id, name, brand,
                                package_size, package_unit,
                                price_current, price_per_base_unit,
                                in_stock, last_updated
                            ) VALUES (
                                :product_id, :ingredient_id, :store_id, :name, :brand,
                                :package_size, :package_unit,
                                :price_current, :price_per_base_unit,
                                :in_stock, :last_updated
                            )
                        """), params)
                        existing.add(pid)
                        inserted += 1

                    if (inserted + updated) % batch_size == 0:
                        db.commit()
                        print(f"  {i} строк → {inserted} insert, {updated} update, "
                              f"{matched} matched")

                except Exception as e:
                    errors += 1
                    if errors <= 5:
                        print(f"  ! строка {i}: {e}")

            db.commit()

        print()
        print(f"✓ Импорт завершён:")
        print(f"  insert:   {inserted}")
        print(f"  update:   {updated}")
        print(f"  matched:  {matched}  ← привязаны к ingredients_catalog")
        print(f"  unmatched:{unmatched}  ← без связки (ingredient_id=NULL)")
        print(f"  errors:   {errors}")
    finally:
        db.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("csv_path")
    p.add_argument("--store-id", type=int, default=1, help="ID магазина (1 = Магнит)")
    a = p.parse_args()
    run(a.csv_path, store_id=a.store_id)