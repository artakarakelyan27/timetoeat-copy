/**
 * ГЕНЕРАТОР МЕНЮ НА НЕДЕЛЮ
 *
 * Алгоритм:
 *  1. Расчёт целевой калорийности и БЖУ хозяйки (на 1 человека).
 *  2. Распределение по приёмам пищи (3 или 4 — в зависимости от семьи).
 *  3. Расчёт adult_equivalent для масштабирования списка покупок.
 *  4. Жёсткая фильтрация по аллергиям и диете (никогда не смягчается).
 *  5. Постепенное смягчение «мягких» фильтров если пул < MIN_POOL_SIZE.
 *  6. Скоринг каждого рецепта для каждого слота:
 *     score = w_kcal·proximity + w_macros·proximity + w_liked + w_cuisine
 *           - w_time - w_diversity - w_hero + w_constraint + ε
 *  7. Жадный выбор top-3 со стохастикой (одно и то же меню не генерится дважды).
 *  8. В batch-режиме (cookFreq=once_week) обед/ужин фиксируется на пн-пт.
 *  9. Постпроверка: рыба ≥ 2/нед, овощи ≥ 5 дней, разнообразие ≥ 14 уникальных
 *     блюд (для daily-режима) — отражается в stats.
 *
 * Все нормы вынесены в nutritionNorms.js. Источники задокументированы там же.
 */

import {
  ADULT_EQUIVALENT, MEAL_SPLIT, shouldAddSnack,
  TOLERANCE, HEALTH_CONSTRAINTS, HERO_INGREDIENTS,
  SCORING_WEIGHTS, RELAXATION_LEVELS, MIN_POOL_SIZE,
  ALLERGEN_PATTERNS, CUISINE_PATTERNS,
  isBatchMode, isBatchSuitable,
} from './nutritionNorms.js'

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const SLOTS_3 = ['breakfast', 'lunch', 'dinner']
const SLOTS_4 = ['breakfast', 'lunch', 'dinner', 'snack']

// ═══════════════════════════════════════════════════════════════════════
// ПУБЛИЧНОЕ API
// ═══════════════════════════════════════════════════════════════════════

/**
 * Главная функция. Принимает все рецепты и prefs, возвращает недельное меню.
 *
 * @param {Array}  allRecipes — массив рецептов из menuStore.recipes
 * @param {Object} prefs      — объект из authStore.preferences (см. ниже)
 * @returns {{
 *   weekMenu: Array<{day, dayIdx, meals: Array<{slot, recipe, isBatch}>, dayKcal}>,
 *   adultEquivalent: number,
 *   mealTargets: Object,
 *   useSnack: boolean,
 *   slots: string[],
 *   fallbackApplied: Object|null,
 *   stats: Object,
 * }}
 *
 * Структура prefs (всё опционально, есть дефолты):
 *   familySize, familyTags{kids_small,kids,teens,elderly},
 *   targetKcal, targetProtein, targetFat, targetCarbs,
 *   restrictions{veg,vegan,gluten,lactose,nuts,seafood,pork,halal},
 *   cuisines{russian,italian,asian,caucasian,mediterranean,pp,fast},
 *   cookFreq('daily'|'once_week'|'weekends'), cookTime(15|30|60|90),
 *   dislikedProducts(string), likedDishIds[], dislikedDishIds[]
 *
 * Batch-режим (cookFreq === 'once_week' || 'weekends'):
 *   • Хозяйка готовит ОДНО блюдо на обед и одно на ужин в воскресенье.
 *   • Эти блюда повторяются с понедельника по пятницу (флаг isBatch=true).
 *   • К batch-кандидатам применяется фильтр isBatchSuitable
 *     (нескоропортящиеся, хорошо разогреваются — плов, рагу, лазанья и т.п.).
 *   • Ограничение cookTime НЕ применяется к batch-блюду
 *     (оно готовится один раз — можно потратить 90+ минут).
 *   • На субботу–воскресенье и на завтраки/перекусы готовится свежее блюдо.
 */
