/**
 * src/stores/menuStore.js
 *
 * ОБНОВЛЁННАЯ ВЕРСИЯ (после внедрения mealPlanGenerator).
 * Изменения относительно оригинала:
 *  + Импорт generateWeekMenu, scaleIngredients, computeAdultEquivalent
 *  + Новая action: regenerateWeekMenu(prefs) — перегенерирует меню по prefs
 *  + generateShoppingList теперь принимает prefs и масштабирует количества
 *    под adult_equivalent семьи
 *  + Геттер lastGenerationStats — для UI (бейджи "Рыба 2/2", "Овощи 5/7" и т.п.)
 *  + Геттер lastFallbackApplied — для шильдика "Меню адаптировано: …"
 *
 * Всё остальное — без изменений (auth headers, fetchRecipes, savedRecipes, и т.д.).
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  generateWeekMenu,
  scaleIngredients,
  computeAdultEquivalent,
} from '@/utils/mealPlanGenerator'
import { augmentRecipeVisual } from '@/utils/recipeVisual'
import {
  validateProductMatch,
  computeAdjustedPrice,
  normalizeIngredientName,
} from '@/utils/priceMatching'
import { categorize } from '@/utils/categorize'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function getMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function authHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

// ───────────────────────────────────────────────────────────────────────
// УМНОЕ СУММИРОВАНИЕ КОЛИЧЕСТВ (для генерации списка покупок)
// ───────────────────────────────────────────────────────────────────────
// Раньше при объединении дублей использовалась простая конкатенация:
//   "4 шт" + " + 8 шт" + " + 4 шт"  →  "4 шт + 8 шт + 4 шт"
// Теперь приводим единицы к канонической форме и суммируем числа,
// показывая пользователю ИТОГ:  "4 шт + 8 шт + 4 шт"  →  "16 шт".
const UNIT_ALIASES = {
  'г': 'г', 'гр': 'г', 'грамм': 'г', 'граммов': 'г', 'грамма': 'г',
  'кг': 'кг', 'килограмм': 'кг', 'килограмма': 'кг', 'кило': 'кг',
  'мл': 'мл', 'миллилитр': 'мл',
  'л': 'л', 'литр': 'л', 'литра': 'л', 'литров': 'л',
  'шт': 'шт', 'штук': 'шт', 'штуки': 'шт', 'штука': 'шт',
  'ст. л': 'ст. л.', 'ст.л': 'ст. л.', 'ст.л.': 'ст. л.', 'столовая ложка': 'ст. л.', 'ст. л.': 'ст. л.',
  'ч. л': 'ч. л.', 'ч.л': 'ч. л.', 'ч.л.': 'ч. л.', 'чайная ложка': 'ч. л.', 'ч. л.': 'ч. л.',
  'стакан': 'ст.', 'стакана': 'ст.', 'стаканов': 'ст.', 'ст': 'ст.',
  'щепотка': 'щеп.', 'щеп': 'щеп.', 'щеп.': 'щеп.',
}

function parseQtyParts(qStr) {
  if (!qStr) return []
  const parts = String(qStr).split(/\s*\+\s*/)
  const result = []
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^([\d.,/]+)\s*(.*)$/)
    if (m) {
      const num = parseFloat(m[1].replace(',', '.')) || 0
      const rawUnit = m[2].trim().toLowerCase()
      const unit = UNIT_ALIASES[rawUnit] || rawUnit || 'шт'
      result.push({ num, unit })
    } else {
      result.push({ num: null, unit: trimmed })
    }
  }
  return result
}

function combineQty(existingQ, addQ) {
  const byUnit = new Map()
  const unknowns = new Set()
  for (const part of [...parseQtyParts(existingQ), ...parseQtyParts(addQ)]) {
    if (part.num !== null) {
      byUnit.set(part.unit, (byUnit.get(part.unit) || 0) + part.num)
    } else if (part.unit) {
      unknowns.add(part.unit)
    }
  }
  const out = []
  for (const [unit, num] of byUnit) {
    const display = Number.isInteger(num) ? num : parseFloat(num.toFixed(2))
    out.push(`${display} ${unit}`)
  }
  for (const u of unknowns) out.push(u)
  return out.join(' + ')
}

