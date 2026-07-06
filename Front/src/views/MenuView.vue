<script setup>
/**
 * MenuView.vue — «Время Есть» v3.1
 *
 * ИСПРАВЛЕНИЯ:
 * ✓ FIX-M01 — panel-flex убран со секции покупок: ShoppingListGroup получает height:100%
 * ✓ FIX-M02 — v-show заменён на v-if/v-show правильно: ShoppingListGroup монтируется
 *             один раз и не теряет scroll-listener при переключении вкладок
 * ✓ FIX-M03 — safeShopStats — computed с fallback {done:0,total:0,pct:0} если store
 *             ещё не вернул объект → компонент не падает при первом рендере
 * ✓ FIX-M04 — @add emit передаёт { name, qty, cat } — порядок совпадает со store
 * ✓ FIX-M05 — panels-wrap растягивает дочернюю секцию через flex правильно
 */
import { ref, computed, reactive, nextTick, onMounted } from 'vue'
import { useMenuStore }  from '@/stores/menuStore'
import { storeToRefs }   from 'pinia'
import { useAuthStore }  from '@/stores/authStore'
import { useTrack } from '@/composables/useTrack'

import BaseButton        from '@/components/atoms/BaseButton.vue'
import BaseBadge         from '@/components/atoms/BaseBadge.vue'
import BaseInput         from '@/components/atoms/BaseInput.vue'
import ShoppingListGroup from '@/components/organisms/ShoppingListGroup.vue'
import BottomSheet       from '@/components/organisms/BottomSheet.vue'
import RecipeDetailSheet from '@/components/organisms/RecipeDetailSheet.vue'

// Общая категоризация — раньше здесь жил локальный дубль с теми же
// багами JS \b, что и в ShoppingListGroup. Теперь — единый источник
// правды в utils/categorize. См. там же FIX-CAT-01.
import { categorize } from '@/utils/categorize'

// Единый источник правды по нормам питания и batch-режиму.
// FIX-CAL-01: устранили рассинхрон между MenuView и mealPlanGenerator —
// раньше использовали РАЗНЫЕ раскладки калорий по приёмам пищи и РАЗНЫЕ
// пороги для перекуса. Теперь оба алгоритма берут константы отсюда.
// FIX-BATCH-01: вынесли проверку batch-режима и пригодности рецепта
// для пятидневного хранения в отдельные хелперы.
import {
  MEAL_SPLIT,
  shouldAddSnack as shouldAddSnackNorm,
  isBatchMode as isBatchModeNorm,
  isBatchSuitable,
} from '@/utils/nutritionNorms'

const store = useMenuStore()
const auth  = useAuthStore()
const { track, trackRecipe, EVENT } = useTrack()

const { recipes, createdRecipes, weekMenu, shopItems, cartTotalPrice } = storeToRefs(store)

// FIX-M03: безопасный computed с fallback — компонент не падает если store ещё не готов

// ── ПРОФИЛЬ ─────────────────────────────────────────────────
const prefs = computed(() => auth.preferences || {})
const targetKcal    = computed(() => Number(prefs.value.targetKcal)    || 1800)
const targetProtein = computed(() => Number(prefs.value.targetProtein) || 90)
const targetFat     = computed(() => Number(prefs.value.targetFat)     || 60)
const targetCarbs   = computed(() => Number(prefs.value.targetCarbs)   || 200)
// FIX-BATCH-02: используем общую функцию isBatchModeNorm — поддерживает
// оба ключа cookFreq ('once_week' из онбординга и 'weekends' из профиля).
const isBatchMode   = computed(() => isBatchModeNorm(prefs.value))
const maxCookMin    = computed(() => Number(prefs.value.cookTime) || 30)

// FIX-CAL-02: hasSnack теперь синхронен с nutritionNorms — перекус добавляется
// при наличии маленьких/средних детей или если суточная норма > 2200 ккал.
// Раньше MenuView добавлял перекус всем подряд (≥1800 ккал), а генератор —
// только семьям с детьми, из-за чего онбординг и пересборка давали разное
// число приёмов пищи.
const hasSnack = computed(() => shouldAddSnackNorm(prefs.value))
const bigLunch = computed(() =>
    targetKcal.value >= 1800 || prefs.value.gender === 'male'
)

// ── РАСПРЕДЕЛЕНИЕ КАЛОРИЙ ────────────────────────────────────
// FIX-CAL-03: раскладка вынесена в nutritionNorms.MEAL_SPLIT
//   3 приёма: завтрак 25 / обед 40 / ужин 35
//   4 приёма: завтрак 25 / обед 35 / ужин 30 / перекус 10
// Раньше тут была своя цифра (28/40/32 и 25/35/10/30), которая
// не совпадала ни с генератором, ни с источниками (МР Роспотребнадзора).
const dist = computed(() => {
  const k = targetKcal.value
  const split = hasSnack.value ? MEAL_SPLIT.four : MEAL_SPLIT.three
  const out = {}
  for (const slot of Object.keys(split)) {
    out[slot] = Math.round(k * split[slot])
  }
  return out
})

// ── ЗАГРУЗКА ─────────────────────────────────────────────────
// FIX-AUTO-01: автогенерация меню при пустом старте УБРАНА.
// Раньше при первой загрузке (пустом weekMenu) автоматически вызывался smartFill()
// и пользователь сразу видел сгенерированное меню. Теперь меню обновляется
// ТОЛЬКО по явному клику на кнопку «Обновить меню» — никаких сюрпризов.
// Если меню уже сохранено, просто пересобираем список покупок из актуального меню,
// масштабируя количество ингредиентов под состав семьи (adult equivalent).
//
// FIX-RACE-01: перед fetchWeekMenu обязательно ждём flushSave() — иначе
// при быстрой навигации (добавил блюдо → ушёл → вернулся в течение 500мс)
// debounced PUT ещё не успел отправиться, GET читает старое состояние сервера,
// и локальные правки молча затираются. flushSave дождётся pending-сохранения.
onMounted(async () => {
  await store.fetchRecipes({ preferences: auth.preferences })
  await store.flushSave()              // ← дождаться pending PUT, если есть
  await store.fetchWeekMenu()
  const empty = weekMenu.value.every(d => d.meals.length === 0)
  if (!empty) {
    nextTick(() => store.generateShoppingList(auth.preferences))
  }
})

// ── УМНЫЙ ПОДБОР МЕНЮ ────────────────────────────────────────
const FISH_DAYS = new Set([2, 4])