export function generateWeekMenu(allRecipes, prefs) {
  if (!allRecipes?.length) {
    return emptyResult(prefs)
  }

  const adultEquivalent = computeAdultEquivalent(prefs)
  const { slots, targets, useSnack } = computeMealTargets(prefs)

  // Шаг 1: жёсткая фильтрация (аллергии/диета/dislikedDishIds) — НИКОГДА не смягчается
  const safe = applyHardFilters(allRecipes, prefs)

  // Шаг 2: подбор минимально достаточного уровня смягчения
  const { pool, fallbackApplied } = relaxUntilEnough(safe, prefs, slots.length)

  // Шаг 3: разделение по слотам
  const poolBySlot = {}
  for (const slot of slots) poolBySlot[slot] = poolForSlot(pool, slot)

  const isBatch = isBatchMode(prefs)

  // Состояние недели — используется в скоринге для разнообразия
  const weekState = {
    usedRecipeIds: new Map(),
    usedHeroes: new Map(),
    lastDayHero: null,
    dayHasVeg: new Set(),
  }

  // ── BATCH режим: один lunch и один dinner на пн-пт ──
  // Хозяйка готовит ОДНО блюдо в воскресенье и разогревает его 5 дней.
  // Поэтому к batch-кандидатам применяем доп. фильтр isBatchSuitable.
  // НЕ применяем cookTime-ограничение к batch-блюду — оно готовится один раз.
  let batchLunch = null
  let batchDinner = null
  if (isBatch) {
    const batchLunchPool = poolBySlot.lunch.filter(isBatchSuitable)
    const batchDinnerPool = poolBySlot.dinner.filter(isBatchSuitable)

    // Если после фильтра пул совсем пустой — берём slot-пул как есть
    // (сообщим пользователю шильдиком fallbackApplied).
    const lp = batchLunchPool.length ? batchLunchPool : poolBySlot.lunch
    const dp = batchDinnerPool.length ? batchDinnerPool : poolBySlot.dinner

    // Скоринг для batch — игнорируем штраф за время готовки
    const batchPrefs = { ...prefs, cookTime: null }

    batchLunch = pickBest(lp, 'lunch', targets.lunch, batchPrefs, weekState, 1)
    if (batchLunch) registerUse(weekState, batchLunch, 1)
    batchDinner = pickBest(
        dp.filter(r => r.id !== batchLunch?.id),
        'dinner', targets.dinner, batchPrefs, weekState, 1,
    )
    if (batchDinner) registerUse(weekState, batchDinner, 1)
  }

  // ── Генерация по дням ──
  const week = DAYS.map((dayName, dayIdx) => {
    const meals = []
    weekState.lastDayHero = null

    for (const slot of slots) {
      let pick = null
      // FIX-BATCH-05: рабочая неделя в batch-режиме = Пн–Пт (5 дней).
      // В оригинале было >= 1 && <= 4 (Вт–Пт), что отсекало понедельник —
      // не соответствует продуктовому требованию «готовлю в выходные,
      // ем разогретое с понедельника по пятницу».
      const isWeekday = dayIdx >= 0 && dayIdx <= 4
      const isLunchOrDinner = slot === 'lunch' || slot === 'dinner'

      if (isBatch && isLunchOrDinner && isWeekday) {
        // Будни в batch — повторяем заготовку
        pick = (slot === 'lunch') ? batchLunch : batchDinner
      } else {
        // Свежее блюдо: понедельник, выходные, завтраки и перекусы — всегда новые
        const sp = poolBySlot[slot].filter(r =>
            !isBatch || (r.id !== batchLunch?.id && r.id !== batchDinner?.id)
        )
        pick = pickBest(sp, slot, targets[slot], prefs, weekState, dayIdx)
      }

      if (!pick) continue

      meals.push({
        slot,
        recipe: pick,
        isBatch: isBatch && isLunchOrDinner && isWeekday,
      })

      // В batch-режиме для будних обедов/ужинов учёт идёт один раз (при выборе заготовки)
      const shouldRegister = !(isBatch && isLunchOrDinner && isWeekday)
      if (shouldRegister) registerUse(weekState, pick, dayIdx)
    }

    const dayKcal = meals.reduce((s, m) => s + (recipeKcal(m.recipe) || 0), 0)
    return { day: dayName, dayIdx, meals, dayKcal }
  })

  const stats = computeWeekStats(week, prefs, isBatch)

  return {
    weekMenu: week,
    adultEquivalent,
    mealTargets: targets,
    useSnack,
    slots,
    fallbackApplied,
    stats,
  }
}