export const useMenuStore = defineStore('menu', () => {

  // ─── STATE ───
  const recipes = ref([])
  const recipesLoading = ref(false)
  const menuLoading = ref(false)
  const createdRecipes = ref([])

  const weekMenu = ref(DAY_NAMES.map(date => ({ date, kcal: 0, meals: [] })))
  const shopItems = ref([])

  // Метаданные последней генерации — для UI (шильдик, бейджи)
  const lastGenerationStats = ref(null)
  const lastFallbackApplied = ref(null)
  const lastAdultEquivalent = ref(1)

  let _savedIdsRaw = []
  try { _savedIdsRaw = JSON.parse(localStorage.getItem('pwa_savedRecipes') || '[]') } catch { _savedIdsRaw = [] }
  const savedIds = ref(_savedIdsRaw)
  watch(savedIds, (v) => localStorage.setItem('pwa_savedRecipes', JSON.stringify(v)), { deep: true })

  const savedRecipes = computed(() =>
      savedIds.value.map(id => recipes.value.find(r => r.id === id)).filter(Boolean)
  )

  // ─── OFFLINE FALLBACK ───
  try { const savedMenu = localStorage.getItem('pwa_weekMenu'); if (savedMenu) weekMenu.value = JSON.parse(savedMenu) } catch { }
  const SHOP_VERSION = 2  // bump на каждый breaking change структуры shopItems
  try {
    const savedShop = localStorage.getItem('pwa_shopItems')
    const savedVer = parseInt(localStorage.getItem('pwa_shopItems_v') || '0', 10)
    if (savedShop && savedVer === SHOP_VERSION) shopItems.value = JSON.parse(savedShop)
    else localStorage.removeItem('pwa_shopItems')
    localStorage.setItem('pwa_shopItems_v', String(SHOP_VERSION))
  } catch { }

  watch(weekMenu, (v) => localStorage.setItem('pwa_weekMenu', JSON.stringify(v)), { deep: true })
  watch(shopItems, (v) => localStorage.setItem('pwa_shopItems', JSON.stringify(v)), { deep: true })

  // ─── API: РЕЦЕПТЫ ───
  async function fetchRecipes(filters = {}) {
    recipesLoading.value = true
    try {
      // Преобразуем preferences пользователя в query-параметры для бэка.
      // Бэк принимает:
      //   - restrictions: список ['vegan', 'veg', 'gluten', 'lactose', 'pork', ...]
      //   - cuisines: список ['italian', 'russian', ...]
      // Передаём только если в prefs реально что-то выбрано — иначе фронт
      // получит ВСЕ рецепты и сможет работать в режиме "Подходит мне" опционально.
      const qs = new URLSearchParams()

      // Прокидываем простые фильтры (meal_type, is_fast и т.п.)
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== '') qs.append(k, v)
      }

      // restrictions и cuisines в prefs могут быть в двух форматах:
      //   1) Массив: ['veg', 'gluten']  — новый формат
      //   2) Объект: { veg: true, gluten: false, ... } — текущий формат онбординга
      // Нормализуем оба к массиву строк.
      const r = filters.preferences || null
      if (r) {
        const toArray = (val) => {
          if (Array.isArray(val)) return val.filter(Boolean)
          if (val && typeof val === 'object') {
            return Object.entries(val).filter(([, v]) => v).map(([k]) => k)
          }
          return []
        }

        for (const rest of toArray(r.restrictions)) qs.append('restrictions', rest)
        for (const c of toArray(r.cuisines)) qs.append('cuisines', c)
      }

      // limit повышаем — фронт сам пагинирует/фильтрует, но если бэк
      // отдаст усечённую выдачу, лента быстро закончится.
      if (!qs.has('limit')) qs.append('limit', '500')

      const url = `${API_URL}/recipes${qs.toString() ? '?' + qs.toString() : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Ошибка загрузки рецептов')
      const data = await res.json()
      recipes.value = data.map(r => augmentRecipeVisual({
        id: String(r.id),
        name: r.name,
        emoji: r.emoji,
        bg: r.bg_color,
        type: r.meal_type,
        time: r.time_minutes,
        // Количество порций — нужно для масштабирования покупок под семью.
        // Бэк отдаёт 1 для системных рецептов (legacy: считаем «на 1 порцию»)
        // и реальное значение для пользовательских (после миграции 001).
        servings: Math.max(1, Number(r.servings) || 1),
        kcal: r.kcal,
        // Бэк отдаёт proteins/fats/carbs — раньше тут было protein/fat (опечатка),
        // из-за чего скоринг по БЖУ всегда работал с фолбэком от kcal.
        protein: r.proteins,
        fat: r.fats,
        carbs: r.carbs,
        category: r.category,
        tags: r.tags || [],
        isVeg: r.is_vegetarian,
        isVegan: r.is_vegan,
        isFast: r.is_fast,
        isGlutenFree: r.is_gluten_free,
        isLactoseFree: r.is_lactose_free,
        cuisine: r.cuisine,
        desc: r.description,
        steps: r.steps,
        ings: (r.ingredients || []).map(i => ({ n: i.name, q: i.quantity, cat: i.category, cid: i.canonical_food_id ?? null })),
        // ── ПОЛЯ АВТОРА ─────────────────────────────────────────────
        // Используются для бейджа «Добавлено пользователем «имя»» в ленте.
        // Defensive чтение: бэк может отдавать author_name напрямую (через
        // JOIN с users) или вложенным объектом author.name. Если ни одного
        // поля нет — бейдж просто не отрисуется.
        // isUserRecipe true ставится по любому маркеру: created_by, явный
        // флаг is_user_recipe или присутствие author_name. Это позволяет
        // фронту не зависеть от точного формата ответа бэка.
        authorName: r.author_name || r.author?.name || null,
        createdBy: r.created_by ?? r.author?.id ?? null,
        isUserRecipe: !!(r.created_by || r.is_user_recipe || r.author_name || r.author?.name),
      }))
    } catch (e) {
      console.error('Не удалось загрузить рецепты:', e)
    } finally {
      recipesLoading.value = false
    }
  }

  // ─── API: МОИ РЕЦЕПТЫ (создан пользователем) ───
  // Грузит /user-recipes/me — все рецепты текущего пользователя независимо
  // от visibility и is_active. Видны автору в ЛК даже если на модерации.
  async function fetchCreatedRecipes() {
    const token = localStorage.getItem('token')
    if (!token) {
      // Без авторизации показываем пустой список — пустое состояние SavedView
      // приглашает создать первый рецепт.
      createdRecipes.value = []
      return
    }
    try {
      const res = await fetch(`${API_URL}/user-recipes/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        console.error('[fetchCreatedRecipes] HTTP', res.status)
        return
      }
      const data = await res.json()
      createdRecipes.value = data.map(r => augmentRecipeVisual({
        // ID юзерских рецептов сдвигаем на +1_000_000, чтобы не пересекаться
        // с системными — тот же сдвиг, что использует общий каталог /recipes.
        id: String(r.id + 1_000_000),
        _userRecipeId: r.id,
        name: r.name,
        emoji: r.emoji,
        bg: r.bg_color,
        type: r.meal_type,
        time: r.time_minutes,
        // FIX-SERVINGS-03: пробрасываем servings, чтобы scaleIngredients знал
        // на сколько порций рассчитан рецепт. Бэк отдаёт после миграции 001;
        // если поле отсутствует или 0 — fallback на 1 (legacy-запись).
        servings: Math.max(1, Number(r.servings) || 1),
        kcal: r.kcal,
        protein: r.proteins,
        fat: r.fats,
        carbs: r.carbs,
        category: r.category,
        tags: r.tags || [],
        isVeg: r.is_vegetarian,
        isVegan: r.is_vegan,
        isFast: r.is_fast,
        isGlutenFree: r.is_gluten_free,
        isLactoseFree: r.is_lactose_free,
        cuisine: r.cuisine,
        desc: r.description,
        steps: r.steps,
        ings: (r.ingredients || []).map(i => ({ n: i.name, q: i.quantity, cat: i.category, cid: i.canonical_food_id ?? null })),
        // Метаданные модерации — для будущих UI-меток
        // («приватный», «на модерации», «опубликован»).
        visibility: r.visibility || 'private',
        isActive: r.is_active,
        authorName: r.author_name || null,
        createdBy: r.created_by ?? null,
        isUserRecipe: true,
      }))
    } catch (e) {
      console.error('[fetchCreatedRecipes] error:', e)
    }
  }

  // ─── API: УДАЛИТЬ СВОЙ РЕЦЕПТ ───
  // Дёргает DELETE /user-recipes/{id} и убирает запись из локального массива.
  // На бэке принимает реальный ID (без сдвига +1_000_000), поэтому исходный
  // ID достаём из поля _userRecipeId, которое мы записали в fetchCreatedRecipes.
  // Возвращает true при успехе — UI может ориентироваться на это для тоста.
  async function deleteCreatedRecipe(id) {
    const token = localStorage.getItem('token')
    if (!token) return false

    const recipe = createdRecipes.value.find(r => r.id === String(id))
    if (!recipe) return false

    // Бэковский ID без префикса +1_000_000.
    const realId = recipe._userRecipeId ?? (Number(id) - 1_000_000)

    try {
      const res = await fetch(`${API_URL}/user-recipes/${realId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      // 204 — успех; 404 — рецепт уже удалён (тоже считаем успехом).
      if (!res.ok && res.status !== 404) {
        console.error('[deleteCreatedRecipe] HTTP', res.status)
        return false
      }
    } catch (e) {
      console.error('[deleteCreatedRecipe] network error:', e)
      return false
    }

    // Удаляем локально только после успеха на сервере.
    createdRecipes.value = createdRecipes.value.filter(r => r.id !== String(id))

    // Бонус: если этот рецепт стоял в недельном меню — удаляем все его слоты,
    // чтобы не было битых ссылок (getRecipeById вернёт null после удаления).
    weekMenu.value.forEach(day => {
      day.meals = day.meals.filter(m => m.dishId !== String(id))
    })

    return true
  }

  // ─── API: ЗАГРУЗИТЬ МЕНЮ ───
  async function fetchWeekMenu() {
    const token = localStorage.getItem('token')
    if (!token) return

    menuLoading.value = true
    try {
      const weekStart = getMonday()
      const res = await fetch(`${API_URL}/menu/week/${weekStart}`, {
        headers: authHeaders(),
      })
      if (res.status === 404) return
      if (!res.ok) throw new Error('Не удалось загрузить меню')

      const data = await res.json()
      weekMenu.value = DAY_NAMES.map(date => ({ date, kcal: 0, meals: [] }))

      data.meals.forEach(meal => {
        const day = weekMenu.value[meal.day_index]
        if (!day) return
        day.meals.push({
          id: String(meal.id),
          type: meal.meal_type,
          dishId: String(meal.recipe.id),
        })
      })

      weekMenu.value.forEach((_, idx) => recalculateDayKcal(idx))

      // Подгружаем пользовательские рецепты параллельно — они нужны
      // для getRecipeById когда меню содержит блюда из «Мои рецепты».
      // fire-and-forget: ошибка не должна ронять загрузку меню.
      fetchCreatedRecipes().catch(() => { })

    } catch (e) {
      console.error('Не удалось загрузить меню:', e)
    } finally {
      menuLoading.value = false
    }
  }

  // ─── API: СОХРАНИТЬ МЕНЮ ───
  // FIX-SAVE-01: раньше ошибки PUT молча шли в console.error и не отличались
  // от успеха — баг с `deduped` в бэке (NameError → 500) полгода жил незаметно,
  // потому что `await fetch(...)` НЕ кидает на не-2xx ответы. Теперь:
  //   1. Проверяем res.ok и кидаем на 4xx/5xx, чтобы было видно в логах.
  //   2. Храним промис последнего сохранения в _savePromise — критические
  //      места (doClear, doReset, навигация) могут await-ить flushSave().
  //   3. saveError — ref для UI, чтобы показать toast при провале.
  let _saveTimer = null
  let _savePromise = null
  const saveError = ref(null)

  function _doSave() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.resolve()

    const weekStart = getMonday()
    const meals = []

    weekMenu.value.forEach((day, dayIdx) => {
      day.meals.forEach(meal => {
        const numericId = parseInt(meal.dishId, 10)
        if (Number.isNaN(numericId)) return

        // ID >= 1_000_000 — пользовательский рецепт (сдвиг из fetchCreatedRecipes).
        // Бэк принимает user_recipe_id без сдвига — реальный ID в user_recipes.
        // ID < 1_000_000 — системный, уходит в recipe_id как раньше.
        const isUserRecipe = numericId >= 1_000_000
        meals.push({
          day_index: dayIdx,
          meal_type: meal.type,
          ...(isUserRecipe
                  ? { user_recipe_id: numericId - 1_000_000 }
                  : { recipe_id: numericId }
          ),
        })
      })
    })

    return fetch(`${API_URL}/menu/week/${weekStart}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ week_start: weekStart, meals }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Save failed: ${res.status} ${body.slice(0, 200)}`)
      }
      saveError.value = null
    }).catch((e) => {
      console.error('Не удалось сохранить меню:', e)
      saveError.value = e.message || 'save_failed'
      throw e
    })
  }

  function saveWeekMenu() {
    clearTimeout(_saveTimer)
    _saveTimer = setTimeout(() => {
      _saveTimer = null
      _savePromise = _doSave()
    }, 500)
  }

  // FIX-SAVE-02: flushSave() — форсирует немедленную отправку pending-сохранения
  // и ждёт завершения. Используется в критических путях, где нельзя допустить,
  // чтобы fetchWeekMenu прочитал устаревшее состояние с сервера.
  async function flushSave() {
    if (_saveTimer) {
      clearTimeout(_saveTimer)
      _saveTimer = null
      _savePromise = _doSave()
    }
    if (_savePromise) {
      try { await _savePromise } catch { /* error уже в saveError */ }
      _savePromise = null
    }
  }

  // FIX-CLEAR-03: «синхронный» сейв без debounce. Используется в doClear —
  // когда пользователь явно нажал «Очистить всё», ему нужна моментальная
  // фиксация на сервере, иначе быстрое закрытие вкладки / переход на другой
  // экран приведёт к тому, что 500ms-debounced PUT не успеет, и при возврате
  // fetchWeekMenu прочитает старое меню. Возвращает Promise — UI может его
  // await'ить, чтобы показать индикатор и не дать кликать «+ блюдо» до конца.
  async function saveWeekMenuNow() {
    // Сбрасываем любой pending debounced save — он бы перезатёр результат.
    if (_saveTimer) {
      clearTimeout(_saveTimer)
      _saveTimer = null
    }
    _savePromise = _doSave()
    try { await _savePromise } catch { /* error уже в saveError */ }
    _savePromise = null
  }

  // ─── GETTERS ───
  const _recipesMap = computed(() => {
    const m = new Map()
    // Сначала системные рецепты + опубликованные пользовательские из ленты.
    recipes.value.forEach(r => m.set(r.id, r))
    // Затем — рецепты автора из «Мои рецепты». Их ID сдвинуты на +1_000_000
    // (см. fetchCreatedRecipes), и в общей ленте они не присутствуют, пока
    // не пройдут модерацию. Без этого блюдо, добавленное из «Мои рецепты»
    // в меню, не будет отрисовано — getRecipeById вернёт null.
    createdRecipes.value.forEach(r => {
      // Не перезаписываем — если рецепт уже опубликован и есть в общей ленте,
      // версия из recipes.value свежее (есть фильтры, нутри-данные).
      if (!m.has(r.id)) m.set(r.id, r)
    })
    return m
  })

  const getRecipeById = computed(() => {
    return (id) => _recipesMap.value.get(String(id)) || null
  })

  const shopStats = computed(() => {
    const total = shopItems.value.length
    const done = shopItems.value.filter(i => i.done).length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  })

  /**
   * Суммарная стоимость некупленных позиций корзины.
   * Учитывает только items с estimatedPrice (т.е. найденные в магазине).
   */
  const cartTotalPrice = computed(() => {
    return shopItems.value
        .filter(i => !i.done && i.estimatedPrice != null)
        .reduce((sum, i) => sum + (i.estimatedPrice || 0), 0)
  })

  // ─── ACTIONS: МЕНЮ ───
  function addDishToMenu(dayIdx, mealType, dishId) {
    weekMenu.value[dayIdx].meals.push({
      id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
      type: mealType,
      dishId: String(dishId),
    })
    recalculateDayKcal(dayIdx)
    saveWeekMenu()
  }

  function removeDishFromMenu(dayIdx, mealIdx) {
    weekMenu.value[dayIdx].meals.splice(mealIdx, 1)
    recalculateDayKcal(dayIdx)
    saveWeekMenu()
  }

  function recalculateDayKcal(dayIdx) {
    let total = 0
    weekMenu.value[dayIdx].meals.forEach(meal => {
      const r = getRecipeById.value(meal.dishId)
      if (r?.kcal) total += r.kcal
    })
    weekMenu.value[dayIdx].kcal = total
  }

  // ─── ACTIONS: СОХРАНЁННЫЕ РЕЦЕПТЫ ───
  function toggleSavedRecipe(recipeId) {
    const id = String(recipeId)
    const idx = savedIds.value.indexOf(id)
    if (idx > -1) savedIds.value.splice(idx, 1)
    else savedIds.value.push(id)
  }

  function isRecipeSaved(recipeId) {
    return savedIds.value.includes(String(recipeId))
  }

  // ═══════════════════════════════════════════════════════════════════
  // НОВАЯ ЛОГИКА: ГЕНЕРАЦИЯ МЕНЮ ИЗ STORE
  // ═══════════════════════════════════════════════════════════════════
  /**
   * Перегенерирует меню на неделю на основе prefs (из authStore.preferences).
   * Используется на главном экране (E-01 «Перегенерировать») и в онбординге.
   * Применяет результат сразу к weekMenu.
   *
   * @param {Object} prefs — preferences из authStore
   * @returns {Object} — результат generateWeekMenu (для UI: stats, fallback)
   */
  function regenerateWeekMenu(prefs) {
    if (!recipes.value?.length) {
      console.warn('regenerateWeekMenu: рецепты не загружены')
      return null
    }

    const result = generateWeekMenu(recipes.value, prefs)

    // Преобразуем формат в внутренний weekMenu
    weekMenu.value = DAY_NAMES.map((date, idx) => {
      const dayData = result.weekMenu[idx]
      const meals = (dayData?.meals || []).map(m => ({
        id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
        type: m.slot,
        dishId: String(m.recipe.id),
        isBatch: !!m.isBatch,
      }))
      return { date, kcal: dayData?.dayKcal || 0, meals }
    })

    // Сохраняем метаданные последней генерации для UI
    lastGenerationStats.value = result.stats
    lastFallbackApplied.value = result.fallbackApplied
    lastAdultEquivalent.value = result.adultEquivalent

    saveWeekMenu()
    return result
  }

  // ─── ACTIONS: ПОКУПКИ ───
  /**
   * Генерирует список покупок из текущего недельного меню.
   * Если передан prefs — масштабирует количество ингредиентов под adult_equivalent семьи.
   * Без prefs работает как раньше (для обратной совместимости).
   */
  async function generateShoppingList(prefs = null) {
    // Синхронизируем пользовательские рецепты перед генерацией если:
    //  а) список ещё пустой (первый заход, пользователь не был на «Мои рецепты»)
    //  б) в меню есть блюда с ID ≥ 1_000_000 — это пользовательские рецепты,
    //     и нам нужны их свежие ингредиенты.
    // Это убирает гонку между fetchWeekMenu (fire-and-forget) и моментом,
    // когда generateShoppingList пытается прочитать createdRecipes.
    const hasUserDishes = weekMenu.value.some(day =>
        day.meals.some(m => parseInt(m.dishId, 10) >= 1_000_000)
    )
    if (hasUserDishes || createdRecipes.value.length === 0) {
      await fetchCreatedRecipes()
    }

    const ae = prefs ? computeAdultEquivalent(prefs) : 1

    const itemsMap = new Map()
    weekMenu.value.forEach(day => {
      day.meals.forEach(meal => {
        const recipe = getRecipeById.value(meal.dishId)
        if (!recipe?.ings) return

        // Если есть prefs — берём масштабированные количества, иначе оригинал
        const ings = ae !== 1
            ? scaleIngredients(recipe, ae)
            : recipe.ings.map(i => ({ ...i, scaled: i.q }))

        const recipeName = (recipe.name || '').trim()

        ings.forEach(ing => {
          // FIX-DEDUP-01: ключ собираем максимально каноничный.
          // 1) Если есть canonical_food_id — используем его (жёсткая привязка от бэка).
          // 2) Иначе — пропускаем имя через normalizeIngredientName (лемматизация,
          //    удаление количеств), lower-case, схлопываем пробелы.
          //    «Яйца», «куриное яйцо», «Яйцо куриное», «Яйца C0» теперь дают
          //    один и тот же ключ и схлопываются в один item списка покупок.
          const normName = normalizeIngredientName(ing.n || '').toLowerCase().trim().replace(/\s+/g, ' ')
          const key = ing.cid
              ? `cid_${ing.cid}`
              : normName
          if (!key) return
          const existing = itemsMap.get(key)
          const scaled = ing.scaled || ing.q || ''
          if (existing) {
            // Суммируем количества по единицам измерения, а не конкатенируем.
            //   "4 шт" + "8 шт"  →  "12 шт"   (а не "4 шт + 8 шт")
            //   "200 г" + "150 г" → "350 г"
            // Несовместимые единицы остаются через «+»:  "200 г + 1 ст."
            if (scaled) {
              existing.q = combineQty(existing.q, scaled)
            }
            // Дедуплицируем имена рецептов: если один и тот же рецепт стоит
            // на разных днях, он попадает в список один раз (количество уже
            // просуммировано выше).
            if (recipeName && !existing.fromRecipes.includes(recipeName)) {
              existing.fromRecipes.push(recipeName)
            }
          } else {
            // FIX-CAT-02: категорию ВСЕГДА считаем сами через categorize(name).
            // В БД (ingredients.category) лежат рассогласованные значения от
            // старого импорта: «🥩 Мясо», «🍗 Птица», «🌾 Бакалея», «🧂 Специи»
            // — этих строк нет в CAT_ORDER фронта, и продукты молча падали
            // в «📦 Прочее» (статистика: 118 244 / 254 925 = 46% записей в БД
            // с этой категорией). Имя продукта — единственно надёжный источник.
            itemsMap.set(key, {
              id: (crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`),
              n: ing.n,
              q: scaled,
              cat: categorize(ing.n || ''),
              done: false,
              // Список рецептов, в которые идёт этот продукт. Используется
              // для всплывашки «ⓘ» в строке товара (UI ShoppingListGroup).
              fromRecipes: recipeName ? [recipeName] : [],
              // Магазинные данные приедут через enrichShopItemsWithPrices
              storeProduct: null,
              estimatedPrice: null,
              packagesNeeded: 0,
            })
          }
        })
      })
    })
    shopItems.value = [...itemsMap.values()]

    // Подгружаем цены из магазина асинхронно — UI не блокируем.
    // Если бэк недоступен, список покупок всё равно отрисуется без цен.
    enrichShopItemsWithPrices().catch(e => console.warn('Не удалось загрузить цены:', e))
  }

  /**
   * Подгружает с бэка цены и названия магазинных товаров для каждого shopItem.
   *
   * Логика (по ТЗ):
   *   1) Проверяем название товара и подбираем его к ингредиенту рецепта
   *      (validateProductMatch). Невалидные матчи отбрасываем — лучше не
   *      показать цену вовсе, чем показать цену чипсов вместо бекона.
   *   2) Сравниваем количество в рецепте с расфасовкой товара и приводим
   *      к требованиям рецепта (computeAdjustedPrice → packagesNeeded).
   *   3) Отображаем цену с учётом количества (estimatedPrice = цена × уп.)
   *
   * Заполняет item.storeProduct, item.estimatedPrice, item.packagesNeeded.
   * Вызывается из generateShoppingList и при необходимости вручную (например
   * при ручном добавлении ингредиента через addShopItem).
   */
  async function enrichShopItemsWithPrices() {
    if (!shopItems.value.length) return

    // Нормализуем словоформы перед отправкой в магазин: «Яйца» → «куриное
    // яйцо», «Картошка» → «картофель», «Белок куриного яйца» → «куриное
    // яйцо». Бэк по канонической форме находит товар надёжнее.
    // Отображаемое имя пользователю (item.n) остаётся оригинальным.
    const ingredients = shopItems.value.map(item => normalizeIngredientName(item.n))

    try {
      const res = await fetch(`${API_URL}/products/match-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })
      if (!res.ok) {
        console.warn('match-batch вернул', res.status)
        return
      }
      const matches = await res.json()

      matches.forEach((m, idx) => {
        const item = shopItems.value[idx]
        if (!item) return

        // ── 1. ВАЛИДАЦИЯ МАТЧА ────────────────────────────────────────
        // Бэк может вернуть «похожий» товар, который на деле не наш
        // ингредиент (бекон → чипсы со вкусом бекона). Отсекаем такие.
        const isValid =
            m.match &&
            validateProductMatch(item.n, m.match.name)

        if (!isValid) {
          item.storeProduct = null
          item.estimatedPrice = null
          item.packagesNeeded = 0
          return
        }

        // ── 2. СОХРАНЯЕМ ПРОДУКТ И ──────────────────────────────────────
        // ── 3. СЧИТАЕМ ЦЕНУ С УЧЁТОМ КОЛИЧЕСТВА ───────────────────────
        item.storeProduct = {
          id: m.match.id,
          name: m.match.name,
          price: m.match.price,
          package_size: m.match.package_size,
          package_unit: m.match.package_unit,
        }

        const adjusted = computeAdjustedPrice(item.q, item.storeProduct)
        item.estimatedPrice = adjusted?.totalPrice ?? null
        item.packagesNeeded = adjusted?.packagesNeeded ?? 0
      })
    } catch (e) {
      console.warn('enrichShopItemsWithPrices error:', e)
    }
  }

  /**
   * Локально пересчитывает цену одного item на основании уже подгруженного
   * storeProduct (без обращения к бэку). Используется когда пользователь
   * вручную меняет количество — нет смысла дёргать API ради того же товара.
   */
  function recalculateItemPrice(item) {
    if (!item || !item.storeProduct) return
    const adjusted = computeAdjustedPrice(item.q, item.storeProduct)
    item.estimatedPrice = adjusted?.totalPrice ?? null
    item.packagesNeeded = adjusted?.packagesNeeded ?? 0
  }

  function clearShopItems() {
    shopItems.value = []
  }

  function addShopItem(name, qty = '', cat = null) {
    // Если категория не передана — считаем через categorize по имени.
    // Это используется для ручного добавления товара через UI шопинг-листа,
    // а также для «добавить ингредиенты рецепта в покупки» из MenuView.
    const finalCat = cat || categorize(name || '')
    shopItems.value.push({
      id: Date.now().toString(),
      n: name,
      q: qty,
      cat: finalCat,
      done: false,
      // Добавлено вручную пользователем — рецептов нет.
      fromRecipes: [],
      storeProduct: null,
      estimatedPrice: null,
      packagesNeeded: 0,
    })
  }

  function toggleShopItem(id) {
    const item = shopItems.value.find(i => i.id === id)
    if (item) item.done = !item.done
  }

  function deleteShopItem(id) {
    const idx = shopItems.value.findIndex(i => i.id === id)
    if (idx > -1) shopItems.value.splice(idx, 1)
  }

  function updateShopItem(id, newName, newQty) {
    const item = shopItems.value.find(i => i.id === id)
    if (!item) return
    const nameChanged = item.n !== newName
    item.n = newName
    item.q = newQty
    if (nameChanged) {
      // Имя поменялось — старый матч уже не актуален. Сбрасываем и
      // дёргаем enrich, чтобы подобрать новый товар.
      item.storeProduct = null
      item.estimatedPrice = null
      item.packagesNeeded = 0
      enrichShopItemsWithPrices().catch(e => console.warn(e))
    } else {
      // Поменялось только количество — пересчитываем локально, без API.
      recalculateItemPrice(item)
    }
  }

  // ─── ACTIONS: ОНБОРДИНГ ───
  /**
   * Принимает уже сгенерированное меню из онбординга.
   * Поддерживает два формата:
   *   1) Новый (из generateWeekMenu): объект с .weekMenu, .stats, .fallbackApplied
   *   2) Старый (массив дней с .meals[].dish.id) — для обратной совместимости
   */
  function applyOnboardingMenu(weekRawOrResult) {
    // НОВЫЙ формат — результат generateWeekMenu
    if (weekRawOrResult?.weekMenu && Array.isArray(weekRawOrResult.weekMenu)) {
      const result = weekRawOrResult
      weekMenu.value = DAY_NAMES.map((date, idx) => {
        const dayData = result.weekMenu[idx]
        const meals = (dayData?.meals || []).map(m => ({
          id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
          type: m.slot,
          dishId: String(m.recipe.id),
          isBatch: !!m.isBatch,
        }))
        return { date, kcal: dayData?.dayKcal || 0, meals }
      })
      lastGenerationStats.value = result.stats
      lastFallbackApplied.value = result.fallbackApplied
      lastAdultEquivalent.value = result.adultEquivalent
      saveWeekMenu()
      return
    }

    // СТАРЫЙ формат — массив с {breakfast, lunch, dinner}
    if (!Array.isArray(weekRawOrResult)) return
    weekMenu.value = DAY_NAMES.map((date, idx) => {
      const day = weekRawOrResult[idx] || {}
      const meals = []
      ;['breakfast', 'lunch', 'dinner', 'snack'].forEach(type => {
        if (day[type]) {
          meals.push({
            id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
            type,
            dishId: String(day[type].id || day[type]),
          })
        }
      })
      return { date, kcal: 0, meals }
    })
    weekMenu.value.forEach((_, idx) => recalculateDayKcal(idx))
    saveWeekMenu()
  }

  return {
    recipes, recipesLoading, menuLoading,
    weekMenu, shopItems, shopStats,
    cartTotalPrice,
    createdRecipes,
    getRecipeById,
    fetchRecipes, fetchCreatedRecipes, deleteCreatedRecipe, fetchWeekMenu, saveWeekMenu, saveWeekMenuNow, flushSave, recalculateDayKcal,
    saveError,
    savedRecipes, toggleSavedRecipe, isRecipeSaved,
    addDishToMenu, removeDishFromMenu,
    generateShoppingList, addShopItem, clearShopItems,
    enrichShopItemsWithPrices,
    toggleShopItem, deleteShopItem, updateShopItem,
    applyOnboardingMenu,
    // НОВОЕ:
    regenerateWeekMenu,
    lastGenerationStats,
    lastFallbackApplied,
    lastAdultEquivalent,
  }
})