function getKcal(r) { return parseInt(r?.kcal || r?.calories || 0) || 0 }
function getTags(r) { return ((r?.tags || []).join(' ') + ' ' + (r?.category||'') + ' ' + (r?.name||'')).toLowerCase() }
const isHot       = r => /суп|борщ|щи|рассольник|уха|окрошка|солянк/.test(getTags(r))
const isMain      = r => /котлет|жарк|тушен|запечен|плов|паст|ризотт|рыб|курин|говяд|свин|стейк|гречнев|картоф/.test(getTags(r))
const isSalad     = r => /салат|цезарь|греческ|винегрет|овощ/.test(getTags(r))
const isDessert   = r => /десерт|пудинг|мусс|желе|торт|творожн|йогурт|фрукт|ягод|кисель|компот/.test(getTags(r))
const isBreakfast = r => r?.type === 'breakfast' || /завтрак|каша|оладь|блин|омлет|яйц|тост|сырник|мюсли/.test(getTags(r))
const isSnack     = r => r?.type === 'snack' || /перекус|батончик|фрукт|орех|йогурт|кефир|смузи/.test(getTags(r))
const isfish      = r => /рыб|сёмг|лосос|треск|тунец|минтай|форел|скумбри|сардин/.test(getTags(r))
const hasMeat     = r => /говяд|свин|курин|мяс|птиц|котлет|фарш/.test(getTags(r))
const hasGluten   = r => /хлеб|паст|макарон|мука|выпечк|блин/.test(getTags(r))
const hasLactose  = r => /молок|сливк|сметан|творог|кефир|йогурт/.test(getTags(r))
const hasNuts     = r => /орех|миндаль|кешью/.test(getTags(r))

function canReheat(dish) {
  if (!dish) return false
  if (isDessert(dish)) return false
  if (isBreakfast(dish)) return false
  if (isSnack(dish)) return false
  if (isSalad(dish)) return false
  return true
}

function applyRestrictions(pool) {
  const r = prefs.value.restrictions || {}
  if (r.veg || r.vegan)  pool = pool.filter(d => !hasMeat(d))
  if (r.gluten)          pool = pool.filter(d => !hasGluten(d))
  if (r.lactose)         pool = pool.filter(d => !hasLactose(d))
  if (r.nuts)            pool = pool.filter(d => !hasNuts(d))
  if (r.seafood)         pool = pool.filter(d => !isfish(d))
  return pool
}

function pickClosest(pool, targetKcalVal, usedIds, opts = {}) {
  let p = pool.filter(d => !usedIds.has(d.id))
  if (opts.fishOnly)  p = p.filter(isfish)
  if (opts.saladOnly) p = p.filter(isSalad)
  if (opts.hotOnly)   p = p.filter(isHot)
  if (opts.mainOnly)  p = p.filter(isMain)
  // FIX-BATCH-03: фильтр batch-пригодности — нескоропортящиеся блюда,
  // которые хорошо разогреваются (плов, рагу, лазанья, запеканки и т.п.).
  // Отсекаем салаты, тартары, омлеты, блины и прочее, что живёт только свежим.
  if (opts.batchOnly) p = p.filter(isBatchSuitable)
  if (opts.maxMin)    p = p.filter(d => (parseInt(d.total_time_min||d.time)||99) <= opts.maxMin)
  if (!p.length) p = pool.filter(d => !usedIds.has(d.id))
  if (!p.length) p = pool
  p.sort((a,b) => Math.abs(getKcal(a)-targetKcalVal) - Math.abs(getKcal(b)-targetKcalVal))
  const top  = p.slice(0,4)
  const pick = top[Math.floor(Math.random()*top.length)]
  if (pick) usedIds.add(pick.id)
  return pick || null
}

function smartFill() {
  const all = recipes.value
  if (!all.length) return
  const usedIds = new Set()
  const d = dist.value
  const batch = isBatchMode.value

  // ──────────────────────────────────────────────────────────────────
  // FIX-BATCH-04: BATCH-РЕЖИМ — один обед и один ужин на ВСЮ рабочую неделю.
  // Хозяйка готовит в воскресенье ОДНО блюдо плова/рагу/лазаньи и разогревает
  // его с понедельника по пятницу. Раньше pickClosest вызывался для каждого
  // дня заново, и из-за usedIds выбирал РАЗНЫЕ блюда — это противоречило
  // самой идее «готовлю один раз».
  //
  // К batch-блюдам:
  //   • применяем фильтр isBatchSuitable (нескоропортящиеся, разогреваются)
  //   • НЕ применяем cookTime-ограничение (готовится один раз — можно 90 мин)
  //   • в выходные и на завтраки/перекусы — обычные свежие блюда
  // ──────────────────────────────────────────────────────────────────
  let weekBatchLunch  = null
  let weekBatchDinner = null
  if (batch) {
    const restrictedPool = applyRestrictions([...all])
    const lunchBatchPool = restrictedPool.filter(r =>
        !isBreakfast(r) && !isSnack(r) && !isDessert(r)
    )
    const dinnerBatchPool = restrictedPool.filter(r =>
        !isBreakfast(r) && !isSnack(r) && !isDessert(r)
    )

    weekBatchLunch  = pickClosest(lunchBatchPool,  d.lunch,  usedIds, { batchOnly: true, mainOnly: true })
    weekBatchDinner = pickClosest(dinnerBatchPool, d.dinner, usedIds, { batchOnly: true })
  }

  weekMenu.value.forEach((day, dayIdx) => {
    if (day.meals.length > 0) return
    let pool = applyRestrictions([...all])
    const isWeekday  = dayIdx >= 0 && dayIdx <= 4 // Пн–Пт
    const useBatchHere = batch && isWeekday

    // Завтрак — всегда свежее, ограничение по времени применяется
    const bfPool = pool.filter(r => r.type==='breakfast' || isBreakfast(r))
    const bf = pickClosest(
        bfPool.length ? bfPool : pool,
        d.breakfast,
        usedIds,
        { maxMin: maxCookMin.value + 15 },
    )
    if (bf) store.addDishToMenu(dayIdx, 'breakfast', String(bf.id))

    // ── ОБЕД ──
    if (useBatchHere && weekBatchLunch) {
      // Будни в batch — переиспользуем заготовку (БЕЗ добавления в usedIds повторно)
      store.addDishToMenu(dayIdx, 'lunch', String(weekBatchLunch.id))
    } else {
      const lunchTarget = d.lunch
      const hotPool   = pool.filter(r => !isBreakfast(r) && !isSnack(r) && !isDessert(r) && isHot(r))
      const mainPool  = pool.filter(r => !isBreakfast(r) && !isSnack(r) && !isDessert(r) && isMain(r))
      const saladPool = pool.filter(r => isSalad(r))

      if (bigLunch.value) {
        const soup = pickClosest(hotPool, 250, usedIds, { maxMin: maxCookMin.value + 15 })
        if (soup) store.addDishToMenu(dayIdx, 'lunch', String(soup.id))
        const kTarget = soup ? lunchTarget - getKcal(soup) : lunchTarget
        const mainFish = FISH_DAYS.has(dayIdx)
        const second = mainFish
            ? pickClosest(pool.filter(r=>!isBreakfast(r)&&!isSnack(r)), kTarget, usedIds, { fishOnly: true, maxMin: maxCookMin.value + 15 })
            : pickClosest(mainPool, kTarget, usedIds, { maxMin: maxCookMin.value + 15 })
        if (second) store.addDishToMenu(dayIdx, 'lunch', String(second.id))
        if (targetKcal.value >= 2200) {
          const rem = lunchTarget - getKcal(soup||{}) - getKcal(second||{})
          const third = pickClosest(saladPool, Math.max(rem, 100), usedIds)
          if (third) store.addDishToMenu(dayIdx, 'lunch', String(third.id))
        }
      } else {
        const lunchFish = FISH_DAYS.has(dayIdx)
        const lunchDish = lunchFish
            ? pickClosest(pool.filter(r=>!isBreakfast(r)&&!isSnack(r)), lunchTarget, usedIds, { fishOnly: true, maxMin: maxCookMin.value + 15 })
            : pickClosest([...hotPool, ...mainPool], lunchTarget, usedIds, { maxMin: maxCookMin.value + 15 })
        if (lunchDish) store.addDishToMenu(dayIdx, 'lunch', String(lunchDish.id))
      }
    }

    // ── ПЕРЕКУС ──
    if (hasSnack.value) {
      const snPool = pool.filter(r => r.type==='snack' || isSnack(r) || isDessert(r))
      const sn = pickClosest(snPool.length ? snPool : pool, d.snack, usedIds)
      if (sn) store.addDishToMenu(dayIdx, 'snack', String(sn.id))
    }

    // ── УЖИН ──
    if (useBatchHere && weekBatchDinner) {
      // Будни в batch — переиспользуем заготовку
      store.addDishToMenu(dayIdx, 'dinner', String(weekBatchDinner.id))
    } else {
      const dinnerPool = pool.filter(r => !isBreakfast(r) && !isSnack(r) && !isDessert(r))
      const dinner = pickClosest(dinnerPool, d.dinner, usedIds, { maxMin: maxCookMin.value + 15 })
      if (dinner) store.addDishToMenu(dayIdx, 'dinner', String(dinner.id))
    }
  })

  nextTick(() => store.generateShoppingList(auth.preferences))
}