/**
 * Масштабирует ингредиенты рецепта под семью.
 * Используется в menuStore.generateShoppingList (пересчёт списка покупок).
 *
 * Формула:
 *   final = ing.amount × adultEquivalent / recipe.servings
 *
 * Логика:
 *   - recipe.servings — на сколько порций РАССЧИТАН рецепт (по умолчанию 1)
 *   - adultEquivalent — нужное число «взрослых порций» под семью
 *
 * Пример (кейс Иры):
 *   Рецепт «Паста карбонара», servings=2, спагетти=200 г
 *   Семья = 2 взрослых → adultEquivalent=2
 *   final = 200 × 2 / 2 = 200 г   (ровно столько же, как в рецепте)
 *
 *   Раньше (FIX-SERVINGS-02 bug): final = 200 × 2 = 400 г → «на 4 человека».
 *
 * @param {Object} recipe          — рецепт; recipe.servings = на сколько порций
 * @param {number} adultEquivalent — нужное «взрослых порций»
 * @returns {Array<{n, q, cat, scaled}>}
 */
export function scaleIngredients(recipe, adultEquivalent = 1) {
  const ings = recipe?.ings || recipe?.ingredients || []
  // servings рецепта: по умолчанию 1. Защищаемся от 0/null/undefined/отрицательных.
  const servings = Math.max(1, Number(recipe?.servings) || 1)
  const factor = adultEquivalent / servings

  return ings.map(ing => {
    const name = ing.n || ing.name || ''
    const qty = ing.q || ing.quantity || ''
    const cat = ing.cat || ing.category || '📦 Прочее'

    const parsed = parseQuantity(qty)
    if (!parsed) {
      // Если количество не парсится (например, «по вкусу») — оставляем как есть
      return { n: name, q: qty, cat, scaled: qty }
    }
    // Если factor === 1 (servings = adultEquivalent), числа не меняются —
    // лишний раз не зашумляем UI «4.0 шт» вместо «4 шт».
    const scaledNum = factor === 1 ? parsed.num : parsed.num * factor
    return {
      n: name,
      q: qty,
      cat,
      scaled: `${formatNumber(scaledNum)} ${parsed.unit}`.trim(),
    }
  })
}

/**
 * Пересчитывает adult_equivalent из prefs.
 * Логика: каждый активный familyTag = минимум 1 человек этой группы.
 * Остальные (familySize минус активные теги) — взрослые.
 * Минимум 1 взрослый (хозяйка) всегда есть.
 */
export function computeAdultEquivalent(prefs) {
  const familySize = Math.max(1, prefs?.familySize || 1)
  const tags = prefs?.familyTags || {}

  const nonAdults = []
  if (tags.kids_small) nonAdults.push(ADULT_EQUIVALENT.kid_small)
  if (tags.kids) nonAdults.push(ADULT_EQUIVALENT.kid)
  if (tags.teens) nonAdults.push(ADULT_EQUIVALENT.teen)
  if (tags.elderly) nonAdults.push(ADULT_EQUIVALENT.elderly)

  // Если тегов больше, чем человек в семье — усекаем (защита от противоречий)
  const usedTags = nonAdults.slice(0, Math.max(0, familySize - 1))
  const adults = familySize - usedTags.length

  const ae = adults * ADULT_EQUIVALENT.adult + usedTags.reduce((s, c) => s + c, 0)
  return Math.round(ae * 100) / 100
}

