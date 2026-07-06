-- ╔════════════════════════════════════════════════════════════════╗
-- ║ Миграция 003 (ОПЦИОНАЛЬНАЯ): унификация ingredients.category  ║
-- ║                                                                ║
-- ║ Эта миграция НЕ ОБЯЗАТЕЛЬНА — патч 01 на фронте уже игнорирует ║
-- ║ ingredients.category и пересчитывает категорию через           ║
-- ║ Front/utils/categorize.js. Но если хочется иметь чистые        ║
-- ║ значения в БД (например, для аналитики, для других клиентов),  ║
-- ║ запусти эту миграцию — она нормализует имена.                  ║
-- ║                                                                ║
-- ║ Текущая статистика (что лежит сейчас):                         ║
-- ║   📦 Прочее      118244   ← никак не категоризованы            ║
-- ║   🥦 Овощи        39531                                        ║
-- ║   🧂 Специи       33561   ← фронт ждёт '🧂 Специи и приправы' ║
-- ║   🥛 Молочное     31182   ← яйца тоже здесь, надо отделить    ║
-- ║   🌾 Бакалея      22671   ← фронт ждёт '🌾 Крупы и макароны'  ║
-- ║   🍗 Птица         4877   ← фронт ждёт '🥩 Мясо и птица'      ║
-- ║   🥩 Мясо          3661                                        ║
-- ║   🐟 Рыба          1187   ← фронт ждёт '🐟 Рыба и морепродукты'║
-- ║   + ~170 записей с категориями без эмодзи                      ║
-- ║                                                                ║
-- ║ Применение:                                                    ║
-- ║   cp menuday.db menuday.bak.db                                ║
-- ║   sqlite3 menuday.db < 003_normalize_categories.sql            ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN TRANSACTION;

-- 1. Унификация эмодзи-категорий → канон CAT_ORDER на фронте
UPDATE ingredients SET category = '🥩 Мясо и птица'
WHERE category IN ('🥩 Мясо', '🍗 Птица', 'мясо и рыба');

UPDATE ingredients SET category = '🐟 Рыба и морепродукты'
WHERE category IN ('🐟 Рыба');

UPDATE ingredients SET category = '🌾 Крупы и макароны'
WHERE category IN ('🌾 Бакалея', 'бакалея');

UPDATE ingredients SET category = '🧂 Специи и приправы'
WHERE category IN ('🧂 Специи', 'специи и соусы');

UPDATE ingredients SET category = '🥛 Молочное'
WHERE category IN ('молочные продукты');

UPDATE ingredients SET category = '🍎 Фрукты и ягоды'
WHERE category IN ('фрукты и ягоды');

UPDATE ingredients SET category = '🥦 Овощи'
WHERE category IN ('овощи');

UPDATE ingredients SET category = '🥫 Консервы'
WHERE category IN ('консервы');

UPDATE ingredients SET category = '🧃 Напитки'
WHERE category IN ('напитки');

UPDATE ingredients SET category = '🍞 Хлеб и выпечка'
WHERE category IN ('хлеб и выпечка');

-- 2. Отделяем 🥚 Яйца от 🥛 Молочное (раньше всё было одной кучей)
UPDATE ingredients
SET category = '🥚 Яйца'
WHERE category = '🥛 Молочное'
  AND (LOWER(name) LIKE '%яйц%'
    OR LOWER(name) LIKE '%яичн%'
    OR LOWER(name) LIKE '%перепелин%');

-- 3. Эвристика для 📦 Прочее — категоризация по имени.
--    Тут только самые очевидные паттерны; всё остальное пусть фронт
--    переcчитает на лету через categorize.js.
UPDATE ingredients SET category = '🥚 Яйца'
WHERE category = '📦 Прочее'
  AND (LOWER(name) LIKE '%яйц%' OR LOWER(name) LIKE '%яичн%' OR LOWER(name) LIKE '%перепелин%');

UPDATE ingredients SET category = '🥩 Мясо и птица'
WHERE category = '📦 Прочее'
  AND (LOWER(name) LIKE '%говяд%'
    OR LOWER(name) LIKE '%свинин%'
    OR LOWER(name) LIKE '%свиной%'
    OR LOWER(name) LIKE '%свиная%'
    OR LOWER(name) LIKE '%курин%'
    OR LOWER(name) LIKE '%куриц%'
    OR LOWER(name) LIKE '%индейк%'
    OR LOWER(name) LIKE '%баранин%'
    OR LOWER(name) LIKE '%телятин%'
    OR LOWER(name) LIKE '%фарш%'
    OR LOWER(name) LIKE '%котлет%'
    OR LOWER(name) LIKE '%бекон%'
    OR LOWER(name) LIKE '%ветчин%'
    OR LOWER(name) LIKE '%сосиск%'
    OR LOWER(name) LIKE '%колбас%');

UPDATE ingredients SET category = '🐟 Рыба и морепродукты'
WHERE category = '📦 Прочее'
  AND (LOWER(name) LIKE '%рыб%'
    OR LOWER(name) LIKE '%сёмг%' OR LOWER(name) LIKE '%семг%'
    OR LOWER(name) LIKE '%лосос%' OR LOWER(name) LIKE '%форел%'
    OR LOWER(name) LIKE '%треск%' OR LOWER(name) LIKE '%минта%'
    OR LOWER(name) LIKE '%тунец%' OR LOWER(name) LIKE '%скумбри%'
    OR LOWER(name) LIKE '%креветк%' OR LOWER(name) LIKE '%кальмар%');

UPDATE ingredients SET category = '🛢️ Масла и соусы'
WHERE category = '📦 Прочее'
  AND (LOWER(name) LIKE '%масло %' OR LOWER(name) LIKE '%масло'
    OR LOWER(name) LIKE '%майонез%' OR LOWER(name) LIKE '%горчиц%'
    OR LOWER(name) LIKE '%кетчуп%' OR LOWER(name) LIKE '%соус%'
    OR LOWER(name) LIKE '%уксус%');

UPDATE ingredients SET category = '🍞 Хлеб и выпечка'
WHERE category = '📦 Прочее'
  AND (LOWER(name) LIKE '%хлеб%' OR LOWER(name) LIKE '%батон%'
    OR LOWER(name) LIKE '%лаваш%' OR LOWER(name) LIKE '%булочк%'
    OR LOWER(name) LIKE '%багет%');

-- ── ИТОГ ──
SELECT 'После миграции:' AS info;
SELECT category, COUNT(*) c FROM ingredients GROUP BY category ORDER BY c DESC;

COMMIT;