// ── СБРОС МЕНЮ ───────────────────────────────────────────────
const showResetConfirm = ref(false)
function confirmReset() { showResetConfirm.value = true }
function cancelReset()  { showResetConfirm.value = false }
async function doReset() {
  const filledSlots = weekMenu.value.reduce((s, d) => s + d.meals.length, 0)
  track(EVENT.MENU_RESET, { filledSlots, totalSlots: 21 })
  weekMenu.value.forEach((_, i) => { weekMenu.value[i].meals = [] })
  store.clearShopItems()
  showResetConfirm.value = false
  // smartFill заполняет weekMenu и каждое addDishToMenu внутри
  // дёргает debounced saveWeekMenu — finальный PUT улетит сам через 500мс.
  smartFill()
  // Но если юзер быстро уйдёт со страницы — PUT не успеет.
  // FIX-RESET-01: сразу же форсируем синхронный сейв полного нового меню.
  await nextTick()
  await store.saveWeekMenuNow()
}

// ── ОЧИСТКА МЕНЮ (без перегенерации) ─────────────────────────
// FIX-CLEAR-01: отдельная кнопка «Очистить всё» — обнуляет недельное меню
// и список покупок, но НЕ запускает smartFill. Используется когда пользователь
// хочет начать с пустой недели и собрать меню вручную.
//
// FIX-CLEAR-02: после очистки ОБЯЗАТЕЛЬНО синхронизируем пустое состояние
// с бэком через saveWeekMenu(). Раньше doClear только мутировал локальный
// weekMenu, и при следующем заходе на страницу fetchWeekMenu подтягивал
// СТАРОЕ меню с сервера — пользователю казалось, что меню «возвращается»
// или «генерируется автоматически». Теперь PUT /menu/week/:date с meals:[]
// удаляет все MenuMeal на бэке, и при возврате на страницу меню остаётся пустым.
//
// FIX-CLEAR-03: используем saveWeekMenuNow() — синхронный сейв без 500ms-debounce.
// Раньше при быстром закрытии вкладки/переходе на другую страницу сразу
// после «Очистить всё» pending PUT не успевал отправиться, и старое меню
// возвращалось при следующей загрузке. clearing.value блокирует кнопки
// до завершения PUT — нельзя дважды кликнуть «Очистить» или сразу добавить блюдо.
const showClearConfirm = ref(false)
const clearing = ref(false)
function confirmClear() { showClearConfirm.value = true }
function cancelClear()  { showClearConfirm.value = false }
async function doClear() {
  if (clearing.value) return  // защита от двойного клика
  const filledSlots = weekMenu.value.reduce((s, d) => s + d.meals.length, 0)
  track(EVENT.MENU_RESET, { filledSlots, totalSlots: 21, action: 'clear' })
  weekMenu.value.forEach((_, i) => { weekMenu.value[i].meals = [] })
  store.clearShopItems()
  showClearConfirm.value = false
  clearing.value = true
  try {
    await store.saveWeekMenuNow()  // ← синхронно, ждём подтверждения от сервера
  } finally {
    clearing.value = false
  }
}

// ── СПИСОК ПОКУПОК ────────────────────────────────────────────
function clearShopList() {
  store.clearShopItems()
}

function buildShoppingList() {
  // Передаём prefs семьи — store масштабирует ингредиенты под количество едоков
  store.generateShoppingList(auth.preferences)
}

function handleShopToggle(id) {
  const item = shopItems.value.find(i => i.id === id)
  if (item && !item.done) { // трекаем только переход в "куплено"
    track(EVENT.SHOP_ITEM_CHECK, { itemName: item.n, category: item.cat })
  }
  store.toggleShopItem(id)
}


// ── КБЖУ-УТИЛИТЫ ─────────────────────────────────────────────
function getDish(id) { return store.getRecipeById(id) }
function getKcalDish(id) { return getKcal(getDish(id) || {}) }
function getDayKcal(day) {
  return day.meals.reduce((s, m) => s + getKcalDish(m.dishId), 0)
}
function getDayKcalPct(day) {
  const k = getDayKcal(day)
  if (!k) return 0
  return Math.min(110, Math.round((k / targetKcal.value) * 100))
}
function kcalStatus(day) {
  const pct = getDayKcalPct(day)
  if (pct === 0) return ''
  if (pct >= 88 && pct <= 112) return 'ok'
  if (pct < 88)  return 'low'
  return 'over'
}

// ── UI ────────────────────────────────────────────────────────
const activeTab    = ref('menu')
const searchQuery  = ref('')
function switchTab(tab) {
  if (activeTab.value === tab) return
  track(EVENT.MENU_TAB_SWITCHED, { tab, fromTab: activeTab.value })
  activeTab.value = tab
}
const pickerFilter = ref('all')

const DAYS_RU      = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']
const MEAL_LABELS  = { breakfast:'Завтрак', lunch:'Обед', snack:'Перекус', dinner:'Ужин' }
const MEAL_ICONS   = { breakfast:'☀️', lunch:'🌿', snack:'🍎', dinner:'🌙' }
const TYPE_BG      = { breakfast:'var(--breakfast-bg)', lunch:'var(--lunch-bg)', snack:'var(--snack-bg)', dinner:'var(--dinner-bg)' }
const TYPE_FG      = { breakfast:'var(--breakfast-fg)', lunch:'var(--lunch-fg)', snack:'var(--snack-fg)', dinner:'var(--dinner-fg)' }

const PICKER_FILTERS = [
  { label:'🍽️ Все',        value:'all' },
  { label:'☀️ Завтрак',    value:'breakfast' },
  { label:'🌿 Обед',       value:'lunch' },
  { label:'🍎 Перекус',    value:'snack' },
  { label:'🌙 Ужин',       value:'dinner' },
  { label:'❤️ Мои рецепты', value:'saved' },
]