/** Целевые КБЖУ для каждого приёма пищи. */
export function computeMealTargets(prefs) {
  const tk = prefs?.targetKcal || 2000
  const tp = prefs?.targetProtein || 80
  const tf = prefs?.targetFat || 70
  const tc = prefs?.targetCarbs || 250

  const useSnack = shouldAddSnack(prefs)
  const split = useSnack ? MEAL_SPLIT.four : MEAL_SPLIT.three
  const slots = useSnack ? SLOTS_4 : SLOTS_3

  const targets = {}
  for (const slot of slots) {
    targets[slot] = {
      kcal: Math.round(tk * split[slot]),
      protein: Math.round(tp * split[slot]),
      fat: Math.round(tf * split[slot]),
      carbs: Math.round(tc * split[slot]),
    }
  }
  return { slots, targets, useSnack }
}

// ═══════════════════════════════════════════════════════════════════════
// ВНУТРЕННЕЕ
// ═══════════════════════════════════════════════════════════════════════

function emptyResult(prefs) {
  return {
    weekMenu: [],
    adultEquivalent: computeAdultEquivalent(prefs),
    mealTargets: {},
    useSnack: false,
    slots: SLOTS_3,
    fallbackApplied: null,
    stats: { avgKcal: 0, fishCount: 0, vegDaysCount: 0, uniqueRecipes: 0 },
  }
}

export function applyHardFilters(recipes, prefs) {
  const r = prefs?.restrictions || {}
  const dislikedSet = new Set((prefs?.dislikedDishIds || []).map(String))

  return recipes.filter(rec => {
    if (!rec) return false
    if (dislikedSet.has(String(rec.id))) return false

    const text = recipeFullText(rec)

    // Аллергии
    if (r.nuts && ALLERGEN_PATTERNS.nuts.test(text)) return false
    if (r.lactose && ALLERGEN_PATTERNS.lactose.test(text)) return false
    if (r.gluten && ALLERGEN_PATTERNS.gluten.test(text)) return false
    if (r.seafood && ALLERGEN_PATTERNS.seafood.test(text)) return false
    if (r.pork && ALLERGEN_PATTERNS.pork.test(text)) return false
    if (r.halal && ALLERGEN_PATTERNS.halal.test(text)) return false

    // Диета
    if (r.veg && ALLERGEN_PATTERNS.meat.test(text)) return false
    if (r.vegan && ALLERGEN_PATTERNS.animal.test(text)) return false

    return true
  })
}

function applySoftFilters(recipes, prefs, level = 0) {
  const drops = RELAXATION_LEVELS[level]?.drops || []
  const cookTimeLimit = prefs?.cookTime
  const dislikedRaw = prefs?.dislikedProducts || ''
  const dislikedWords = String(dislikedRaw)
      .toLowerCase()
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 2)

  return recipes.filter(rec => {
    const text = recipeFullText(rec)
    const time = rec.time || rec.total_time_min || 0

    // Время приготовления (с допуском +15 мин)
    if (!drops.includes('cookTime') && cookTimeLimit && time > cookTimeLimit + 15) return false

    // Нелюбимые продукты (свободный текст из онбординга)
    if (!drops.includes('dislikedProducts') && dislikedWords.length) {
      for (const w of dislikedWords) {
        if (text.includes(w)) return false
      }
    }

    return true
  })
}

function relaxUntilEnough(safe, prefs, slotsCount) {
  let level = 0
  let pool = applySoftFilters(safe, prefs, 0)
  // Нужно как минимум MIN_POOL_SIZE рецептов на каждый слот
  const need = MIN_POOL_SIZE * slotsCount

  while (pool.length < need && level < RELAXATION_LEVELS.length - 1) {
    level++
    pool = applySoftFilters(safe, prefs, level)
  }
  // Если даже после всех уровней пул мал — берём safe целиком
  if (pool.length < need && safe.length > pool.length) pool = safe

  return {
    pool,
    fallbackApplied: level > 0 ? RELAXATION_LEVELS[level] : null,
  }
}

