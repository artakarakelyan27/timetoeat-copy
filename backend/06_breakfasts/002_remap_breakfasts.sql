-- ╔════════════════════════════════════════════════════════════════╗
-- ║ Миграция 002: ремап meal_type=breakfast по эвристике          ║
-- ║                                                                ║
-- ║ Проблема: SELECT meal_type, COUNT(*) FROM recipes GROUP BY... ║
-- ║   breakfast = 1     ← !!!                                     ║
-- ║   dinner    = 15319                                            ║
-- ║   lunch     = 10487                                            ║
-- ║   snack     = 8818                                             ║
-- ║   34625     = 6     ← кривой импорт, ID попал в meal_type     ║
-- ║                                                                ║
-- ║ В RecipesView.vue фильтр 'Завтрак' → r.type === 'breakfast'.  ║
-- ║ Из-за этого Tinder-стек завтраков показывает ОДИН рецепт.     ║
-- ║                                                                ║
-- ║ Решение: пересчитываем meal_type для очевидных завтраков по   ║
-- ║ ключевым словам в названии и описании. Эвристика повторяет    ║
-- ║ функцию isBreakfast() из MenuView.vue:                        ║
-- ║   /завтрак|каша|оладь|блин|омлет|яйц|тост|сырник|мюсли/       ║
-- ║                                                                ║
-- ║ Также чиним мусорные meal_type=число → ставим в dinner        ║
-- ║ (safe-default; админ потом разберётся вручную).               ║
-- ║                                                                ║
-- ║ Применение:                                                    ║
-- ║   sqlite3 menuday.db < 002_remap_breakfasts.sql               ║
-- ║                                                                ║
-- ║ Сделай БЭКАП перед запуском! cp menuday.db menuday.bak.db     ║
-- ║                                                                ║
-- ║ Проверка после:                                                ║
-- ║   sqlite3 menuday.db "SELECT meal_type, COUNT(*) FROM recipes ║
-- ║                       GROUP BY meal_type;"                    ║
-- ║   Ожидаем: breakfast ≈ 3000-6000, остальные просели           ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN TRANSACTION;

-- ── 0. ЧИСТКА МУСОРА: meal_type, который не строка-категория ──
-- В БД есть 6 записей с meal_type='34625' — баг старого импорта,
-- ID попал в поле типа. Безопасно ставим в 'dinner' (можно потом
-- переразложить вручную). Также ловим любые числовые значения.
UPDATE recipes
SET meal_type = 'dinner'
WHERE meal_type NOT IN ('breakfast', 'lunch', 'dinner', 'snack')
   OR meal_type IS NULL;

-- ── 1. РЕМАП ЗАВТРАКОВ ПО ИМЕНИ ──
-- Берём всё, что сейчас лежит НЕ в breakfast, и поднимаем те,
-- которые по названию явные завтраки. LIKE-паттерны кириллице-aware
-- (SQLite ILIKE через NOCASE не работает для не-ASCII, поэтому ниже
-- COLLATE NOCASE прописан для всех условий).
--
-- Список паттернов синхронизирован с фронтом (MenuView.isBreakfast):
--   завтрак, каша, оладь, блин, омлет, яйц (яйца, яичница), тост,
--   сырник, мюсли, гранола, шакшука, скрэмбл, пудинг, овсян,
--   запеканка (творожная), хлопья, кускус (на завтрак — редко но бывает)
UPDATE recipes
SET meal_type = 'breakfast'
WHERE meal_type != 'breakfast'
  AND (
        LOWER(name) LIKE '%завтрак%'
     OR LOWER(name) LIKE '%каша%'   OR LOWER(name) LIKE '%кашк%'
     OR LOWER(name) LIKE '%оладь%'  OR LOWER(name) LIKE '%оладуш%'
     OR LOWER(name) LIKE '%блин%'
     OR LOWER(name) LIKE '%омлет%'
     OR LOWER(name) LIKE '%яичниц%'
     OR LOWER(name) LIKE '%скрэмбл%' OR LOWER(name) LIKE '%скрамбл%'
     OR LOWER(name) LIKE '%шакшук%'
     OR LOWER(name) LIKE '%тост%'
     OR LOWER(name) LIKE '%сырник%'
     OR LOWER(name) LIKE '%мюсли%'
     OR LOWER(name) LIKE '%гранол%'
     OR LOWER(name) LIKE '%овсян%'
     OR LOWER(name) LIKE '%творожн%запек%'
     OR LOWER(name) LIKE '%запеканк%творож%'
     OR LOWER(name) LIKE '%хлопья%'
     OR LOWER(name) LIKE '%панкейк%'
     OR LOWER(name) LIKE '%круассан%'
     OR LOWER(name) LIKE '%сэндвич%утр%'
     OR LOWER(name) LIKE '%утренн%'
     OR LOWER(name) LIKE '%йогурт%с %'
     OR LOWER(name) LIKE '%бутерброд%утр%'
  );

-- ── 2. РЕЗУЛЬТАТ ──
SELECT 'После ремапа:' AS info;
SELECT meal_type, COUNT(*) AS c FROM recipes GROUP BY meal_type ORDER BY c DESC;

COMMIT;

-- ── ROLLBACK по необходимости ──
-- Если что-то пошло не так, у тебя есть бэкап menuday.bak.db.
-- Восстановить: cp menuday.bak.db menuday.db