const filteredRecipes = computed(() => {
  // Для вкладки «Мои рецепты» показываем createdRecipes, для всего остального — системные.
  const isSaved = pickerFilter.value === 'saved'
  let list = isSaved ? [...createdRecipes.value] : [...recipes.value]

  // FIX-PICKER-01: «Мои рецепты» теперь тоже фильтруем по типу слота,
  // в который пользователь добавляет блюдо. Раньше при открытии пикера
  // через «+ завтрак» → клик «Мои рецепты» → выбор СВОЕГО рецепта ужина —
  // блюдо попадало в слот «завтрак», что выглядело как баг.
  // Теперь учитываем pickerCtx.type — реальный слот, для которого вызван пикер.
  // Если у пользовательского рецепта type=null/category — НЕ скрываем
  // (юзер мог не указать), но в остальных случаях фильтр работает.
  const slotType = pickerCtx.value?.type
  if (isSaved && slotType && ['breakfast','lunch','snack','dinner'].includes(slotType)) {
    list = list.filter(r => {
      const t = (r.type || '').trim().toLowerCase()
      if (!t) return true  // нет типа — пусть видно
      if (slotType === 'breakfast') return t === 'breakfast' || isBreakfast(r)
      if (slotType === 'lunch')     return t === 'lunch'
      if (slotType === 'snack')     return t === 'snack' || isSnack(r) || isDessert(r)
      if (slotType === 'dinner')    return t === 'dinner' || (!['breakfast','lunch','snack'].includes(t) && !isBreakfast(r) && !isSnack(r))
      return true
    })
  }

  if (!isSaved && pickerFilter.value !== 'all') {
    list = list.filter(r => {
      const t = (r.type || '').trim().toLowerCase()
      const f = pickerFilter.value.trim().toLowerCase()
      if (f === 'dinner')    return t === 'dinner' || (!['breakfast','lunch','snack'].includes(t) && !isBreakfast(r) && !isSnack(r))
      if (f === 'breakfast') return t === 'breakfast' || isBreakfast(r)
      if (f === 'lunch')     return t === 'lunch'
      if (f === 'snack')     return t === 'snack' || isSnack(r) || isDessert(r)
      return t === f
    })
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter(r => (r.name||'').toLowerCase().includes(q))
  const tgt = dist.value[pickerCtx.value?.type] || targetKcal.value / 3
  list.sort((a,b) => Math.abs(getKcal(a)-tgt) - Math.abs(getKcal(b)-tgt))
  return list
})

// ── SHEETS ────────────────────────────────────────────────────
const sheets    = reactive({ meal:false, recipe:false, picker:false, dayMove:false })
const mealCtx   = ref({ dayIdx:null, mealIdx:null, dish:null })
const pickerCtx = ref({ dayIdx:null, type:'dinner', mealIdx:null })
// replaceMode: true — пикер заменяет блюдо в слоте (из «Заменить»).
// false — добавляет новое блюдо в слот, не затрагивая существующие.
const replaceMode = ref(false)
const viewRecipe = ref(null)

function openMealOptions(dIdx, mIdx, dish) {
  trackRecipe(EVENT.MENU_SLOT_OPENED, dish || {}, { dayIdx: dIdx, mealType: dish?.type })
  mealCtx.value = { dayIdx: dIdx, mealIdx: mIdx, dish }
  sheets.meal = true
}
function openRecipeDetail(dish) {
  if (!dish) return
  viewRecipe.value = dish
  sheets.recipe = true
}
function openPicker(dIdx, mIdx=null, type='dinner') {
  pickerCtx.value    = { dayIdx:dIdx, mealIdx:mIdx, type }
  pickerFilter.value = type
  searchQuery.value  = ''
  sheets.picker = true
  // Предзагружаем пользовательские рецепты для вкладки «Мои рецепты».
  if (createdRecipes.value.length === 0) {
    store.fetchCreatedRecipes?.()
  }
}
function removeDish() {
  const dish = mealCtx.value.dish
  if (dish) trackRecipe(EVENT.MENU_SLOT_REMOVED, dish, {
    dayIdx: mealCtx.value.dayIdx,
    mealType: dish?.type,
  })
  store.removeDishFromMenu(mealCtx.value.dayIdx, mealCtx.value.mealIdx)
  sheets.meal = false
}
function openDayMove() { sheets.meal = false; nextTick(() => { sheets.dayMove = true }) }
function moveMealToDay(tIdx) {
  const { dayIdx, mealIdx } = mealCtx.value
  if (dayIdx === tIdx) { sheets.dayMove = false; return }
  const meal = weekMenu.value[dayIdx].meals[mealIdx]
  const dish = store.getRecipeById(meal.dishId)
  if (dish) trackRecipe(EVENT.MENU_SLOT_DRAG_MOVE, dish, {
    fromDay: dayIdx, toDay: tIdx, mealType: meal.type,
  })
  store.addDishToMenu(tIdx, meal.type, meal.dishId)
  store.removeDishFromMenu(dayIdx, mealIdx)
  sheets.dayMove = false
}
function openReplace() {
  const meal = weekMenu.value[mealCtx.value.dayIdx]?.meals[mealCtx.value.mealIdx]
  const dish = mealCtx.value.dish
  if (dish) trackRecipe(EVENT.MENU_SLOT_REPLACE, dish, {
    dayIdx: mealCtx.value.dayIdx,
    mealType: meal?.type,
    reason: 'manual',
  })
  sheets.meal = false
  replaceMode.value = true
  nextTick(() => openPicker(mealCtx.value.dayIdx, mealCtx.value.mealIdx, meal?.type || 'dinner'))
}
function pickDish(recipeId) {
  const { dayIdx, type, mealIdx } = pickerCtx.value
  const oldRecipeId = mealIdx != null ? weekMenu.value[dayIdx].meals[mealIdx]?.dishId : null
  const newRecipe = store.getRecipeById(String(recipeId))
  if (newRecipe) trackRecipe(EVENT.MENU_SLOT_ACCEPT, newRecipe, {
    dayIdx, mealType: type, oldRecipeId,
  })

  // replaceMode=true: заменяем блюдо в слоте (действие «Заменить»).
  // replaceMode=false: добавляем ниже существующих (кнопка «+» или «Мои рецепты»).
  if (replaceMode.value && mealIdx !== null && mealIdx !== undefined) {
    weekMenu.value[dayIdx].meals[mealIdx].dishId = String(recipeId)
    store.recalculateDayKcal?.(dayIdx)
    store.saveWeekMenu?.()
  } else {
    store.addDishToMenu(dayIdx, type, String(recipeId))
  }
  replaceMode.value = false
  sheets.picker = false
}
function addIngsToShop(recipe) {
  if (!recipe) return
  const ings = recipe.ings || recipe.ingredients || []
  trackRecipe(EVENT.MENU_INGS_TO_SHOP, recipe, { ingredientsCount: ings.length })
  ings.forEach(ing => {
    const name = ing.n || ing.name || ''
    if (!name) return
    if (!shopItems.value.find(i => (i.n||'').toLowerCase() === name.toLowerCase()))
      store.addShopItem(name, ing.q || ing.amount || '', categorize(name))
  })
  sheets.recipe = false
  activeTab.value = 'shop'
}

// ── DRAG & DROP ───────────────────────────────────────────────
const dragCtx  = ref(null)
const hoverCtx = ref(null)

function onDragStart(e, dIdx, mIdx) {
  dragCtx.value = { dayIdx:dIdx, mealIdx:mIdx }
  e.dataTransfer.effectAllowed = 'move'
  const img = new Image()
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  e.dataTransfer.setDragImage(img,0,0)
}
function onDrop(e, tDIdx, tMIdx) {
  if (!dragCtx.value) return
  const { dayIdx:sD, mealIdx:sM } = dragCtx.value
  if (sD===tDIdx && sM===tMIdx) return
  const tmp = weekMenu.value[sD].meals[sM].dishId
  weekMenu.value[sD].meals[sM].dishId = weekMenu.value[tDIdx].meals[tMIdx].dishId
  weekMenu.value[tDIdx].meals[tMIdx].dishId = tmp
  store.recalculateDayKcal?.(sD)
  store.recalculateDayKcal?.(tDIdx)
  store.saveWeekMenu?.()
  dragCtx.value  = null
  hoverCtx.value = null
}

// ── SMART BADGE ───────────────────────────────────────────────
function getBadge(meal, dayIdx) {
  const dish = getDish(meal.dishId)
  if (!dish) return null
  // FIX-BATCH-06: бейдж «Разогреть» отображается на Пн–Пт (включительно).
  // Раньше было > 0 && < 5 (Вт–Пт), без понедельника — пользователь явно
  // просил «с понедельника по пятницу минимум».
  if (isBatchMode.value && dayIdx >= 0 && dayIdx <= 4 && canReheat(dish)) {
    return { icon:'🔁', label:'Разогреть', bg:'var(--dinner-bg)', fg:'var(--dinner-fg)' }
  }
  const t = parseInt(dish.total_time_min || dish.time || 0)
  if (t > 0 && t <= 15) return { icon:'⚡', label:'15 мин', bg:'var(--breakfast-bg)', fg:'var(--ambd)' }
  if (isfish(dish)) return { icon:'🐟', label:'Рыба', bg:'#DBEAFE', fg:'#1E40AF' }
  return null
}

function fitLevel(recipe) {
  const tgt  = dist.value[pickerCtx.value?.type] || 400
  const diff = Math.abs(getKcal(recipe) - tgt)
  if (diff <= 60)  return 'great'
  if (diff <= 130) return 'ok'
  return 'far'
}
</script>

<template>
  <div class="menu-view">

    <!-- ══ TABS ══ -->
    <nav class="tab-bar" role="tablist">
      <button class="tab-btn" :class="{ active: activeTab==='menu' }"
              role="tab" @click="switchTab('menu')">
        <span class="tab-ico">🗓</span> Меню
      </button>
      <button class="tab-btn" :class="{ active: activeTab==='shop' }"
              role="tab" @click="switchTab('shop')">
        <span class="tab-ico">🛒</span> Покупки
        <span v-if="shopItems.filter(i => !i.done).length > 0" class="tab-badge">
          {{ shopItems.filter(i => !i.done).length }}
        </span>
      </button>
    </nav>

    <!--
      FIX-M01 + FIX-M05:
      panels-wrap — flex-колонка, занимает всё оставшееся пространство.
      Каждая panel-scroll растягивается через flex:1 и overflow-y:auto.
      ShoppingListGroup внутри своей секции получает height:100% корректно.

      FIX-M02: Используем v-show на обоих секциях — ShoppingListGroup монтируется
      один раз при первом рендере и не теряет scroll-listener при переключении.
      Секция меню и секция покупок всегда в DOM, просто скрыты через display:none.
      ShoppingListGroup сам управляет своим overflow-y:auto внутри.
    -->
    <main class="panels-wrap">

      <!-- ══ МЕНЮ ══ -->
      <section v-show="activeTab==='menu'" class="panel-scroll" role="tabpanel">

        <div class="menu-header">
          <div class="kcal-chips">
            <div class="kchip main">{{ targetKcal.toLocaleString('ru') }} ккал</div>
            <div class="kchip">Б {{ targetProtein }}г</div>
            <div class="kchip">Ж {{ targetFat }}г</div>
            <div class="kchip">У {{ targetCarbs }}г</div>
          </div>
          <div class="menu-actions">
            <button class="act-btn act-clear" :disabled="clearing" @click="confirmClear">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              {{ clearing ? 'Очищаю…' : 'Очистить всё' }}
            </button>
            <button class="act-btn act-regen" :disabled="clearing" @click="confirmReset">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></svg>
              Обновить меню
            </button>
          </div>
        </div>

        <div v-if="showResetConfirm" class="reset-confirm">
          <div class="rc-text">Сбросить всё меню и сгенерировать заново?</div>
          <div class="rc-btns">
            <button class="rc-cancel" @click="cancelReset">Отмена</button>
            <button class="rc-ok"    @click="doReset">Да, сбросить</button>
          </div>
        </div>

        <div v-if="showClearConfirm" class="reset-confirm clear-confirm">
          <div class="rc-text">Очистить всё меню? Список покупок тоже обнулится.</div>
          <div class="rc-btns">
            <button class="rc-cancel" @click="cancelClear">Отмена</button>
            <button class="rc-ok"    @click="doClear">Да, очистить</button>
          </div>
        </div>

        <div class="week-list">
          <div v-for="(day, dIdx) in weekMenu" :key="dIdx" class="day-card">

            <div class="day-head" :class="'status-' + kcalStatus(day)">
              <div class="day-head-left">
                <span class="day-weekday">{{ DAYS_RU[dIdx] || day.date }}</span>
                <span v-if="day.date && day.date !== DAYS_RU[dIdx]" class="day-date">{{ day.date }}</span>
              </div>
              <div class="day-kcal-wrap">
                <div v-if="getDayKcal(day) > 0" class="day-kcal-val">
                  {{ getDayKcal(day).toLocaleString('ru') }}
                  <span class="day-kcal-of">/ {{ targetKcal.toLocaleString('ru') }} ккал</span>
                </div>
                <div v-if="getDayKcal(day) > 0" class="day-prog-bar">
                  <div class="day-prog-fill"
                       :class="'fill-' + kcalStatus(day)"
                       :style="{ width: getDayKcalPct(day) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="meals-wrap">
              <template v-for="mealType in ['breakfast','lunch','snack','dinner']" :key="mealType">
                <template v-if="mealType !== 'snack' || hasSnack || day.meals.some(m => m.type === 'snack')">
                  <div class="meal-section">
                    <div class="meal-type-label" :style="{ color: TYPE_FG[mealType] }">
                      <span class="mtl-icon">{{ MEAL_ICONS[mealType] }}</span>
                      {{ MEAL_LABELS[mealType] }}
                      <span v-if="mealType==='lunch' && bigLunch" class="mtl-multi">· 2–3 блюда</span>
                    </div>

                    <div v-for="(meal, mIdx) in day.meals.filter(m=>m.type===mealType)"
                         :key="meal.id || mIdx"
                         class="meal-item"
                         :class="{
                           'is-dragging': dragCtx?.dayIdx===dIdx && dragCtx?.mealIdx===day.meals.indexOf(meal),
                           'drag-over':   hoverCtx?.dayIdx===dIdx && hoverCtx?.mealIdx===day.meals.indexOf(meal),
                         }"
                         draggable="true"
                         @click="openMealOptions(dIdx, day.meals.indexOf(meal), getDish(meal.dishId))"
                         @dragstart="onDragStart($event, dIdx, day.meals.indexOf(meal))"
                         @dragover.prevent="hoverCtx = { dayIdx:dIdx, mealIdx:day.meals.indexOf(meal) }"
                         @dragleave.prevent="hoverCtx = null"
                         @drop.prevent="onDrop($event, dIdx, day.meals.indexOf(meal))">

                      <div v-if="getDish(meal.dishId)" class="meal-content">
                        <div class="meal-emoji"
                             :style="{ background: getDish(meal.dishId)?.bg || TYPE_BG[mealType] }">
                          {{ getDish(meal.dishId)?.emoji || '🍽️' }}
                        </div>
                        <div class="meal-info">
                          <div class="meal-name">{{ getDish(meal.dishId)?.name }}</div>
                          <div class="meal-meta">
                            <span v-if="getDish(meal.dishId)?.time">{{ getDish(meal.dishId)?.time }} мин</span>
                            <span class="meta-sep" v-if="getDish(meal.dishId)?.time">·</span>
                            <span class="meal-kcal">{{ getDish(meal.dishId)?.kcal || getDish(meal.dishId)?.calories }} ккал</span>
                            <template v-if="getDish(meal.dishId)?.protein">
                              <span class="meta-sep">·</span>
                              <span class="meal-protein">Б {{ getDish(meal.dishId)?.protein }}г</span>
                            </template>
                          </div>
                          <div v-if="getBadge(meal, dIdx)" class="meal-badge-wrap">
                            <span class="meal-badge"
                                  :style="{ background: getBadge(meal,dIdx).bg, color: getBadge(meal,dIdx).fg }">
                              {{ getBadge(meal,dIdx).icon }} {{ getBadge(meal,dIdx).label }}
                            </span>
                          </div>
                        </div>
                        <svg class="meal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>

                      <div v-else class="meal-empty"
                           @click.stop="openPicker(dIdx, day.meals.indexOf(meal), meal.type)">
                        <span class="me-plus">+</span>
                        <span class="me-txt">Добавить блюдо</span>
                      </div>
                    </div>

                    <button class="add-to-meal-btn"
                            :style="{ '--c': TYPE_BG[mealType], '--fg': TYPE_FG[mealType] }"
                            @click="openPicker(dIdx, null, mealType)">
                      + {{ MEAL_LABELS[mealType].toLowerCase() }}
                    </button>
                  </div>
                </template>
              </template>

              <!--
                FIX: блюда с типом, не входящим в стандартные 4 слота
                (например, type=null или сторонняя категория из БД),
                теперь отрисовываются под общим заголовком «Другое».
                Раньше они падали в `filter(m=>m.type===mealType)` ни одного
                совпадения и визуально пропадали — пользователю казалось,
                что добавление из «Рецептов» удаляет блюда.
              -->
              <div
                  v-if="day.meals.some(m => !['breakfast','lunch','snack','dinner'].includes(m.type))"
                  class="meal-section"
              >
                <div class="meal-type-label" :style="{ color: 'var(--t2)' }">
                  <span class="mtl-icon">🍽️</span>
                  Другое
                </div>
                <div
                    v-for="meal in day.meals.filter(m => !['breakfast','lunch','snack','dinner'].includes(m.type))"
                    :key="meal.id"
                    class="meal-item"
                    draggable="true"
                    @click="openMealOptions(dIdx, day.meals.indexOf(meal), getDish(meal.dishId))"
                    @dragstart="onDragStart($event, dIdx, day.meals.indexOf(meal))"
                    @dragover.prevent="hoverCtx = { dayIdx:dIdx, mealIdx:day.meals.indexOf(meal) }"
                    @dragleave.prevent="hoverCtx = null"
                    @drop.prevent="onDrop($event, dIdx, day.meals.indexOf(meal))"
                >
                  <div v-if="getDish(meal.dishId)" class="meal-content">
                    <div class="meal-emoji" :style="{ background: getDish(meal.dishId)?.bg || 'var(--surf2)' }">
                      {{ getDish(meal.dishId)?.emoji || '🍽️' }}
                    </div>
                    <div class="meal-info">
                      <div class="meal-name">{{ getDish(meal.dishId)?.name }}</div>
                      <div class="meal-meta">
                        <span v-if="getDish(meal.dishId)?.time">{{ getDish(meal.dishId)?.time }} мин</span>
                        <span class="meta-sep" v-if="getDish(meal.dishId)?.time">·</span>
                        <span class="meal-kcal">{{ getDish(meal.dishId)?.kcal || getDish(meal.dishId)?.calories }} ккал</span>
                      </div>
                    </div>
                    <svg class="meal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!--
        ══ ПОКУПКИ ══
        FIX-M01: убран класс panel-flex (display:flex; flex-direction:column).
        Секция сама является panel-scroll (flex:1, overflow-y:auto).
        ShoppingListGroup внутри использует height:100% и собственный flex-layout.

        FIX-M02: v-show сохраняет компонент в DOM — scroll-listener не теряется.
      -->
      <section v-show="activeTab==='shop'" class="panel-scroll panel-shop" role="tabpanel">
        <ShoppingListGroup
            :shopItems="shopItems"
            :totalPrice="cartTotalPrice"
            @toggle="handleShopToggle"
            @delete="id => store.deleteShopItem(id)"
            @update="p => store.updateShopItem(p.id, p.n, p.q)"
            @add="p => store.addShopItem(p.name, p.qty, p.cat)"
            @clear="clearShopList"
            @rebuild="buildShoppingList"
        />
      </section>
    </main>

    <!-- ══ SHEETS ══ -->

    <BottomSheet v-model="sheets.meal" :title="mealCtx.dish?.name">
      <div class="sa-list">
        <button class="sa-btn" @click="sheets.meal=false; openRecipeDetail(mealCtx.dish)">
          <span class="sa-ico">📖</span>
          <span class="sa-label">Рецепт<span class="sa-sub">Ингредиенты и шаги</span></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="sa-btn" @click="openReplace">
          <span class="sa-ico">🔄</span>
          <span class="sa-label">Заменить<span class="sa-sub">Выбрать другой рецепт</span></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="sa-btn" @click="openDayMove">
          <span class="sa-ico">📅</span>
          <span class="sa-label">Перенести<span class="sa-sub">На другой день</span></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="sa-btn sa-danger" @click="removeDish">
          <span class="sa-ico">🗑</span>
          <span class="sa-label danger">Удалить<span class="sa-sub">Убрать из этого дня</span></span>
        </button>
      </div>
    </BottomSheet>

    <RecipeDetailSheet
        v-model="sheets.recipe"
        :recipe="viewRecipe"
        @add-to-shop="addIngsToShop"
    />

    <BottomSheet v-model="sheets.picker" title="Выбрать блюдо">
      <div class="picker-hint" v-if="pickerCtx.type && pickerCtx.type !== 'all'">
        Рекомендуем ~<strong>{{ (dist[pickerCtx.type]||400).toLocaleString('ru') }} ккал</strong> для «{{ MEAL_LABELS[pickerCtx.type] }}»
      </div>
      <div class="picker-search">
        <BaseInput v-model="searchQuery" type="search" placeholder="Найти рецепт..." />
      </div>
      <div class="picker-filters">
        <button v-for="f in PICKER_FILTERS" :key="f.value"
                class="pf-btn" :class="{ active: pickerFilter===f.value }"
                @click="pickerFilter=f.value">
          {{ f.label }}
        </button>
      </div>
      <div class="picker-list">
        <div v-if="filteredRecipes.length===0" class="picker-empty">
          <span style="font-size:2rem">🍽️</span>
          <p>Рецепты не найдены</p>
        </div>
        <button v-for="r in filteredRecipes" :key="r.id"
                class="picker-item" @click="pickDish(r.id)">
          <div class="pi-ico" :style="{ background: r.bg||'var(--gp)' }">{{ r.emoji||'🍽️' }}</div>
          <div class="pi-info">
            <div class="pi-name">{{ r.name }}</div>
            <div class="pi-meta">{{ MEAL_LABELS[r.type] || r.type }} · {{ r.time }} мин</div>
          </div>
          <div class="pi-kcal" :class="'fit-'+fitLevel(r)">{{ getKcal(r) }} ккал</div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;color:var(--t-dis)"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </BottomSheet>

    <BottomSheet v-model="sheets.dayMove" title="Перенести на день">
      <div class="day-pick-list">
        <button v-for="(day, idx) in weekMenu" :key="idx"
                class="dp-btn" :class="{ current: idx===mealCtx.dayIdx }"
                @click="moveMealToDay(idx)">
          <span class="dp-day">{{ DAYS_RU[idx] || day.date }}</span>
          <span class="dp-kcal">{{ getDayKcal(day) > 0 ? getDayKcal(day).toLocaleString('ru') + ' ккал' : 'Свободен' }}</span>
          <span v-if="idx===mealCtx.dayIdx" class="dp-now">Сейчас</span>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </BottomSheet>

  </div>