function poolForSlot(pool, slot) {
  const matched = pool.filter(r => (r.type || r.meal_type) === slot)
  if (matched.length >= MIN_POOL_SIZE) return matched

  // Snack — особый случай: если нет рецептов с type='snack',
  // принимаем только лёгкое и быстрое (фрукт, йогурт, орехи) — kcal ≤ 200, time ≤ 10.
  // Не разрешаем «большой салат» или «тунец на гриле» как перекус.
  if (slot === 'snack') {
    if (matched.length) return matched
    return pool.filter(r => recipeKcal(r) <= 200 && (r.time || r.total_time_min || 0) <= 10)
  }

  // Для остальных слотов — добираем «совместимые» (того же типа или без типа)
  return pool.filter(r => {
    const t = r.type || r.meal_type
    return !t || t === slot
  })
}

function pickBest(pool, slot, target, prefs, weekState, dayIdx) {
  if (!pool?.length) return null
  const scored = pool.map(r => ({ r, s: scoreRecipe(r, slot, target, prefs, weekState, dayIdx) }))
  scored.sort((a, b) => b.s - a.s)
  // top-3 с равномерной случайностью — даёт разные меню при перегенерации
  const topK = Math.min(3, scored.length)
  return scored[Math.floor(Math.random() * topK)].r
}

function scoreRecipe(recipe, slot, target, prefs, weekState, dayIdx) {
  const w = SCORING_WEIGHTS
  let score = 0

  const kcal = recipeKcal(recipe)
  const protein = recipe.protein ?? (kcal * 0.15 / 4)
  const fat = recipe.fat ?? (kcal * 0.30 / 9)
  const carbs = recipe.carbs ?? (kcal * 0.55 / 4)

  // 1. Близость к целевым КБЖУ
  score += w.kcalProximity * proximity(kcal, target.kcal)
  score += w.proteinProximity * proximity(protein, target.protein)
  score += w.fatProximity * proximity(fat, target.fat)
  score += w.carbsProximity * proximity(carbs, target.carbs)

  // 2. Лайки со свайпа
  if (prefs?.likedDishIds?.includes(recipe.id)) score += w.liked

  // 3. Кухня
  const cuisine = detectCuisine(recipe)
  if (cuisine && prefs?.cuisines?.[cuisine]) score += w.cuisineMatch

  // 4. Штраф за превышение времени (мягкое — hard уже отсёк +15 мин)
  const time = recipe.time || recipe.total_time_min || 0
  if (prefs?.cookTime && time > prefs.cookTime) {
    const overshoot = (time - prefs.cookTime) / prefs.cookTime
    score -= w.timePenalty * Math.min(1, overshoot)
  }

  // 5. Разнообразие — штраф за повтор в этой неделе
  const usedCount = weekState.usedRecipeIds.get(recipe.id) || 0
  if (usedCount > 0) score -= w.diversityPenalty * usedCount

  // 6. Hero-ингредиент
  const hero = extractHero(recipe)
  if (hero) {
    const heroCount = weekState.usedHeroes.get(hero) || 0
    if (heroCount >= 2) score -= w.heroPenalty * 2
    if (weekState.lastDayHero === hero) score -= w.heroPenalty
  }

  // 7. Constraint bonus — рыба в пред. дни недели + овощи каждый день
  const text = recipeFullText(recipe)
  if (ALLERGEN_PATTERNS.fish.test(text) &&
      HEALTH_CONSTRAINTS.fish.preferDays.includes(dayIdx) &&
      slot === 'dinner') {
    score += w.constraintBonus
  }
  if (ALLERGEN_PATTERNS.veggies.test(text) && !weekState.dayHasVeg.has(dayIdx)) {
    score += w.constraintBonus * 0.5
  }

  // 8. Шум — лёгкая стохастика
  score += Math.random() * w.randomNoise

  return score
}

