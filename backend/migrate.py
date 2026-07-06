"""Миграция схемы и данных БД.

Что делает:
  1. Создаёт новые таблицы (events).
  2. recipes: добавляет колонки tags, category, created_by, is_vegan если их нет.
  3. menu_meals: создаёт UNIQUE(week_menu_id, day_index, meal_type), предварительно
     удалив дубли (оставляем строку с max(id)).
  4. Нормализует cuisine: 'русская' → 'russian', 'итальянская' → 'italian' и т.п.
  5. Автозаполняет is_vegan по ингредиентам где он NULL/false:
     если в рецепте нет животных продуктов — ставим is_vegan=true.
     ВАЖНО: только если is_vegetarian уже true (значит автор вручную пометил
     как вегетарианское) — не трогаем мясные.

Идемпотентен: повторный запуск ничего не ломает.
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import inspect, text
from app.database import engine, Base
import app.models  # регистрирует все модели


# Карта нормализации cuisine. Слева — что встречается в БД, справа — канон.
CUISINE_NORMALIZATION = {
    "русская":      "russian",
    "русский":      "russian",
    "итальянская":  "italian",
    "итальянский":  "italian",
    "азиатская":    "asian",
    "кавказская":   "caucasian",
    "средиземноморская": "mediterranean",
    "французская":  "french",
    "грузинская":   "georgian",
    "японская":     "japanese",
    "китайская":    "chinese",
    "мексиканская": "mexican",
    "американская": "american",
}


# Паттерны "не-веганских" продуктов. Если в ингредиентах рецепта нет НИ ОДНОГО
# из этих слов — рецепт считается веганским. Это лучше делать строго:
# даже намёк на молочное — не веган.
NON_VEGAN_PATTERNS = [
    # Мясо/рыба
    r"кур", r"говяд", r"телят", r"свин", r"баран", r"ягн",
    r"бекон", r"грудинк", r"карбонад", r"гуанчале", r"панчетт", r"прошютт", r"хамон",
    r"колбас", r"сосиск", r"ветчин", r"буженин", r"пастром", r"салям",
    r"фарш", r"котлет", r"стейк", r"ребрышк",
    r"индейк", r"индюш", r"утк", r"гус",
    r"печен", r"сердечк", r"почк", r"язык",
    r"сёмг", r"семг", r"лосос", r"форел", r"тунец", r"сельд", r"скумбри", r"минта",
    r"треск", r"хек", r"горбуш", r"кета", r"сардин", r"анчоус", r"рыб", r"икра",
    r"креветк", r"кальмар", r"осьминог", r"мид", r"устриц", r"краб",
    # Молочное
    r"молок", r"сливк", r"сметан", r"творог", r"кефир", r"ряженк",
    r"йогурт", r"сыр", r"пармезан", r"моцарелл", r"фета", r"брынз", r"рикотт",
    r"сливочн",  # масло сливочное
    # Яйцо и мёд
    r"яйц", r"яиц", r"омлет",
    r"мёд", r"\bмед\b",  # \b чтобы не матчить "медальон" и т.п.
]


def _has_column(conn, table: str, column: str) -> bool:
    insp = inspect(conn)
    return any(c["name"] == column for c in insp.get_columns(table))


def _has_index(conn, table: str, index_name: str) -> bool:
    insp = inspect(conn)
    return any(i["name"] == index_name for i in insp.get_indexes(table))


def _is_vegan_by_ingredients(recipe_name: str, ingredient_names: list[str]) -> bool:
    """Проверяет, является ли рецепт веганским по эвристике.

    Возвращает True если ни в названии, ни в одном из ингредиентов нет
    запрещённых паттернов.
    """
    text_blob = (recipe_name + " " + " ".join(ingredient_names)).lower()
    for pat in NON_VEGAN_PATTERNS:
        if re.search(pat, text_blob, re.IGNORECASE):
            return False
    return True


def main():
    print("→ Создаём недостающие таблицы (events, user_recipes и т.п.)...")
    Base.metadata.create_all(bind=engine)
    print("  ok")

    with engine.begin() as conn:
        # ── ingredients: пересоздаём таблицу если recipe_id всё ещё NOT NULL ──
        # SQLite не умеет ALTER COLUMN, поэтому единственный способ снять
        # NOT NULL с recipe_id — пересоздать таблицу через SELECT INTO.
        # Делаем это до добавления user_recipe_id, чтобы не пришлось
        # переделывать дважды.
        ingredients_cols = inspect(conn).get_columns("ingredients")
        recipe_id_col = next((c for c in ingredients_cols if c["name"] == "recipe_id"), None)
        needs_rebuild = recipe_id_col is not None and not recipe_id_col.get("nullable", True)
        if needs_rebuild:
            print("→ ingredients: пересоздаём таблицу (recipe_id → NULLABLE)...")
            conn.execute(text("""
                CREATE TABLE ingredients_new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    recipe_id INTEGER REFERENCES recipes(id),
                    user_recipe_id INTEGER REFERENCES user_recipes(id),
                    name VARCHAR NOT NULL,
                    quantity VARCHAR,
                    category VARCHAR DEFAULT '📦 Прочее',
                    "order" INTEGER DEFAULT 0,
                    CONSTRAINT ck_ingredient_one_parent CHECK (
                        (recipe_id IS NOT NULL AND user_recipe_id IS NULL)
                        OR (recipe_id IS NULL AND user_recipe_id IS NOT NULL)
                    )
                )
            """))
            # Переносим данные. user_recipe_id может уже существовать (если предыдущий
            # запуск миграции добавил колонку, но не пересоздал таблицу).
            old_cols = [c["name"] for c in ingredients_cols]
            select_user_recipe = "user_recipe_id" if "user_recipe_id" in old_cols else "NULL AS user_recipe_id"
            conn.execute(text(f"""
                INSERT INTO ingredients_new (id, recipe_id, user_recipe_id, name, quantity, category, "order")
                SELECT id, recipe_id, {select_user_recipe}, name, quantity, category, "order"
                FROM ingredients
            """))
            conn.execute(text("DROP TABLE ingredients"))
            conn.execute(text("ALTER TABLE ingredients_new RENAME TO ingredients"))
            conn.execute(text(
                "CREATE INDEX ix_ingredients_id ON ingredients (id)"
            ))
            conn.execute(text(
                "CREATE INDEX ix_ingredients_recipe_id ON ingredients (recipe_id)"
            ))
            conn.execute(text(
                "CREATE INDEX ix_ingredients_user_recipe_id ON ingredients (user_recipe_id)"
            ))
            print("  ok (recipe_id теперь NULL допустим, добавлен user_recipe_id и CHECK)")

        # ── ingredients: новая колонка user_recipe_id (если таблица не пересоздавалась) ──
        # Нужна для полиморфной связи (ингредиент принадлежит либо системному
        # рецепту, либо пользовательскому).
        print("→ ingredients: проверяем колонку user_recipe_id...")
        if not _has_column(conn, "ingredients", "user_recipe_id"):
            conn.execute(text(
                "ALTER TABLE ingredients ADD COLUMN user_recipe_id INTEGER "
                "REFERENCES user_recipes(id)"
            ))
            print("  + ingredients.user_recipe_id")
            try:
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_ingredients_user_recipe_id "
                    "ON ingredients (user_recipe_id)"
                ))
                print("  + ix_ingredients_user_recipe_id")
            except Exception as e:
                print(f"  ! индекс не создан: {e}")
        else:
            print("  = ingredients.user_recipe_id уже есть")

        # ── recipes: новые колонки ──
        print("→ recipes: проверяем новые колонки...")
        if not _has_column(conn, "recipes", "tags"):
            conn.execute(text("ALTER TABLE recipes ADD COLUMN tags JSON"))
            print("  + recipes.tags")
        else:
            print("  = recipes.tags уже есть")

        if not _has_column(conn, "recipes", "category"):
            conn.execute(text("ALTER TABLE recipes ADD COLUMN category VARCHAR"))
            print("  + recipes.category")
        else:
            print("  = recipes.category уже есть")

        if not _has_column(conn, "recipes", "created_by"):
            conn.execute(text("ALTER TABLE recipes ADD COLUMN created_by INTEGER"))
            print("  + recipes.created_by")
            try:
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_recipes_created_by "
                    "ON recipes (created_by)"
                ))
                print("  + ix_recipes_created_by")
            except Exception as e:
                print(f"  ! индекс не создан: {e}")
        else:
            print("  = recipes.created_by уже есть")

        if not _has_column(conn, "recipes", "is_vegan"):
            conn.execute(text(
                "ALTER TABLE recipes ADD COLUMN is_vegan BOOLEAN DEFAULT 0"
            ))
            print("  + recipes.is_vegan (default 0)")
        else:
            print("  = recipes.is_vegan уже есть")

        # ── menu_meals: UNIQUE-индекс ──
        print("→ menu_meals: уникальный индекс на (week_menu_id, day_index, meal_type)...")

        dup_rows = conn.execute(text("""
            SELECT week_menu_id, day_index, meal_type, COUNT(*) AS n
            FROM menu_meals
            GROUP BY week_menu_id, day_index, meal_type
            HAVING COUNT(*) > 1
        """)).fetchall()

        if dup_rows:
            print(f"  обнаружено дублей слотов: {len(dup_rows)}, чищу (оставляю последнюю)...")
            conn.execute(text("""
                DELETE FROM menu_meals
                WHERE id NOT IN (
                    SELECT MAX(id)
                    FROM menu_meals
                    GROUP BY week_menu_id, day_index, meal_type
                )
            """))
            print("  ok, дубли удалены")
        else:
            print("  дублей нет")

        if not _has_index(conn, "menu_meals", "uq_meal_slot"):
            conn.execute(text(
                "CREATE UNIQUE INDEX uq_meal_slot "
                "ON menu_meals (week_menu_id, day_index, meal_type)"
            ))
            print("  + uq_meal_slot")
        else:
            print("  = uq_meal_slot уже есть")

        # ── Нормализация cuisine ──
        print("→ Нормализация cuisine (русская → russian и т.п.)...")
        normalized_count = 0
        for old, new in CUISINE_NORMALIZATION.items():
            result = conn.execute(
                text("UPDATE recipes SET cuisine = :new WHERE cuisine = :old"),
                {"new": new, "old": old},
            )
            if result.rowcount:
                print(f"  '{old}' → '{new}': {result.rowcount} рецептов")
                normalized_count += result.rowcount
        if normalized_count == 0:
            print("  все cuisine уже в каноническом виде")

        # ── Автозаполнение is_vegan ──
        print("→ Автозаполнение is_vegan по ингредиентам (только для вегетарианских)...")
        # Берём только те рецепты, у которых is_vegetarian=true (автор пометил),
        # чтобы не трогать мясные. И где is_vegan ещё не выставлен.
        recipes_to_check = conn.execute(text("""
            SELECT r.id, r.name
            FROM recipes r
            WHERE r.is_vegetarian = 1
              AND (r.is_vegan = 0 OR r.is_vegan IS NULL)
        """)).fetchall()

        marked_vegan = 0
        for rid, rname in recipes_to_check:
            ings = conn.execute(
                text("SELECT name FROM ingredients WHERE recipe_id = :rid"),
                {"rid": rid},
            ).fetchall()
            ing_names = [i[0] for i in ings if i[0]]
            if _is_vegan_by_ingredients(rname, ing_names):
                conn.execute(
                    text("UPDATE recipes SET is_vegan = 1 WHERE id = :rid"),
                    {"rid": rid},
                )
                print(f"  + рецепт #{rid} '{rname}' → is_vegan=true")
                marked_vegan += 1

        if marked_vegan == 0:
            print(f"  проверено {len(recipes_to_check)} вег. рецептов, веганских не найдено")
        else:
            print(f"  помечено как веганские: {marked_vegan}")

    print("\n✓ Миграция завершена.")


if __name__ == "__main__":
    main()