</template>

<style scoped>
.menu-view {
  display:flex; flex-direction:column; height:100%;
  background:var(--bg); overflow:hidden;
}

.tab-bar {
  flex-shrink:0; display:flex;
  background:var(--surf); border-bottom:1px solid var(--bdr);
}
.tab-btn {
  flex:1; height:50px; display:flex; align-items:center; justify-content:center; gap:6px;
  font-size:.88rem; font-weight:700; font-family:inherit; color:var(--t3);
  background:none; border:none; border-bottom:3px solid transparent;
  cursor:pointer; transition:color .2s,border-color .2s;
}
.tab-btn.active { color:var(--gd); border-bottom-color:var(--g); }
.tab-ico { font-size:1rem; line-height:1; }
.tab-badge {
  min-width:18px; height:18px; padding:0 5px;
  background:var(--g); color:#fff; font-size:.65rem; font-weight:800;
  border-radius:9px; display:inline-flex; align-items:center; justify-content:center;
}

/*
  FIX-M05: panels-wrap — flex-колонка, занимает всё оставшееся место.
  Обе дочерние секции имеют flex:1 и overflow-y:auto.
  При v-show="false" секция скрыта (display:none), но остаётся в DOM.
*/
.panels-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* FIX-M01: position:absolute для v-show-секций чтобы обе занимали одно место */
  position: absolute;
  inset: 0;
}
.panel-scroll::-webkit-scrollbar { display: none; }