function registerUse(state, recipe, dayIdx) {
  state.usedRecipeIds.set(recipe.id, (state.usedRecipeIds.get(recipe.id) || 0) + 1)

  const hero = extractHero(recipe)
  if (hero) {
    state.usedHeroes.set(hero, (state.usedHeroes.get(hero) || 0) + 1)
    state.lastDayHero = hero
  }

  const text = recipeFullText(recipe)
  if (ALLERGEN_PATTERNS.veggies.test(text)) state.dayHasVeg.add(dayIdx)
}

function computeWeekStats(week, prefs, isBatch) {
  let totalKcal = 0
  let fishDays = 0
  let vegDays = 0
  const uniqueIds = new Set()

  week.forEach(d => {
    totalKcal += d.dayKcal
    let dayHasFish = false
    let dayHasVeg = false
    d.meals.forEach(m => {
      uniqueIds.add(m.recipe?.id)
      const text = recipeFullText(m.recipe)
      if (ALLERGEN_PATTERNS.fish.test(text)) dayHasFish = true
      if (ALLERGEN_PATTERNS.veggies.test(text)) dayHasVeg = true
    })
    if (dayHasFish) fishDays++
    if (dayHasVeg) vegDays++
  })

  const avgKcal = Math.round(totalKcal / 7)
  const targetKcal = prefs?.targetKcal || 2000
  const kcalDeviation = Math.abs(avgKcal - targetKcal) / targetKcal

  // В batch-режиме разнообразие меньше по определению — не считаем требованием
  const diversityThreshold = isBatch ? 5 : 14

  return {
    avgKcal,
    targetKcal,
    kcalOk: kcalDeviation <= TOLERANCE.week.kcal,
    kcalDeviation,
    fishCount: fishDays,
    fishOk: fishDays >= HEALTH_CONSTRAINTS.fish.minPerWeek,
    vegDaysCount: vegDays,
    vegOk: vegDays >= HEALTH_CONSTRAINTS.vegetables.minDaysWithVeg,
    uniqueRecipes: uniqueIds.size,
    diversityOk: uniqueIds.size >= diversityThreshold,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ХЕЛПЕРЫ
// ═══════════════════════════════════════════════════════════════════════

function recipeKcal(recipe) {
  if (!recipe) return 0
  if (typeof recipe.kcal === 'number') return recipe.kcal
  if (typeof recipe.calories === 'number') return recipe.calories
  // Если kcal записан как «540 ккал» — парсим
  const k = parseInt(recipe.kcal || recipe.calories || '0', 10)
  return isNaN(k) ? 0 : k
}

function recipeFullText(recipe) {
  if (!recipe) return ''
  const tags = (recipe.tags || []).join(' ')
  const ings = (recipe.ings || recipe.ingredients || [])
      .map(i => i.n || i.name || '').join(' ')
  return `${recipe.name || ''} ${tags} ${ings} ${recipe.desc || ''} ${recipe.category || ''}`.toLowerCase()
}

function extractHero(recipe) {
  const text = recipeFullText(recipe)
  for (const hero of HERO_INGREDIENTS) {
    if (text.includes(hero)) return hero.slice(0, 5)
  }
  return null
}

function detectCuisine(recipe) {
  const text = recipeFullText(recipe)
  for (const [key, pattern] of Object.entries(CUISINE_PATTERNS)) {
    if (pattern.test(text)) return key
  }
  return null
}

/** Линейная функция близости: 1.0 при равенстве, 0 при отклонении ≥ 30%. */
function proximity(actual, target) {
  if (!target || !actual) return 0
  const dev = Math.abs(actual - target) / target
  return Math.max(0, 1 - dev / 0.3)
}

function parseQuantity(s) {
  if (!s) return null
  const m = String(s).match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/)
  if (!m) return null
  const num = parseFloat(m[1].replace(',', '.'))
  if (isNaN(num)) return null
  return { num, unit: m[2].trim() }
}

function formatNumber(n) {
  if (n >= 100) return Math.round(n)
  if (n >= 10) return Math.round(n * 10) / 10
  return Math.round(n * 100) / 100
}