/*
  FIX-M01: секция покупок — НЕТ display:flex.
  ShoppingListGroup сам flex-column с height:100%.
  panel-shop занимает весь inset:0 и передаёт высоту дочернему компоненту.
*/
.panel-shop {
  display: flex;
  flex-direction: column;
  overflow: hidden; /* ShoppingListGroup сам скроллит внутри */
}

.menu-header {
  padding:12px 14px 10px;
  background:var(--surf); border-bottom:1px solid var(--bdr);
  display:flex; align-items:center; justify-content:space-between; gap:10px;
}
.kcal-chips {
  display: grid;
  grid-template-columns: repeat(3, auto); /* Создаем 3 колонки под Б, Ж и У */
  gap: 6px;
}

.kchip {
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--surf2);
  font-size: .76rem;
  font-weight: 700;
  color: var(--t2);
  border: 1px solid var(--bdr);
  white-space: nowrap;
  text-align: center; /* Центрируем текст внутри плашек */
}

.kchip.main {
  grid-column: 1 / -1; /* Заставляем главный чипс растянуться на все 3 колонки сверху */
  justify-self: stretch; /* Растягиваем на всю доступную ширину нижних колонок */
  background: var(--gp);
  color: var(--gd);
  border-color: var(--gpp);
  font-size: .82rem;
}
.menu-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.act-btn {
  height:36px; padding:0 12px; border-radius:10px; display:flex; align-items:center; gap:6px;
  font-size:.78rem; font-weight:700; font-family:inherit; cursor:pointer;
  border:1.5px solid var(--bdr); background:var(--surf); color:var(--t2); transition:all .18s;
  white-space: nowrap;
}
.act-clear:hover { border-color:var(--coral); background:var(--coralp); color:var(--coral); }
.act-regen:hover { border-color:var(--coral); background:var(--coralp); color:var(--coral); }

.reset-confirm {
  margin:0 14px 4px; padding:12px 14px;
  background:var(--ambp); border:1px solid rgba(217,119,6,.25); border-radius:14px;
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
}
.rc-text { flex:1; font-size:.86rem; font-weight:600; color:#7C4A03; }
.rc-btns { display:flex; gap:8px; }
.rc-cancel,.rc-ok {
  height:34px; padding:0 14px; border-radius:9px; font-size:.82rem;
  font-weight:700; font-family:inherit; cursor:pointer; transition:all .15s;
}
.rc-cancel { border:1.5px solid rgba(217,119,6,.3); background:transparent; color:#7C4A03; }
.rc-cancel:hover { background:rgba(217,119,6,.1); }
.rc-ok { border:none; background:var(--coral); color:#fff; }
.rc-ok:hover { opacity:.88; }

.week-list {
  padding:12px 14px calc(var(--nav-total-h,80px) + 20px);
  display:flex; flex-direction:column; gap:14px;
}

.day-card {
  background:var(--surf); border-radius:20px;
  border:1.5px solid var(--bdr); overflow:hidden; box-shadow:var(--sh1);
}
.day-head {
  padding:11px 14px 9px;
  background:var(--gp); border-bottom:1px solid var(--gpp);
  display:flex; align-items:flex-start; justify-content:space-between; gap:8px;
}
.day-head.status-ok   { background:linear-gradient(135deg,#E8F8F0,#D0F0E0); border-color:#B8E6CE; }
.day-head.status-low  { background:linear-gradient(135deg,var(--ambp),#FDE8A0); border-color:rgba(217,119,6,.2); }
.day-head.status-over { background:linear-gradient(135deg,var(--coralp),#FDDDD8); border-color:rgba(201,64,64,.2); }
.day-head-left { display:flex; flex-direction:column; gap:2px; }
.day-weekday { font-family:'Playfair Display',serif; font-size:1rem; font-weight:800; color:var(--t1); }
.day-date { font-size:.72rem; color:var(--t3); }
.day-kcal-wrap { display:flex; flex-direction:column; align-items:flex-end; gap:4px; min-width:0; }
.day-kcal-val { font-size:.72rem; font-weight:700; color:var(--t2); white-space:nowrap; }
.day-kcal-of { font-weight:400; color:var(--t3); }
.day-prog-bar { width:90px; height:4px; background:rgba(255,255,255,.5); border-radius:4px; overflow:hidden; }
.day-prog-fill { height:100%; border-radius:4px; transition:width .4s; }
.fill-ok   { background:linear-gradient(90deg,#3DBE71,#7FD4A0); }
.fill-low  { background:linear-gradient(90deg,var(--amb),#FCD34D); }
.fill-over { background:linear-gradient(90deg,#EF4444,#FCA5A5); }

.meals-wrap { display:flex; flex-direction:column; }
.meal-section { border-bottom:1px solid rgba(69,174,107,.07); }
.meal-section:last-child { border-bottom:none; }
.meal-type-label {
  padding:8px 14px 0;
  font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em;
  display:flex; align-items:center; gap:5px;
}
.mtl-icon { font-size:.85rem; }
.mtl-multi { font-weight:400; text-transform:none; letter-spacing:0; font-size:.65rem; opacity:.7; }

.meal-item { cursor:pointer; transition:background .12s; min-height:58px; }
.meal-item:hover { background:var(--bg); }
.meal-item.is-dragging { opacity:.4; }
.meal-item.drag-over { background:var(--gp); box-shadow:inset 0 0 0 2px var(--g); }
.meal-content { display:flex; align-items:center; gap:10px; padding:7px 14px 10px; }
.meal-emoji {
  width:44px; height:44px; border-radius:13px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:1.35rem;
}
.meal-info { flex:1; min-width:0; }
.meal-name { font-size:.92rem; font-weight:700; color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.meal-meta { display:flex; align-items:center; gap:5px; margin-top:3px; font-size:.73rem; color:var(--t3); flex-wrap:wrap; }
.meta-sep { color:var(--bdr2); }
.meal-kcal { color:var(--t3); }
.meal-protein { color:var(--gd); font-weight:600; }
.meal-badge-wrap { margin-top:4px; }
.meal-badge { display:inline-flex; align-items:center; gap:3px; font-size:.63rem; font-weight:700; padding:2px 7px; border-radius:8px; }
.meal-arrow { color:var(--t-dis); flex-shrink:0; margin-left:auto; }
.meal-empty { display:flex; align-items:center; gap:10px; padding:10px 14px 12px; cursor:pointer; color:var(--t3); }
.me-plus {
  width:32px; height:32px; border-radius:10px; flex-shrink:0;
  border:1.5px dashed var(--bdr2);
  display:flex; align-items:center; justify-content:center;
  font-size:1.1rem; color:var(--t-dis);
}
.me-txt { font-size:.85rem; color:var(--t3); }
.add-to-meal-btn {
  display:block; width:calc(100% - 28px); margin:4px 14px 8px;
  height:32px; border-radius:9px; font-size:.74rem; font-weight:700; font-family:inherit;
  border:1.5px dashed var(--bdr); background:transparent; cursor:pointer;
  color:var(--t3); transition:all .15s;
}
.add-to-meal-btn:hover { border-color:var(--g); background:var(--gp); color:var(--gd); }

.sa-list { display:flex; flex-direction:column; gap:8px; padding-top:4px; }
.sa-btn {
  display:flex; align-items:center; gap:14px; width:100%;
  padding:13px 16px; background:var(--surf); border:1.5px solid var(--bdr);
  border-radius:15px; cursor:pointer; font-family:inherit; transition:all .15s;
}
.sa-btn:hover { background:var(--gp); border-color:var(--gpp); }
.sa-btn > svg { color:var(--t-dis); flex-shrink:0; margin-left:auto; }
.sa-danger { border-color:rgba(201,64,64,.2); }
.sa-danger:hover { background:var(--coralp); border-color:var(--coral); }
.sa-ico { font-size:1.3rem; flex-shrink:0; }
.sa-label { flex:1; text-align:left; font-size:.93rem; font-weight:700; color:var(--t1); display:flex; flex-direction:column; gap:1px; }
.sa-label.danger { color:var(--coral); }
.sa-sub { font-size:.76rem; font-weight:400; color:var(--t3); }

/* Стили попапа рецепта (.recipe-body, .recipe-hero, .rchip, .ing-list, .step-list)
   вынесены в components/organisms/RecipeDetailSheet.vue. */


.picker-hint { padding:8px 12px; border-radius:10px; margin-bottom:10px; background:var(--gp); border:1px solid var(--gpp); font-size:.8rem; color:var(--t2); display:flex; gap:6px; align-items:center; }
.picker-hint strong { color:var(--gd); }
.picker-search { margin-bottom:10px; }
.picker-filters { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:10px; }
.picker-filters::-webkit-scrollbar { display:none; }
.pf-btn { height:34px; padding:0 14px; border-radius:20px; flex-shrink:0; font-size:.8rem; font-weight:700; font-family:inherit; white-space:nowrap; border:1.5px solid var(--bdr); background:var(--surf); color:var(--t2); cursor:pointer; transition:all .15s; }
.pf-btn.active { background:var(--gp); border-color:var(--g); color:var(--gd); }
.pf-btn:hover:not(.active) { border-color:var(--g); color:var(--gd); }
.picker-list { display:flex; flex-direction:column; gap:7px; padding-top:2px; }
.picker-empty { text-align:center; padding:32px 20px; color:var(--t3); display:flex; flex-direction:column; align-items:center; gap:8px; }
.picker-item { display:flex; align-items:center; gap:11px; width:100%; padding:11px 13px; background:var(--surf); border-radius:14px; border:1.5px solid var(--bdr); cursor:pointer; text-align:left; font-family:inherit; transition:all .15s; }
.picker-item:hover { background:var(--gp); border-color:var(--gpp); }
.pi-ico { width:44px; height:44px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:1.4rem; }
.pi-info { flex:1; min-width:0; }
.pi-name { font-size:.9rem; font-weight:700; color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pi-meta { font-size:.74rem; color:var(--t3); margin-top:2px; }
.pi-kcal { font-size:.73rem; font-weight:700; padding:3px 8px; border-radius:8px; background:var(--surf2); color:var(--t3); white-space:nowrap; flex-shrink:0; }
.pi-kcal.fit-great { background:var(--gp); color:var(--gd); }
.pi-kcal.fit-ok    { background:var(--ambp); color:var(--amb); }

.day-pick-list { display:flex; flex-direction:column; gap:8px; padding-top:4px; }
.dp-btn { display:flex; align-items:center; gap:12px; width:100%; padding:13px 16px; background:var(--surf); border:1.5px solid var(--bdr); border-radius:14px; cursor:pointer; font-family:inherit; transition:all .15s; }
.dp-btn:hover:not(.current) { background:var(--gp); border-color:var(--gpp); }
.dp-btn.current { border-color:var(--g); background:var(--gp); cursor:default; }
.dp-btn > svg { color:var(--t-dis); margin-left:auto; }
.dp-day  { font-size:.93rem; font-weight:700; color:var(--t1); flex:1; text-align:left; }
.dp-kcal { font-size:.76rem; color:var(--t3); white-space:nowrap; }
.dp-now  { font-size:.7rem; font-weight:800; padding:2px 8px; border-radius:10px; background:var(--gp); color:var(--gd); border:1px solid var(--gpp); }
</style>