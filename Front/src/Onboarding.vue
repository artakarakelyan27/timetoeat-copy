<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useMenuStore } from '@/stores/menuStore'
import { useTrack } from '@/composables/useTrack'
import { generateWeekMenu } from '@/utils/mealPlanGenerator'
const { track, trackRecipe, EVENT } = useTrack()

const onboardingStartTs = Date.now()

const authStore = useAuthStore()
const menuStore = useMenuStore()
const router = useRouter()
const isLoggedIn = computed(() => !!authStore.token)

// ════════════════════════════════════════
// PROPS — массив рецептов из store
// ════════════════════════════════════════
const props = defineProps({
  recipes: { type: Array, default: () => [] }
})

// ════════════════════════════════════════
// СТАТИЧНЫЕ ДАННЫЕ ДЛЯ СВАЙП-СТЕКА
// ════════════════════════════════════════
const CATEGORY_EMOJI = {
  'напитки':'🥤','супы':'🍲','салаты':'🥗','завтраки':'🥞','завтрак':'🥞',
  'горячее':'🍖','выпечка':'🥐','десерты':'🍰','паста':'🍝','рыба':'🐟',
  'мясо':'🥩','птица':'🍗','овощи':'🥦','каши':'🥣'
}
const CATEGORY_BG = {
  'напитки':'#E3F2FD','супы':'#FFF0E0','салаты':'#E4F5EA','завтраки':'#FFF5E0',
  'завтрак':'#FFF5E0','горячее':'#FFF0E0','выпечка':'#FFF5E0','десерты':'#FCE4EC',
  'паста':'#E4F5EA','рыба':'#E3F2FD','мясо':'#FFF0E0','птица':'#FFF5E0',
  'овощи':'#E4F5EA','каши':'#FFF5E0'
}

// Fallback блюда если нет рецептов из store
const FALLBACK_DISHES = [
  { id:'pasta', name:'Паста карбонара', emoji:'🍝', bg:'#E4F5EA', time:'25 мин', kcal:'540 ккал',
    desc:'Шёлковый соус из яиц и пармезана, хрустящий бекон — классика Рима.',
    tags:['итальянская','pasta'], type:'dinner' },
  { id:'borscht', name:'Борщ со сметаной', emoji:'🍲', bg:'#FFF0E0', time:'60 мин', kcal:'280 ккал',
    desc:'Наваристый бульон на говяжьей кости, кисло-сладкая свёкла.',
    tags:['русская','супы'], type:'lunch' },
  { id:'salmon', name:'Запечённая сёмга', emoji:'🐟', bg:'#E3F2FD', time:'30 мин', kcal:'380 ккал',
    desc:'Нежное филе в горчично-лимонном маринаде.',
    tags:['рыба','здоровое'], type:'dinner' },
  { id:'caesar', name:'Цезарь с курицей', emoji:'🥗', bg:'#E4F5EA', time:'20 мин', kcal:'310 ккал',
    desc:'Хрустящие листья ромэна, курица, гренки, пармезан.',
    tags:['салаты','итальянская'], type:'lunch' },
  { id:'oatmeal', name:'Овсянка с ягодами', emoji:'🥣', bg:'#FFF5E0', time:'10 мин', kcal:'290 ккал',
    desc:'Медленные углеводы, антиоксиданты и долгое насыщение.',
    tags:['завтраки','здоровое'], type:'breakfast' },
  { id:'cutlets', name:'Котлеты с пюре', emoji:'🍖', bg:'#FFF0E0', time:'40 мин', kcal:'520 ккал',
    desc:'Сочные говяжьи котлеты и нежнейшее сливочное пюре.',
    tags:['русская','горячее'], type:'dinner' },
  { id:'risotto', name:'Ризотто с грибами', emoji:'🫕', bg:'#EDE7F6', time:'40 мин', kcal:'460 ккал',
    desc:'Кремовый рис арборио с ароматными шампиньонами.',
    tags:['итальянская'], type:'dinner' },
  { id:'greek', name:'Греческий салат', emoji:'🥣', bg:'#E4F5EA', time:'15 мин', kcal:'220 ккал',
    desc:'Томаты, огурцы, фета, маслины — без варки и жарки.',
    tags:['салаты'], type:'lunch' },
  { id:'pancakes', name:'Оладьи с мёдом', emoji:'🥞', bg:'#FFF0E0', time:'20 мин', kcal:'350 ккал',
    desc:'Пышные кефирные оладьи — любимый завтрак всей семьи.',
    tags:['завтраки','русская'], type:'breakfast' },
  { id:'chicken_soup', name:'Куриный суп', emoji:'🍲', bg:'#FFF0E0', time:'45 мин', kcal:'210 ккал',
    desc:'Прозрачный бульон с лапшой и свежей зеленью.',
    tags:['супы','русская'], type:'lunch' },
]

function mapRecipeToDish(r) {
  const cat = (r.category || '').toLowerCase()
  return {
    id: r.id || r.slug,
    name: r.title,
    emoji: CATEGORY_EMOJI[cat] || '🍽️',
    bg: CATEGORY_BG[cat] || '#E4F5EA',
    time: r.total_time_min ? `${r.total_time_min} мин` : '—',
    kcal: r.calories ? `${Math.round(r.calories)} ккал` : '—',
    desc: r.description || '',
    tags: r.tags || [],
    type: r.type || 'dinner',
    ingredients: r.ingredients || [],
    steps: r.steps || [],
  }
}

const DISHES = computed(() => {
  if (props.recipes?.length) return props.recipes.map(mapRecipeToDish)
  return FALLBACK_DISHES
})

// ════════════════════════════════════════
// НАВИГАЦИЯ — 6 шагов
// ════════════════════════════════════════
// welcome → s-family → s-profile → s-goal → s-prefs → s-swipe → s-aha
const STEPS = ['s-family', 's-profile', 's-goal', 's-prefs', 's-swipe', 's-aha']
const STEP_NUM   = { 's-family':1, 's-profile':2, 's-goal':3, 's-prefs':4, 's-swipe':5, 's-aha':6 }
const STEP_TOTAL = 5 // свайп без цифры
const PROG_MAP   = { 's-family':10, 's-profile':28, 's-goal':46, 's-prefs':64, 's-swipe':82, 's-aha':100 }
const STEP_LABEL = {
  's-family': 'Кто за столом',
  's-profile':'Немного о тебе',
  's-goal':   'Цель и ритм жизни',
  's-prefs':  'Что любишь и не любишь',
  's-swipe':  'Покажи, что нравится',
  's-aha':    'Готово!',
}

const curScreen = ref('s-welcome')
const topbarVisible = ref(false)
const progVisible   = ref(false)

const progWidth  = computed(() => (PROG_MAP[curScreen.value] || 0) + '%')
const progStep   = computed(() => STEP_NUM[curScreen.value] || 0)
const progLabel  = computed(() => STEP_LABEL[curScreen.value] || '')
const isSwipeScreen = computed(() => curScreen.value === 's-swipe')

async function goStep(id) {
  curScreen.value = id
  await nextTick()
  if (id === 's-welcome') {
    topbarVisible.value = false
    progVisible.value   = false
  } else if (id === 's-swipe') {
    topbarVisible.value = true
    progVisible.value   = false
    swipeIdx.value = 0
    swipeHist.value = []
    await nextTick()
    attachTopCardDrag()
  } else if (id === 's-aha') {
    topbarVisible.value = false
    progVisible.value   = false
    // FIX-AUTH-LEAK-04: ранее savePreferencesToStore() вызывался безусловно при
    // переходе на экран результата. Это писало «анонимные» онбординговые prefs в
    // localStorage. Если потом юзер логинился существующим аккаунтом, и сервер
    // возвращал preferences=null, локалка переживала setAuth() и применялась к
    // профилю как «свои». Теперь сохраняем prefs только для гостей —
    // у залогиненного юзера и так есть свои настройки на сервере.
    if (!isLoggedIn.value) {
      savePreferencesToStore()
    }
    generateAhaMenu()
    track(EVENT.ONBOARDING_AHA_SHOWN, {
      weekDishCount: ahaWeek.value.reduce((s, d) => s + (d.meals?.length || 0), 0),
      avgKcal: Math.round(
        ahaWeek.value.reduce((s, d) => s + (d.dayKcal || 0), 0) / 7
      ),
      isBatchMode: isBatchMode.value,
      swipesDone: swipeHist.value.length,
    })
  } else {
    topbarVisible.value = true
    progVisible.value   = true
  }
}

function startOnboarding() {
  track(EVENT.ONBOARDING_STARTED, { source: 'welcome' })
  goStep('s-family')
}
function skipToResults() {
  if (curScreen.value !== 's-welcome') {
    track(EVENT.ONBOARDING_SKIPPED, { fromStep: curScreen.value })
    goStep('s-aha')
  }
}

// ════════════════════════════════════════
// ШАГ 1 — СЕМЬЯ
// ════════════════════════════════════════
const famCount = ref(3)
const FAM_PL = ['человек','человека','человека','человека','человек','человек']
const FAM_EM = ['👩','👨','👧','👦','👵','👴']
const FAM_BG = ['#E4F5EA','#FFF0E0','#E3F2FD','#FFF5E0','#EDE7F6','#FCE4EC']

const familyTags = reactive({ kids_small: false, kids: false, teens: false, elderly: false })

const famLabel   = computed(() => famCount.value + ' ' + FAM_PL[famCount.value - 1])
const famAvatars = computed(() => {
  return Array.from({ length: famCount.value }, (_, i) => ({
    bg: FAM_BG[i % FAM_BG.length],
    em: FAM_EM[i % FAM_EM.length],
  }))
})
const sliderPct  = computed(() => ((famCount.value - 1) / 5) * 100)

function onFamInput(e) {
  famCount.value = Math.max(1, Math.min(6, parseInt(e.target.value) || 1))
}
function toggleFamTag(k) { familyTags[k] = !familyTags[k] }

// ════════════════════════════════════════
// ШАГ 2 — ПРОФИЛЬ (антропометрия)
// ════════════════════════════════════════
const gender    = ref('female')   // 'male' | 'female'
const age       = ref(32)
const weight    = ref(65)
const height    = ref(165)
const goalWeight = ref(null)      // null = не указан

// Миффлин-Сан Жеор — расчёт BMR в реальном времени
const bmr = computed(() => {
  const w = weight.value, h = height.value, a = age.value
  if (gender.value === 'female') return Math.round(10 * w + 6.25 * h - 5 * a - 161)
  return Math.round(10 * w + 6.25 * h - 5 * a + 5)
})

// TDEE с учётом уровня активности (устанавливается на шаге 3)
const activityCoeff = computed(() => {
  const map = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, very_high: 1.9 }
  return map[activityLevel.value] || 1.375
})

const tdee = computed(() => Math.round(bmr.value * activityCoeff.value))

// Целевые калории с учётом цели
const targetKcal = computed(() => {
  const base = tdee.value
  if (goal.value === 'lose')   return Math.round(base * 0.82)   // дефицит ~18%
  if (goal.value === 'gain')   return Math.round(base * 1.12)   // профицит ~12%
  return base // поддержание
})

// Макронутриенты
const macros = computed(() => {
  const kcal = targetKcal.value
  const w = weight.value
  // Белок: 1.8–2.2г/кг для похудения, 1.6–2.0г для набора, 1.4–1.8г для поддержания
  const proteinPerKg = goal.value === 'lose' ? 2.0 : goal.value === 'gain' ? 1.8 : 1.6
  const protein = Math.round(w * proteinPerKg)
  // Жир: 0.8–1.0г/кг
  const fat = Math.round(w * 0.9)
  // Углеводы — остаток
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4)
  return { protein, fat, carbs: Math.max(carbs, 50) }
})

// BMI
const bmi = computed(() => {
  const h = height.value / 100
  return (weight.value / (h * h)).toFixed(1)
})

const bmiLabel = computed(() => {
  const b = parseFloat(bmi.value)
  if (b < 18.5) return 'Дефицит массы'
  if (b < 25)   return 'Норма'
  if (b < 30)   return 'Избыточная масса'
  return 'Ожирение'
})

// ════════════════════════════════════════
// ШАГ 3 — ЦЕЛЬ И РИТМ
// ════════════════════════════════════════
const goal          = ref('health')    // 'lose' | 'gain' | 'health'
const activityLevel = ref('light')     // sedentary | light | moderate | high | very_high
const cookFreq      = ref('daily')     // 'daily' | 'weekends' | 'once_week'
const cookTime      = ref(30)          // минут в день: 15, 30, 60, 90
const budget        = ref('mid')       // 'low' | 'mid' | 'high'

const isBatchMode = computed(() => cookFreq.value === 'weekends' || cookFreq.value === 'once_week')

const GOALS = [
  { key: 'lose',   icon: '📉', title: 'Похудеть',       sub: `Дефицит -18%, ~${bmr.value ? Math.round(bmr.value * activityCoeff.value * 0.82) : '—'} ккал/день` },
  { key: 'health', icon: '💚', title: 'Здоровье',        sub: `Поддержание, ~${tdee.value || '—'} ккал/день` },
  { key: 'gain',   icon: '📈', title: 'Набрать массу',   sub: `Профицит +12%, ~${bmr.value ? Math.round(bmr.value * activityCoeff.value * 1.12) : '—'} ккал/день` },
]

const ACTIVITIES = [
  { key: 'sedentary',  icon: '💺', label: 'Сидячая',       sub: 'Офис, без спорта', coeff: 1.2 },
  { key: 'light',      icon: '🚶', label: 'Лёгкая',        sub: 'Прогулки, 1–2 тренировки', coeff: 1.375 },
  { key: 'moderate',   icon: '🏃', label: 'Умеренная',     sub: '3–5 тренировок в неделю', coeff: 1.55 },
  { key: 'high',       icon: '🏋️', label: 'Высокая',       sub: '6–7 тренировок в неделю', coeff: 1.725 },
]

const COOK_FREQS = [
  { key: 'daily',     icon: '🍳', title: 'Каждый день',     sub: 'Готовлю ежедневно', batch: false },
  { key: 'once_week', icon: '🫙', title: 'Раз в неделю',    sub: 'Готовлю впрок на всю неделю', batch: true },
]

const COOK_TIMES = [
  { val: 15, label: '15 мин',  sub: 'Только быстрые' },
  { val: 30, label: '30 мин',  sub: 'Большинство блюд' },
  { val: 60, label: '1 час',   sub: 'Больше разнообразия' },
  { val: 90, label: '1,5 ч+',  sub: 'Сложные рецепты' },
]

// ════════════════════════════════════════
// ШАГ 4 — ПРЕДПОЧТЕНИЯ
// ════════════════════════════════════════
const restrictionTags = reactive({
  veg: false, vegan: false, gluten: false, lactose: false,
  nuts: false, seafood: false, pork: false, halal: false,
})
const cuisineTags = reactive({
  russian: true, italian: true, asian: false, caucasian: false,
  mediterranean: false, fast: false, pp: false,
})
const dislikedProducts = ref('')    // текстовое поле — «не люблю...»

const RESTRICTIONS = [
  { key: 'veg',      icon: '🥦', label: 'Вегетарианство' },
  { key: 'vegan',    icon: '🌱', label: 'Веганство' },
  { key: 'gluten',   icon: '🌾', label: 'Без глютена' },
  { key: 'lactose',  icon: '🥛', label: 'Без лактозы' },
  { key: 'nuts',     icon: '🥜', label: 'Без орехов' },
  { key: 'seafood',  icon: '🦐', label: 'Без морепродуктов' },
  { key: 'pork',     icon: '🐷', label: 'Без свинины' },
  { key: 'halal',    icon: '☪️',  label: 'Халяль' },
]

const CUISINES = [
  { key: 'russian',       icon: '🫕', label: 'Русская' },
  { key: 'italian',       icon: '🍝', label: 'Итальянская' },
  { key: 'asian',         icon: '🍜', label: 'Азиатская' },
  { key: 'caucasian',     icon: '🥩', label: 'Кавказская' },
  { key: 'mediterranean', icon: '🫒', label: 'Средиземноморская' },
  { key: 'pp',            icon: '💪', label: 'Правильное питание' },
  { key: 'fast',          icon: '⚡', label: 'Быстрые блюда' },
]

function toggleRestriction(k) { restrictionTags[k] = !restrictionTags[k] }
function toggleCuisine(k)     { cuisineTags[k]     = !cuisineTags[k] }

// ════════════════════════════════════════
// ШАГ 5 — СВАЙП
// ════════════════════════════════════════
const swipeIdx  = ref(0)
const swipeHist = ref([])   // { idx, liked }
const likedIds  = computed(() => swipeHist.value.filter(h => h.liked).map(h => DISHES.value[h.idx]?.id).filter(Boolean))
const dislikedIds = computed(() => swipeHist.value.filter(h => !h.liked).map(h => DISHES.value[h.idx]?.id).filter(Boolean))

const swipeCards = computed(() => {
  const out = []
  const cnt = Math.min(3, DISHES.value.length - swipeIdx.value)
  for (let i = 0; i < cnt; i++) {
    const cls = i === 0 ? 'top' : i === 1 ? 'behind-1' : 'behind-2'
    out.push({ dish: DISHES.value[swipeIdx.value + i], cls, key: swipeIdx.value + i })
  }
  return out
})

function afterVote(liked) {
  // ── НОВОЕ: трекинг свайпа ──
  const dish = DISHES.value[swipeIdx.value]
  if (dish) {
    // Восстанавливаем "полный" объект из props.recipes
    const fullRecipe = props.recipes?.find(r => (r.id || r.slug) === dish.id) || dish
    trackRecipe(
      liked ? EVENT.ONBOARDING_SWIPE_LIKE : EVENT.ONBOARDING_SWIPE_DISLIKE,
      fullRecipe
    )
  }
  // ── /НОВОЕ ──

  swipeHist.value.push({ idx: swipeIdx.value, liked })
  swipeIdx.value++
  if (swipeIdx.value >= DISHES.value.length) goStep('s-aha')
  else nextTick(() => attachTopCardDrag())
}

function doVote(liked) {
  const card = document.querySelector('.dish-card.top')
  if (!card) return
  card.style.transition = 'transform .32s var(--ease-out),opacity .26s'
  const d = liked ? 1 : -1
  const ov = card.querySelector('.vote-ov.' + (liked ? 'like' : 'nope'))
  if (ov) ov.style.opacity = 1
  card.style.transform = 'translate(' + (d * 700) + 'px,-40px) rotate(' + (d * 32) + 'deg)'
  card.style.opacity = '0'
  setTimeout(() => afterVote(liked), 340)
}

function undoSwipe() {
  if (!swipeHist.value.length) return
  const last = swipeHist.value[swipeHist.value.length - 1]
  track(EVENT.ONBOARDING_SWIPE_UNDO, {
    recipeId: DISHES.value[last.idx]?.id,
    prevDirection: last.liked ? 'right' : 'left',
  })
  swipeHist.value.pop()
  swipeIdx.value--
}

function attachTopCardDrag() {
  const card = document.querySelector('.dish-card.top')
  if (!card || card.dataset.dragAttached) return
  card.dataset.dragAttached = '1'
  let drag = false, sx = 0, sy = 0, dx = 0, animating = false
  const getXY = (e) => { const p = e.touches ? e.touches[0] : e; return { x: p.clientX, y: p.clientY } }
  const start = (e) => { if (animating) return; drag = true; dx = 0; const p = getXY(e); sx = p.x; sy = p.y; card.style.transition = 'none' }
  const move  = (e) => {
    if (!drag) return
    const p = getXY(e)
    dx = p.x - sx
    const dy = p.y - sy
    if (Math.abs(dy) > Math.abs(dx) * 2 && Math.abs(dx) < 12) return
    card.style.transform = 'translate(' + dx + 'px,' + (dy * 0.12) + 'px) rotate(' + (dx * 0.06) + 'deg)'
    const lo = card.querySelector('.vote-ov.like'), no = card.querySelector('.vote-ov.nope')
    if (dx > 30)       { if(lo) lo.style.opacity = Math.min(1,(dx-30)/60); if(no) no.style.opacity=0 }
    else if (dx < -30) { if(no) no.style.opacity = Math.min(1,(-dx-30)/60); if(lo) lo.style.opacity=0 }
    else               { if(lo) lo.style.opacity=0; if(no) no.style.opacity=0 }
    if (e.cancelable) e.preventDefault()
  }
  const end = () => {
    if (!drag) return
    drag = false
    card.style.transition = 'transform .32s var(--ease-out),opacity .26s'
    if (Math.abs(dx) > 75) {
      animating = true
      const liked = dx > 0
      card.style.transform = 'translate(' + (liked ? 700 : -700) + 'px,-40px) rotate(' + (liked ? 32 : -32) + 'deg)'
      card.style.opacity = '0'
      setTimeout(() => afterVote(liked), 340)
    } else {
      card.style.transform = ''
      const lo = card.querySelector('.vote-ov.like'); if (lo) lo.style.opacity = 0
      const no = card.querySelector('.vote-ov.nope'); if (no) no.style.opacity = 0
    }
    dx = 0
  }
  card.addEventListener('mousedown', start)
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', end)
  card.addEventListener('touchstart', start, { passive: true })
  card.addEventListener('touchmove', move, { passive: false })
  card.addEventListener('touchend', end)
}

// ════════════════════════════════════════
// ШАГ 6 — AHA-MOMENT + BATCH ПЛАН
// ════════════════════════════════════════

// Генерируем недельное меню для показа на Aha-экране
const ahaWeek = ref([])
const ahaResult = ref(null)  // содержит { stats, fallbackApplied, adultEquivalent, useSnack }
const activeTab = ref('menu')

const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']
const TYPE_BG  = { Завтрак:'#FEF3C7', Обед:'#EBF8F1', Ужин:'#EEEDFE', Перекус:'#E6F1FB' }
const TYPE_FG  = { Завтрак:'#633806', Обед:'#085041', Ужин:'#3C3489', Перекус:'#0C447C' }
const MEAL_TYPE_ICONS = { Завтрак:'☀️', Обед:'🌿', Ужин:'🌙', Перекус:'🍎' }

// Smart badges по признакам блюда
function getBadges(dish, dayIdx, mealType) {
  const badges = []
  if (isBatchMode.value && mealType !== 'Завтрак' && dayIdx > 0 && dayIdx < 5) {
    badges.push({ icon: '🔁', label: 'Разогреть', color: '#EEEDFE', text: '#3C3489' })
  }
  if (dish.time && parseInt(dish.time) <= 15) {
    badges.push({ icon: '⏱', label: '15 мин', color: '#EBF8F1', text: '#085041' })
  }
  return badges.slice(0, 2)
}

function generateAhaMenu() {
  const dishes = DISHES.value
  if (!dishes.length) return

  // Собираем prefs в том же формате, в котором он сохраняется в authStore
  const prefs = {
    familySize: famCount.value,
    familyTags: { ...familyTags },
    targetKcal: targetKcal.value,
    targetProtein: macros.value.protein,
    targetFat: macros.value.fat,
    targetCarbs: macros.value.carbs,
    goal: goal.value,
    activityLevel: activityLevel.value,
    cookFreq: cookFreq.value,
    cookTime: cookTime.value,
    budget: budget.value,
    restrictions: { ...restrictionTags },
    cuisines: { ...cuisineTags },
    dislikedProducts: dislikedProducts.value,
    likedDishIds: likedIds.value,
    dislikedDishIds: dislikedIds.value,
  }

  // Генератор работает с тем же форматом recipe, что DISHES даёт после mapRecipeToDish
  const result = generateWeekMenu(dishes, prefs)

  // Преобразуем в формат, который ждёт текущий шаблон Aha-экрана
  // (массив с .day, .meals[].t, .meals[].dish, .meals[].prepType, .dayKcal)
  const TYPE_LABELS = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' }
  ahaWeek.value = result.weekMenu.map(d => ({
    day: d.day,
    dayKcal: d.dayKcal,
    meals: d.meals.map(m => ({
      t: TYPE_LABELS[m.slot] || m.slot,
      dish: m.recipe,
      prepType: m.isBatch ? 'reheat' : 'fresh',
    })),
  }))

  // Сохраняем метаданные генерации, чтобы шаблон мог показать шильдик и stats
  ahaResult.value = result
}

// Prep Day список для Batch режима
const batchPrepPlan = computed(() => {
  if (!isBatchMode.value) return []
  const plan = []
  const seen = new Set()
  ahaWeek.value.forEach((day, di) => {
    day.meals.forEach(m => {
      if (!seen.has(m.dish?.id)) {
        seen.add(m.dish?.id)
        const days = ahaWeek.value.filter(d => d.meals.some(mm => mm.dish?.id === m.dish?.id)).map(d => d.day.slice(0,2))
        plan.push({ dish: m.dish, usedIn: days.join(', '), portions: days.length })
      }
    })
  })
  return plan.slice(0, 6)
})

// Средние макро за день
const avgMacros = computed(() => {
  if (!ahaWeek.value.length) return { kcal: 0, ...macros.value }
  const totalKcal = ahaWeek.value.reduce((s, d) => s + d.dayKcal, 0)
  return {
    kcal: Math.round(totalKcal / 7),
    protein: macros.value.protein,
    fat: macros.value.fat,
    carbs: macros.value.carbs,
  }
})

// Список покупок для aha — агрегация из недельного меню
const ahaShopItems = computed(() => {
  const map = {}
  ahaWeek.value.forEach(day => {
    day.meals.forEach(m => {
      ;(m.dish?.ingredients || m.dish?.ings || []).forEach(ing => {
        const name = ing.name || ing.n
        if (!name) return
        if (!map[name]) map[name] = { name, qty: ing.amount || '', unit: ing.unit || '', count: 0 }
        map[name].count++
      })
    })
  })
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

// ════════════════════════════════════════
// СОХРАНЕНИЕ ПРЕДПОЧТЕНИЙ В STORE
// ════════════════════════════════════════
function savePreferencesToStore() {
  const prefs = {
    // семья
    familySize: famCount.value,
    familyTags: { ...familyTags },
    // физиология
    gender: gender.value,
    age: age.value,
    weight: weight.value,
    height: height.value,
    goalWeight: goalWeight.value,
    // цель
    goal: goal.value,
    activityLevel: activityLevel.value,
    cookFreq: cookFreq.value,
    cookTime: cookTime.value,
    budget: budget.value,
    // предпочтения
    restrictions: { ...restrictionTags },
    cuisines: { ...cuisineTags },
    dislikedProducts: dislikedProducts.value,
    // свайп-история
    likedDishIds: likedIds.value,
    dislikedDishIds: dislikedIds.value,
    // рассчитанные цели
    targetKcal: targetKcal.value,
    targetProtein: macros.value.protein,
    targetFat: macros.value.fat,
    targetCarbs: macros.value.carbs,
    isBatchMode: isBatchMode.value,
  }
  track(EVENT.ONBOARDING_FAMILY_SET, {
    familySize: famCount.value,
    familyTags: { ...familyTags },
  })
  track(EVENT.ONBOARDING_PROFILE_SET, {
    gender: gender.value, age: age.value,
    weight: weight.value, height: height.value,
    bmi: bmi.value, targetKcal: targetKcal.value,
    targetProtein: macros.value.protein,
    targetFat: macros.value.fat,
    targetCarbs: macros.value.carbs,
  })
  track(EVENT.ONBOARDING_GOAL_SET, {
    goal: goal.value, activityLevel: activityLevel.value,
    cookFreq: cookFreq.value, cookTime: cookTime.value,
    budget: budget.value, isBatchMode: isBatchMode.value,
  })
  track(EVENT.ONBOARDING_DIET_SET, {
    restrictions: { ...restrictionTags },
    cuisines: { ...cuisineTags },
    dislikedProducts: dislikedProducts.value,
  })

  authStore.savePreferences(prefs)
}

// ════════════════════════════════════════
// БЕСШОВНЫЙ ПЕРЕХОД В МЕНЮ
// ════════════════════════════════════════
// ════════════════════════════════════════
// БЕСШОВНЫЙ ПЕРЕХОД В МЕНЮ И АВТОРИЗАЦИЯ
// ════════════════════════════════════════
async function goToMenuSeamlessly() {
  track(EVENT.ONBOARDING_COMPLETED, {
    durationSec: Math.round((Date.now() - onboardingStartTs) / 1000),
    swipesLiked: swipeHist.value.filter(h => h.liked).length,
    swipesDisliked: swipeHist.value.filter(h => !h.liked).length,
    hadAccount: isLoggedIn.value,
  })
  window.ym?.(window.__YM_ID__, 'userParams', {
  familySize,
  dietTags: dietTags.join(','),
  hasAllergens: allergenTags.length > 0,
  })

  // FIX-AUTH-05: ВАЖНО про savePreferencesToStore() здесь.
  // Если пользователь УЖЕ залогинен (зашёл в онбординг повторно или через
  // Уже-есть-аккаунт), мы НЕ перезаписываем его серверные настройки
  // случайно прокликанным онбордингом. Раньше это приводило к тому, что
  // в режиме инкогнито у уже зарегистрированного пользователя сбивались
  // ВСЕ его настройки (familySize, диета, кухни и т. п.).
  if (!isLoggedIn.value) {
    savePreferencesToStore()
  }

  // Передаём сгенерированное меню в menuStore (только для анонимных юзеров —
  // у залогиненных меню придёт с сервера в MenuView.fetchWeekMenu)
  if (!isLoggedIn.value && ahaResult.value && menuStore.applyOnboardingMenu) {
    menuStore.applyOnboardingMenu(ahaResult.value)
  }

  if (isLoggedIn.value) {
    await router.push('/menu')
  } else {
    openSheet('reg-sheet')
  }
}

// ── СОСТОЯНИЕ ФОРМЫ АВТОРИЗАЦИИ ──
const authMode = ref('register') // 'register' или 'login'
const authName = ref('')
const authEmail = ref('')
const authPassword = ref('')
const authLoading = ref(false)

function toggleAuthMode() {
  authMode.value = authMode.value === 'register' ? 'login' : 'register'
}

async function handleAuth() {
  if (!authEmail.value || !authPassword.value) {
    showToast('Введите email и пароль')
    return
  }

  authLoading.value = true
  try {
    if (authMode.value === 'register') {
      await authStore.register(authEmail.value, authPassword.value, authName.value || 'Пользователь')

      // FIX-AUTH-01: только при РЕГИСТРАЦИИ переносим выбранные в онбординге
      // настройки в новый аккаунт. У нового аккаунта на сервере ещё нет
      // предпочтений, поэтому это безопасно.
      savePreferencesToStore()

      track(EVENT.AUTH_SUBMIT, { mode: 'register', method: 'email' })
    } else {
      await authStore.login(authEmail.value, authPassword.value)

      // FIX-AUTH-02: при ВХОДЕ в существующий аккаунт НИЧЕГО не сохраняем
      // из онбординга. У пользователя уже есть свои настройки на сервере,
      // и они подгружены в authStore через setAuth() автоматически.
      // Раньше здесь вызывался savePreferencesToStore(), который перезаписывал
      // прежние настройки пользователя случайно выбранными в инкогнито-сессии.

      track(EVENT.AUTH_SUBMIT, { mode: 'login', method: 'email' })
    }

    // После успешной авторизации закрываем шторку
    closeSheet('reg-sheet')

    // И теперь роутер нас пустит
    await router.push('/menu')
  } catch (err) {
    showToast(err.message || 'Ошибка авторизации')
  } finally {
    authLoading.value = false
  }
}

// FIX-AUTH-03: вход с приветственного экрана — без прохождения онбординга.
// Открываем тот же бот-шит, но в режиме «login» (не «register»).
// Это ключевой UX для пользователей в режиме инкогнито или с нового устройства:
// им не нужно проходить весь онбординг, чтобы добраться до формы входа.
function openLoginFromWelcome() {
  authMode.value = 'login'
  track(EVENT.AUTH_SUBMIT, { source: 'welcome', mode: 'login_started' })
  openSheet('reg-sheet')
}

// ════════════════════════════════════════
// SHEETS
// ════════════════════════════════════════
const openSheetId = ref(null)

function openSheet(id) {
  openSheetId.value = id
  document.body.style.overflow = 'hidden'
}
function closeSheet(id) {
  const el = document.getElementById(id)
  if (!el) { openSheetId.value = null; document.body.style.overflow = ''; return }
  const sheet = el.querySelector('.sheet')
  if (sheet) {
    sheet.style.transition = 'transform .3s var(--ease-out)'
    sheet.style.transform = 'translateY(100%)'
    setTimeout(() => {
      openSheetId.value = null
      sheet.style.transform = ''
      sheet.style.transition = ''
      document.body.style.overflow = ''
    }, 310)
  } else {
    openSheetId.value = null
    document.body.style.overflow = ''
  }
}
function onBackdropClick(e, id) {
  if (e.target.classList.contains('sheet-backdrop')) closeSheet(id)
}
watch(openSheetId, async (id) => {
  if (!id) return
  await nextTick()
  const el = document.getElementById(id)
  if (el) initSheetDrag(el)
})
function initSheetDrag(backdropEl) {
  if (!backdropEl || backdropEl.dataset.dragInit) return
  backdropEl.dataset.dragInit = '1'
  const sheet = backdropEl.querySelector('.sheet')
  const handle = backdropEl.querySelector('.sheet-handle')
  const sheetId = backdropEl.id
  let ty = 0, startY = 0, isDrag = false
  const dS = (e) => { isDrag = true; startY = e.touches[0].clientY; ty = 0; sheet.style.transition = 'none' }
  const dM = (e) => { if (!isDrag) return; ty = Math.max(0, e.touches[0].clientY - startY); sheet.style.transform = 'translateY(' + ty + 'px)'; if (e.cancelable) e.preventDefault() }
  const dE = () => { if (!isDrag) return; isDrag = false; sheet.style.transition = 'transform .3s var(--ease-out)'; if (ty > 100) closeSheet(sheetId); else sheet.style.transform = 'translateY(0)'; ty = 0 }
  if (handle) { handle.addEventListener('touchstart', dS, { passive: true }); handle.addEventListener('touchmove', dM, { passive: false }); handle.addEventListener('touchend', dE) }
}

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════
const toastMsg  = ref('')
const toastShow = ref(false)
let toastTimer  = null
function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastShow.value = false }, 2800)
}

// ════════════════════════════════════════
// LIFECYCLE
// ════════════════════════════════════════
function _onKeydown(e) {
  if (e.key === 'Escape' && openSheetId.value) closeSheet(openSheetId.value)
}
onMounted(() => {
  document.addEventListener('keydown', _onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', _onKeydown)
})
</script>

<template>
<div class="menuday-app">
  <a class="skip-link" href="#main-content">Перейти к основному содержанию</a>

  <!-- TOPBAR -->
  <nav class="topbar" :class="{ visible: topbarVisible }">
    <div class="logo-wrap">
      <div class="logo-mark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="white" stroke="none"/>
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="logo-text">Время Есть</span>
    </div>
    <button class="topbar-action" @click="skipToResults">Пропустить →</button>
  </nav>

  <!-- PROGRESS BAR -->
  <div class="prog-wrap" :class="{ visible: progVisible && !isSwipeScreen }">
    <div class="prog-steps" aria-hidden="true">
      <span v-for="n in STEP_TOTAL" :key="n"
            class="prog-dot" :class="{ done: progStep >= n, active: progStep === n }"></span>
    </div>
    <div class="prog-track">
      <div class="prog-fill" :style="{ width: progWidth }"></div>
    </div>
    <div class="prog-labels">
      <span class="prog-step-label">Шаг {{ progStep }} из {{ STEP_TOTAL }}</span>
      <span class="prog-step-name">{{ progLabel }}</span>
    </div>
  </div>

  <main class="screens" id="onboarding-screens">

    <!-- ══════════════════════════════════
         WELCOME
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-welcome' }" id="s-welcome">
      <div class="screen-scroll">
        <div class="welcome-hero">
          <div class="hero-blob hb1" aria-hidden="true"></div>
          <div class="hero-blob hb2" aria-hidden="true"></div>
          <div class="hero-badge">
            <span class="badge-pill">✦ Бесплатно · Без регистрации</span>
          </div>
          <div class="hero-grid" aria-hidden="true">
            <div class="hero-tile">🥣</div><div class="hero-tile">🍝</div>
            <div class="hero-tile">🍜</div><div class="hero-tile">🥗</div>
            <div class="hero-tile">🍲</div><div class="hero-tile">🥘</div>
            <div class="hero-tile">🫕</div><div class="hero-tile">🐟</div>
          </div>
        </div>
        <div class="welcome-content">
          <h1 class="welcome-title">Меню на неделю —<br><em>за минуту</em></h1>
          <p class="welcome-desc">Подберём блюда под твою семью и цель, посчитаем КБЖУ, соберём список покупок. Ты просто отвечаешь на пару вопросов — мы делаем остальное.</p>
          <div class="value-list">
            <div class="value-item">
              <span class="value-icon" aria-hidden="true">🎯</span>
              <span class="value-text">КБЖУ под твою цель</span>
            </div>
            <div class="value-item">
              <span class="value-icon" aria-hidden="true">📦</span>
              <span class="value-text">Готовишь раз — ешь всю неделю</span>
            </div>
            <div class="value-item">
              <span class="value-icon" aria-hidden="true">🛒</span>
              <span class="value-text">Список покупок с ценами в доставках</span>
            </div>
          </div>
          <button class="btn-cta" @click="startOnboarding">
            Начать — это займёт 2 минуты
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="btn-secondary-link" @click="openLoginFromWelcome">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Уже есть аккаунт? <strong>Войти</strong>
          </button>
          <p class="welcome-fine">Регистрация нужна, только чтобы сохранить меню</p>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         ШАГ 1 — СЕМЬЯ
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-family' }" id="s-family">
      <div class="step-body">
        <div class="step-pad">
          <header class="step-head">
            <div class="step-eyebrow">Шаг 1 из {{ STEP_TOTAL }}</div>
            <h2 class="step-title">Кто за столом?</h2>
            <p class="step-hint">Подскажи, на скольких человек готовим — рассчитаем порции под твою семью</p>
          </header>

          <div class="fam-card">
            <div class="fam-avatars" aria-label="Члены семьи">
              <div v-for="(a, i) in famAvatars" :key="i" class="fam-av" :style="{ background: a.bg }">{{ a.em }}</div>
            </div>
            <div class="fam-stat">
              <div class="fam-num">{{ famCount }}</div>
              <div class="fam-num-label">{{ famLabel }}</div>
            </div>
            <div class="slider-label">
              <span>Двигай ползунок</span>
              <span class="slider-label-val">{{ famCount }} чел.</span>
            </div>
            <label for="fam-slider" class="sr-only">Количество человек в семье</label>
            <input type="range" id="fam-slider" min="1" max="6" :value="famCount" step="1"
                   @input="onFamInput"
                   :style="{ background: `linear-gradient(to right, var(--g) ${sliderPct}%, var(--surf2) ${sliderPct}%)` }">
            <div class="slider-ticks" aria-hidden="true">
              <span v-for="n in 6" :key="n" class="slider-tick">{{ n }}</span>
            </div>
          </div>

          <div class="tags-group">
            <span class="tags-group-label">Кто-то ещё? (можно пропустить)</span>
            <div class="tags-wrap">
              <button class="tag" :class="{ active: familyTags.kids_small }" @click="toggleFamTag('kids_small')">
                <span class="tag-ico">👶</span>Малыши до 7 лет
              </button>
              <button class="tag" :class="{ active: familyTags.kids }" @click="toggleFamTag('kids')">
                <span class="tag-ico">👧</span>Дети 7–12 лет
              </button>
              <button class="tag" :class="{ active: familyTags.teens }" @click="toggleFamTag('teens')">
                <span class="tag-ico">🧑</span>Подростки
              </button>
              <button class="tag" :class="{ active: familyTags.elderly }" @click="toggleFamTag('elderly')">
                <span class="tag-ico">👴</span>Старшее поколение
              </button>
            </div>
          </div>

          <!-- Подсказка про детей -->
          <div v-if="familyTags.kids_small" class="info-card info-amber">
            <span class="info-icon">💡</span>
            <span>Для малышей подберём блюда без острых специй и с мягкой текстурой</span>
          </div>
        </div>
      </div>
      <footer class="step-foot">
        <button class="btn-primary" @click="goStep('s-profile')">
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </footer>
    </section>

    <!-- ══════════════════════════════════
         ШАГ 2 — ПРОФИЛЬ (КБЖУ)
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-profile' }" id="s-profile">
      <div class="step-body">
        <div class="step-pad">
          <header class="step-head">
            <div class="step-eyebrow">Шаг 2 из {{ STEP_TOTAL }}</div>
            <h2 class="step-title">Расскажи о себе</h2>
            <p class="step-hint">Это нужно, чтобы посчитать твою норму калорий — без догадок и универсальных таблиц</p>
          </header>

          <!-- Пол -->
          <div class="tags-group">
            <span class="tags-group-label">Пол</span>
            <div class="gender-row">
              <button class="gender-btn" :class="{ active: gender==='female' }" @click="gender='female'">
                <span class="gender-ico">👩</span>
                <span>Женщина</span>
              </button>
              <button class="gender-btn" :class="{ active: gender==='male' }" @click="gender='male'">
                <span class="gender-ico">👨</span>
                <span>Мужчина</span>
              </button>
            </div>
          </div>

          <!-- Возраст -->
          <div class="tags-group">
            <div class="slider-row-head">
              <span class="tags-group-label" style="margin-bottom:0">Возраст</span>
              <span class="slider-val-badge">{{ age }} лет</span>
            </div>
            <input type="range" min="16" max="75" :value="age" step="1"
                   @input="age = +$event.target.value"
                   :style="{ background: `linear-gradient(to right, var(--g) ${((age-16)/59)*100}%, var(--surf2) ${((age-16)/59)*100}%)` }">
            <div class="slider-minmax"><span>16</span><span>75</span></div>
          </div>

          <!-- Вес -->
          <div class="tags-group">
            <div class="slider-row-head">
              <span class="tags-group-label" style="margin-bottom:0">Текущий вес</span>
              <span class="slider-val-badge">{{ weight }} кг</span>
            </div>
            <input type="range" min="40" max="150" :value="weight" step="1"
                   @input="weight = +$event.target.value"
                   :style="{ background: `linear-gradient(to right, var(--g) ${((weight-40)/110)*100}%, var(--surf2) ${((weight-40)/110)*100}%)` }">
            <div class="slider-minmax"><span>40 кг</span><span>150 кг</span></div>
          </div>

          <!-- Рост -->
          <div class="tags-group">
            <div class="slider-row-head">
              <span class="tags-group-label" style="margin-bottom:0">Рост</span>
              <span class="slider-val-badge">{{ height }} см</span>
            </div>
            <input type="range" min="140" max="210" :value="height" step="1"
                   @input="height = +$event.target.value"
                   :style="{ background: `linear-gradient(to right, var(--g) ${((height-140)/70)*100}%, var(--surf2) ${((height-140)/70)*100}%)` }">
            <div class="slider-minmax"><span>140 см</span><span>210 см</span></div>
          </div>

          <!-- BMR-карточка — расчёт в реальном времени -->
          <div class="bmr-card">
            <div class="bmr-row">
              <div class="bmr-item">
                <div class="bmr-val">{{ bmr.toLocaleString('ru') }}</div>
                <div class="bmr-label">Базовый<br>обмен (BMR)</div>
              </div>
              <div class="bmr-arrow">→</div>
              <div class="bmr-item bmr-main">
                <div class="bmr-val green">{{ tdee.toLocaleString('ru') }}</div>
                <div class="bmr-label">Норма<br>калорий (TDEE)</div>
              </div>
              <div class="bmr-divider"></div>
              <div class="bmr-item">
                <div class="bmr-val" :class="{ 'bmi-ok': parseFloat(bmi) < 25, 'bmi-warn': parseFloat(bmi) >= 25 }">{{ bmi }}</div>
                <div class="bmr-label">ИМТ<br><span class="bmi-status">{{ bmiLabel }}</span></div>
              </div>
            </div>
            <div class="bmr-note">На следующем шаге уточним норму с учётом активности</div>
          </div>
        </div>
      </div>
      <footer class="step-foot">
        <button class="btn-primary" @click="goStep('s-goal')">
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="btn-ghost" @click="goStep('s-family')">← Назад</button>
      </footer>
    </section>

    <!-- ══════════════════════════════════
         ШАГ 3 — ЦЕЛЬ И РИТМ
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-goal' }" id="s-goal">
      <div class="step-body">
        <div class="step-pad">
          <header class="step-head">
            <div class="step-eyebrow">Шаг 3 из {{ STEP_TOTAL }}</div>
            <h2 class="step-title">К чему стремишься?</h2>
            <p class="step-hint">Подстроим калорийность и состав меню под твою цель и образ жизни</p>
          </header>

          <!-- Цель -->
          <div class="tags-group">
            <span class="tags-group-label">Главная цель</span>
            <div class="goal-grid">
              <div v-for="g in GOALS" :key="g.key"
                   class="goal-opt" :class="{ active: goal===g.key }"
                   @click="goal=g.key">
                <div class="goal-icon">{{ g.icon }}</div>
                <div class="goal-title">{{ g.title }}</div>
                <div class="goal-sub">{{ g.sub }}</div>
              </div>
            </div>
          </div>

          <!-- КБЖУ результат для выбранной цели -->
          <div class="kcal-result">
            <div class="kcal-main">
              <span class="kcal-num">{{ targetKcal.toLocaleString('ru') }}</span>
              <span class="kcal-unit">ккал/день</span>
            </div>
            <div class="kcal-macros">
              <div class="kcal-macro-item"><span class="macro-num">{{ macros.protein }}г</span><span class="macro-name">Белки</span></div>
              <div class="kcal-macro-sep">·</div>
              <div class="kcal-macro-item"><span class="macro-num">{{ macros.fat }}г</span><span class="macro-name">Жиры</span></div>
              <div class="kcal-macro-sep">·</div>
              <div class="kcal-macro-item"><span class="macro-num">{{ macros.carbs }}г</span><span class="macro-name">Углеводы</span></div>
            </div>
          </div>

          <!-- Активность -->
          <div class="tags-group">
            <span class="tags-group-label">Уровень активности</span>
            <div class="activity-list">
              <div v-for="a in ACTIVITIES" :key="a.key"
                   class="activity-opt" :class="{ active: activityLevel===a.key }"
                   @click="activityLevel=a.key">
                <span class="activity-icon">{{ a.icon }}</span>
                <div class="activity-info">
                  <div class="activity-label">{{ a.label }}</div>
                  <div class="activity-sub">{{ a.sub }}</div>
                </div>
                <span class="activity-coeff">×{{ a.coeff }}</span>
              </div>
            </div>
          </div>

          <!-- Частота готовки -->
          <div class="tags-group">
            <span class="tags-group-label">Как часто становишься у плиты?</span>
            <div class="freq-grid">
              <div v-for="f in COOK_FREQS" :key="f.key"
                   class="freq-opt" :class="{ active: cookFreq===f.key, batch: f.batch }"
                   @click="cookFreq=f.key">
                <div class="freq-ico">{{ f.icon }}</div>
                <div class="freq-name">{{ f.title }}</div>
                <div class="freq-sub">{{ f.sub }}</div>
                <div v-if="f.batch" class="freq-badge">♻️ Batch</div>
              </div>
            </div>
          </div>

          <!-- Batch mode banner -->
          <div v-if="isBatchMode" class="info-card info-green">
            <span class="info-icon">📦</span>
            <span><strong>Готовим раз — едим всю неделю.</strong> В меню будут блюда с плашкой «Разогреть» — приготовишь в воскресенье, и до пятницы только разогревать. Соберём план на день готовки.</span>
          </div>

          <!-- Время готовки -->
          <div class="tags-group">
            <span class="tags-group-label">Сколько времени готова уделять готовке в день?</span>
            <div class="cooktime-row">
              <div v-for="t in COOK_TIMES" :key="t.val"
                   class="cooktime-opt" :class="{ active: cookTime===t.val }"
                   @click="cookTime=t.val">
                <div class="cooktime-label">{{ t.label }}</div>
                <div class="cooktime-sub">{{ t.sub }}</div>
              </div>
            </div>
          </div>

          <!-- Бюджет -->
          <div class="tags-group">
            <span class="tags-group-label">Сколько закладываешь на продукты в неделю?</span>
            <div class="budget-row">
              <div class="budget-opt" :class="{ active: budget==='low' }" @click="budget='low'">
                <div class="budget-ico">🪙</div>
                <div class="budget-name">до 3 000 ₽</div>
                <div class="budget-sub">Эконом</div>
              </div>
              <div class="budget-opt" :class="{ active: budget==='mid' }" @click="budget='mid'">
                <div class="budget-ico">💳</div>
                <div class="budget-name">3–6 000 ₽</div>
                <div class="budget-sub">Средний</div>
              </div>
              <div class="budget-opt" :class="{ active: budget==='high' }" @click="budget='high'">
                <div class="budget-ico">✨</div>
                <div class="budget-name">без лимита</div>
                <div class="budget-sub">Премиум</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer class="step-foot">
        <button class="btn-primary" @click="goStep('s-prefs')">
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="btn-ghost" @click="goStep('s-profile')">← Назад</button>
      </footer>
    </section>

    <!-- ══════════════════════════════════
         ШАГ 4 — ПРЕДПОЧТЕНИЯ
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-prefs' }" id="s-prefs">
      <div class="step-body">
        <div class="step-pad">
          <header class="step-head">
            <div class="step-eyebrow">Шаг 4 из {{ STEP_TOTAL }}</div>
            <h2 class="step-title">Что любишь и не любишь?</h2>
            <p class="step-hint">Учтём всё — от аллергии до нелюбви к кинзе. Никаких сюрпризов в тарелке</p>
          </header>

          <!-- Ограничения -->
          <div class="tags-group">
            <span class="tags-group-label">Чего избегаешь? (аллергии и диеты)</span>
            <div class="tags-wrap">
              <button v-for="r in RESTRICTIONS" :key="r.key"
                      class="tag" :class="{ active: restrictionTags[r.key] }"
                      @click="toggleRestriction(r.key)">
                <span class="tag-ico">{{ r.icon }}</span>{{ r.label }}
              </button>
            </div>
          </div>

          <!-- Любимые кухни -->
          <div class="tags-group">
            <span class="tags-group-label">Что готовишь чаще всего? (можно несколько)</span>
            <div class="tags-wrap">
              <button v-for="c in CUISINES" :key="c.key"
                      class="tag" :class="{ active: cuisineTags[c.key] }"
                      @click="toggleCuisine(c.key)">
                <span class="tag-ico">{{ c.icon }}</span>{{ c.label }}
              </button>
            </div>
          </div>

          <!-- Нелюбимые продукты -->
          <div class="tags-group">
            <span class="tags-group-label">Что точно не подойдёт? (можно пропустить)</span>
            <div class="dislike-input-wrap">
              <textarea class="dislike-input" v-model="dislikedProducts"
                        placeholder="Например: кинза, баклажан, ливер, рыба в кляре…"
                        rows="2"></textarea>
            </div>
            <p class="field-hint">Перечисли через запятую — постараемся обходить эти продукты в рецептах</p>
          </div>

        </div>
      </div>
      <footer class="step-foot">
        <button class="btn-primary" @click="goStep('s-swipe')">
          Дальше — выбираем блюда
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="btn-ghost" @click="goStep('s-goal')">← Назад</button>
      </footer>
    </section>

    <!-- ══════════════════════════════════
         ШАГ 5 — СВАЙП
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-swipe' }" id="s-swipe">
      <div class="swipe-head">
        <div class="swipe-dots">
          <div v-for="(_, i) in DISHES" :key="i" class="s-dot"
               :class="{ done: i < swipeIdx, now: i === swipeIdx }"></div>
        </div>
        <div class="swipe-eyebrow">Карточка {{ swipeIdx + 1 }} из {{ DISHES.length }}</div>
        <h2 class="swipe-title">Что <em>заходит</em> вам с семьёй?</h2>
        <p class="swipe-hint-sub">Свайп вправо — нравится, влево — мимо</p>
      </div>

      <div class="swipe-area" role="region" aria-label="Выбор блюд">
        <div class="card-stack">
          <div v-for="c in swipeCards.slice().reverse()" :key="c.key"
               class="dish-card" :class="c.cls">
            <div class="vote-ov like"><div class="vote-stamp like">❤ Нравится</div></div>
            <div class="vote-ov nope"><div class="vote-stamp nope">✕ Мимо</div></div>
            <div class="card-img" :style="{ background: c.dish.bg }">
              <div class="card-img-bg">{{ c.dish.emoji }}</div>
              <div class="card-img-fg">{{ c.dish.emoji }}</div>
            </div>
            <div class="card-body">
              <div class="card-name">{{ c.dish.name }}</div>
              <div class="card-desc">{{ c.dish.desc }}</div>
              <div class="card-meta">
                <div class="card-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {{ c.dish.time }}
                </div>
                <div class="card-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>
                  {{ c.dish.kcal }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="swipe-hint">← Мимо &nbsp;·&nbsp; Нравится →</p>
      <div class="swipe-btns">
        <button class="sw-btn sw-undo" @click="undoSwipe" title="Отмена">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C7A68" stroke-width="2.2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg>
        </button>
        <button class="sw-btn sw-nope" @click="doVote(false)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C94040" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <button class="sw-btn sw-like" @click="doVote(true)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
        <span aria-hidden="true" class="sw-spacer"></span>
      </div>
    </section>

    <!-- ══════════════════════════════════
         ШАГ 6 — AHA-MOMENT
         ══════════════════════════════════ -->
    <section class="screen" :class="{ active: curScreen==='s-aha' }" id="s-aha">

      <!-- Шапка -->
      <div class="aha-header">
        <div class="aha-header-left">
          <div class="aha-greeting">Готово! Вот твоё меню 🎉</div>
          <div class="aha-sub">Подобрали с учётом твоей семьи · {{ famCount }} чел. · {{ targetKcal.toLocaleString('ru') }} ккал/день</div>
        </div>
        <button class="aha-save-btn" @click="goToMenuSeamlessly">
          {{ isLoggedIn ? 'В приложение →' : 'Сохранить →' }}
        </button>
      </div>

      <!-- КБЖУ полоска -->
      <div class="aha-macros">
        <div class="aha-macro-box">
          <div class="aha-macro-val">{{ targetKcal.toLocaleString('ru') }}</div>
          <div class="aha-macro-lbl">Ккал</div>
        </div>
        <div class="aha-macro-box green">
          <div class="aha-macro-val">{{ macros.protein }}г</div>
          <div class="aha-macro-lbl">Белки</div>
        </div>
        <div class="aha-macro-box">
          <div class="aha-macro-val">{{ macros.fat }}г</div>
          <div class="aha-macro-lbl">Жиры</div>
        </div>
        <div class="aha-macro-box">
          <div class="aha-macro-val">{{ macros.carbs }}г</div>
          <div class="aha-macro-lbl">Углев.</div>
        </div>
      </div>

      <!-- Batch plan баннер -->
      <div v-if="isBatchMode" class="batch-banner">
        <div class="batch-banner-head">
          <span class="batch-banner-icon">📦</span>
          <span class="batch-banner-title">План готовки на воскресенье</span>
        </div>
        <div class="batch-banner-items">
          <div v-for="(item, i) in batchPrepPlan.slice(0,4)" :key="i" class="batch-item">
            <span class="batch-item-ico">{{ item.dish?.emoji }}</span>
            <div class="batch-item-info">
              <div class="batch-item-name">{{ item.dish?.name }}</div>
              <div class="batch-item-meta">{{ item.portions }} порции · {{ item.usedIn }}</div>
            </div>
          </div>
        </div>
        <div class="batch-note">Готовишь один раз — ешь всю неделю. Блюда с плашкой 🔁 нужно только разогреть.</div>
      </div>

      <!-- Табы -->
      <div class="aha-tabs">
        <button class="aha-tab" :class="{ active: activeTab==='menu' }" @click="activeTab='menu'">
          🗓 Меню
        </button>
        <button class="aha-tab" :class="{ active: activeTab==='shop' }" @click="activeTab='shop'">
          🛒 Покупки
        </button>
        <button class="aha-tab" :class="{ active: activeTab==='price' }" @click="activeTab='price'">
          💰 Цены
        </button>
      </div>

      <!-- TAB: МЕНЮ — структура совпадает с MenuView (.day-card / .meal-section / .meal-item) -->
      <div class="aha-tab-panel" :class="{ active: activeTab==='menu' }">
        <div class="week-list">
          <div v-for="(dayData, di) in ahaWeek" :key="di" class="day-card">

            <div class="day-head">
              <div class="day-head-left">
                <span class="day-weekday">{{ dayData.day }}</span>
              </div>
              <div class="day-kcal-wrap">
                <div v-if="dayData.dayKcal > 0" class="day-kcal-val">
                  {{ dayData.dayKcal.toLocaleString('ru') }}
                  <span class="day-kcal-of">/ {{ targetKcal.toLocaleString('ru') }} ккал</span>
                </div>
              </div>
            </div>

            <div class="meals-wrap">
              <div v-for="(m, mi) in dayData.meals" :key="mi" class="meal-section">
                <div class="meal-type-label" :style="{ color: TYPE_FG[m.t] }">
                  <span class="mtl-icon">{{ MEAL_TYPE_ICONS[m.t] }}</span>
                  {{ m.t }}
                </div>
                <div class="meal-item">
                  <div class="meal-content">
                    <div class="meal-emoji" :style="{ background: m.dish?.bg || TYPE_BG[m.t] }">
                      {{ m.dish?.emoji || '🍽️' }}
                    </div>
                    <div class="meal-info">
                      <div class="meal-name">{{ m.dish?.name }}</div>
                      <div class="meal-meta">
                        <span v-if="m.dish?.time">{{ m.dish.time }}</span>
                        <span class="meta-sep" v-if="m.dish?.time && m.dish?.kcal">·</span>
                        <span class="meal-kcal" v-if="m.dish?.kcal">{{ m.dish.kcal }}</span>
                      </div>
                      <div v-if="m.prepType === 'reheat' || getBadges(m.dish, di, m.t).length" class="meal-badge-wrap">
                        <span v-if="m.prepType === 'reheat'" class="meal-badge"
                              style="background:var(--dinner-bg);color:var(--dinner-fg)">🔁 Разогреть</span>
                        <span v-else-if="m.prepType === 'assemble'" class="meal-badge"
                              style="background:var(--lunch-bg);color:var(--lunch-fg)">🫙 Собрать</span>
                        <span v-for="b in getBadges(m.dish, di, m.t)" :key="b.label"
                              class="meal-badge" :style="{ background: b.color, color: b.text }">{{ b.icon }} {{ b.label }}</span>
                      </div>
                    </div>
                    <svg class="meal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Подсказка про адаптацию меню -->
          <div v-if="ahaResult?.fallbackApplied" class="info-card info-amber">
            <span class="info-icon">💡</span>
            <span>
              Меню адаптировано: {{ ahaResult.fallbackApplied.label }} —
              чтобы вписаться в твои ограничения.
            </span>
          </div>
        </div>

        <!-- CTA внизу меню -->
        <div class="aha-bottom-cta">
          <button class="btn-primary" @click="goToMenuSeamlessly">
            {{ isLoggedIn ? '🎯 Открыть в приложении' : '💾 Сохранить меню' }}
          </button>
          <p class="aha-fine">Меню сохранится в приложении · КБЖУ под твою цель · Список покупок готов</p>
        </div>
      </div>

      <!-- TAB: ПОКУПКИ -->
      <div class="aha-tab-panel" :class="{ active: activeTab==='shop' }">
        <div v-if="ahaShopItems.length" class="shop-list">
          <div v-for="item in ahaShopItems" :key="item.name" class="shop-item-row">
            <span class="shop-item-name">{{ item.name }}</span>
            <span class="shop-item-qty">{{ item.qty }} {{ item.unit }}</span>
          </div>
        </div>
        <div v-else class="aha-empty">
          <div>🛒</div>
          <div>Список соберётся, как только меню будет готово</div>
        </div>
        <div class="aha-bottom-cta">
          <button class="btn-primary" @click="goToMenuSeamlessly">
            {{ isLoggedIn ? 'Открыть полный список →' : 'Сохранить и открыть →' }}
          </button>
        </div>
      </div>

      <!-- TAB: ЦЕНЫ -->
      <div class="aha-tab-panel" :class="{ active: activeTab==='price' }">
        <div class="price-card">
          <div class="pc-head">
            <div class="pc-head-t">Сколько выйдут продукты на неделю</div>
            <div class="pc-upd">обновили 2 ч назад</div>
          </div>
          <div class="pc-row">
            <div class="pc-store"><div class="pc-ico pc-samokat">С</div>Самокат</div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="pc-price pc-win">2 340 ₽</span>
              <span class="pc-badge">Дешевле</span>
            </div>
          </div>
          <div class="pc-row">
            <div class="pc-store"><div class="pc-ico pc-lavka">Я</div>Яндекс Лавка</div>
            <span class="pc-price pc-lose">2 688 ₽</span>
          </div>
          <div class="pc-row">
            <div class="pc-store"><div class="pc-ico pc-vv">В</div>ВкусВилл</div>
            <span class="pc-price pc-lose">2 790 ₽</span>
          </div>
          <div class="pc-row">
            <div class="pc-store"><div class="pc-ico pc-px">П</div>Перекрёсток</div>
            <span class="pc-price pc-lose">2 820 ₽</span>
          </div>
          <div class="pc-save">
            <span class="pc-save-l">Сэкономишь со «Время Есть»</span>
            <span class="pc-save-v">↓ 348 ₽ в неделю</span>
          </div>
        </div>
        <div class="aha-bottom-cta">
          <button class="btn-action">🟠 Заказать продукты в Самокате</button>
          <button class="btn-primary" @click="goToMenuSeamlessly">
            {{ isLoggedIn ? 'В приложение →' : 'Сохранить меню →' }}
          </button>
        </div>
      </div>

    </section>
  </main>

  <!-- ═══════ SHEET: РЕГИСТРАЦИЯ ═══════ -->
  <!-- ═══════ SHEET: РЕГИСТРАЦИЯ И ВХОД ═══════ -->
  <div class="sheet-backdrop" :class="{ open: openSheetId==='reg-sheet' }" id="reg-sheet"
      role="dialog" aria-modal="true" @click="onBackdropClick($event,'reg-sheet')">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-scroll">
        <div style="padding:8px 20px calc(20px + var(--sab))">
          <h2 class="reg-title">
            {{ authMode === 'register' ? 'Сохраним твоё меню?' : 'С возвращением!' }}
          </h2>
          <p class="reg-sub">
            {{ authMode === 'register' 
                ? 'Меню, КБЖУ и список покупок будут под рукой в любой момент' 
                : 'Войди, чтобы продолжить с того же места' }}
          </p>

          <button class="reg-btn reg-apple" @click="showToast('В разработке')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.38.77 3.2.73.97-.05 2.08-.86 3.73-.74 1.31.1 2.43.66 3.19 1.73-2.92 1.68-2.44 5.81.24 6.82-.54 1.48-1.18 2.87-2.36 4.32zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Войти через Apple ID
          </button>
          <button class="reg-btn reg-google" @click="showToast('В разработке')">
            <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Войти через Google
          </button>

          <div class="reg-divider"><span>или email</span></div>
          
          <label v-if="authMode === 'register'" for="reg-name" class="sr-only">Имя</label>
          <input v-if="authMode === 'register'" id="reg-name" v-model="authName" type="text" class="reg-email-inp" placeholder="Как тебя зовут? (можно пропустить)">

          <label for="reg-email" class="sr-only">Электронная почта</label>
          <input id="reg-email" v-model="authEmail" type="email" class="reg-email-inp" placeholder="Электронная почта" autocomplete="email" inputmode="email" required>
          
          <label for="reg-password" class="sr-only">Пароль</label>
          <!-- @keydown.enter позволяет отправлять форму по нажатию Enter -->
          <input id="reg-password" v-model="authPassword" type="password" class="reg-email-inp" placeholder="Пароль" required @keydown.enter="handleAuth">

          <button class="reg-submit" @click="handleAuth" :disabled="authLoading">
            {{ authLoading ? 'Подождите...' : (authMode === 'register' ? 'Создать аккаунт →' : 'Войти →') }}
          </button>
          
          <button class="reg-skip" style="margin-top: 10px;" @click="toggleAuthMode">
            {{ authMode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться' }}
          </button>
          <button class="reg-skip" style="margin-top: 0; opacity: 0.6;" @click="closeSheet('reg-sheet')">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- TOAST -->
  <div class="toast" :class="{ show: toastShow }" role="status">{{ toastMsg }}</div>
</div>
</template>

<style>
.menuday-app {
  display: flex;
  flex-direction: column;
  flex: 1; /* Заставляет блок занять всю высоту .page-container из App.vue */
  height: 100%;
  min-height: 100%;
  width: 100%;
  position: relative;
}
.menuday-app button{font-family:inherit;font-size:inherit;cursor:pointer}
.menuday-app input,.menuday-app textarea{font-family:inherit}
.menuday-app :focus-visible{outline:3px solid var(--g);outline-offset:2px;border-radius:4px}

.menuday-app .reg-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* ═══════ TOPBAR ═══════ */
.menuday-app .topbar{
  display:none;align-items:center;justify-content:space-between;
  padding:calc(10px + var(--sat)) 16px 8px;
  flex-shrink:0;background:var(--surf);border-bottom:1px solid var(--bdr);z-index:20;
  min-height:calc(44px + var(--sat));
}
.menuday-app .topbar.visible{display:flex}
.menuday-app .logo-wrap{display:flex;align-items:center;gap:9px}
.menuday-app .logo-mark{
  width:32px;height:32px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(140deg,var(--g),var(--gd));
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 2px 8px rgba(69,174,107,.35);
}
.menuday-app .logo-text{font-family:'Playfair Display',serif;font-size:1rem;font-weight:800;color:var(--t1)}
.menuday-app .topbar-action{
  height:var(--touch);min-width:var(--touch);padding:0 12px;
  display:flex;align-items:center;justify-content:center;
  border-radius:22px;background:var(--gp);border:1.5px solid var(--gpp);
  color:var(--gd);font-size:.8rem;font-weight:700;transition:background .15s;white-space:nowrap;
}
.menuday-app .topbar-action:hover{background:var(--gpp)}

/* ═══════ PROGRESS ═══════ */
.menuday-app .prog-wrap{display:none;padding:8px 16px 6px;background:var(--surf);border-bottom:1px solid var(--bdr);flex-shrink:0}
.menuday-app .prog-wrap.visible{display:block}
.menuday-app .prog-steps{display:flex;gap:4px;margin-bottom:7px}
.menuday-app .prog-dot{width:100%;height:4px;border-radius:4px;background:var(--surf2);transition:all .3s}
.menuday-app .prog-dot.done{background:var(--g)}
.menuday-app .prog-dot.active{background:var(--gl)}
.menuday-app .prog-track{height:3px;background:var(--surf2);border-radius:3px;overflow:hidden;margin-bottom:5px}
.menuday-app .prog-fill{height:100%;background:linear-gradient(90deg,var(--g),var(--gl));border-radius:3px;transition:width .45s var(--ease-out)}
.menuday-app .prog-labels{display:flex;justify-content:space-between;font-size:.7rem;font-weight:700;color:var(--t3)}
.menuday-app .prog-step-label{color:var(--gd)}
.menuday-app .prog-step-name{}

/* ═══════ SCREENS ═══════ */
.menuday-app .screens{flex:1;position:relative;overflow:hidden;height:100%}
.menuday-app .screen{
  position:absolute;inset:0;display:flex;flex-direction:column;height:100%;
  overflow:hidden;opacity:0;visibility:hidden;pointer-events:none;
  transform:translateX(32px);
  transition:opacity .28s,transform .28s,visibility .28s;z-index:1;
}
.menuday-app .screen.active{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(0);z-index:10}
.menuday-app .screen-scroll{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.menuday-app .screen-scroll::-webkit-scrollbar{display:none}

/* ═══════ WELCOME ═══════ */
.menuday-app #s-welcome{background:var(--surf);overflow-y:auto}
.menuday-app .welcome-hero{
  flex-shrink:0;padding-top:var(--sat);
  background:linear-gradient(155deg,#D2EFE0 0%,#E6F7ED 55%,var(--surf2) 100%);
  position:relative;overflow:hidden;
}
.menuday-app .hero-blob{position:absolute;border-radius:50%;background:rgba(69,174,107,.09);pointer-events:none}
.menuday-app .hb1{width:260px;height:260px;top:-70px;right:-50px}
.menuday-app .hb2{width:180px;height:180px;bottom:-60px;left:-40px}
.menuday-app .hero-badge{position:relative;z-index:1;text-align:center;padding-top:20px;margin-bottom:12px}
.menuday-app .badge-pill{
  display:inline-flex;align-items:center;gap:6px;
  font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--gd);background:rgba(255,255,255,.8);
  border:1.5px solid var(--gpp);border-radius:30px;padding:5px 14px;
}
.menuday-app .hero-grid{
  display:grid;grid-template-columns:repeat(4,1fr);gap:8px;
  padding:0 18px 22px;max-width:340px;margin:0 auto;position:relative;z-index:1;
}
.menuday-app .hero-tile{
  aspect-ratio:1;border-radius:16px;font-size:1.65rem;
  display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.9);
  box-shadow:0 2px 8px rgba(69,174,107,.1);
  animation:tile-float 4s ease-in-out infinite;
}
.menuday-app .hero-tile:nth-child(2){animation-delay:-.55s}
.menuday-app .hero-tile:nth-child(3){animation-delay:-1.1s}
.menuday-app .hero-tile:nth-child(4){animation-delay:-1.65s}
.menuday-app .hero-tile:nth-child(5){animation-delay:-2.2s}
.menuday-app .hero-tile:nth-child(6){animation-delay:-2.75s}
.menuday-app .hero-tile:nth-child(7){animation-delay:-.28s}
.menuday-app .hero-tile:nth-child(8){animation-delay:-.84s}
@keyframes tile-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.menuday-app .welcome-content{padding:22px 20px calc(24px + var(--sab))}
.menuday-app .welcome-title{font-family:'Playfair Display',serif;font-size:clamp(1.9rem,7vw,2.6rem);font-weight:900;color:var(--t1);line-height:1.12;margin-bottom:10px}
.menuday-app .welcome-title em{font-style:italic;color:var(--gd)}
.menuday-app .welcome-desc{font-size:1rem;color:var(--t2);line-height:1.65;margin-bottom:24px}
.menuday-app .value-list{display:flex;flex-direction:column;gap:9px;margin-bottom:26px}
.menuday-app .value-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--gp);border-radius:14px;border:1px solid var(--gpp)}
.menuday-app .value-icon{font-size:1.2rem;flex-shrink:0;line-height:1}
.menuday-app .value-text{font-size:.9rem;font-weight:500;color:var(--t2)}
.menuday-app .btn-cta{
  width:100%;height:56px;border-radius:18px;
  background:linear-gradient(140deg,#52BE7A,var(--gd));
  color:#fff;font-size:1rem;font-weight:700;border:none;
  display:flex;align-items:center;justify-content:center;gap:9px;
  box-shadow:0 6px 22px rgba(69,174,107,.4);transition:transform .2s,box-shadow .2s;
}
.menuday-app .btn-cta:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(69,174,107,.48)}
.menuday-app .btn-cta:active{transform:translateY(0)}
/* FIX-AUTH-04: «Уже есть аккаунт? Войти» — выделенная вторичная кнопка под CTA.
   Раньше была btn-secondary-link (текст-ссылка) — пользователи в инкогнито её
   не замечали и проходили онбординг с нуля поверх существующего аккаунта.
   Теперь полноценная bordered-кнопка по брендбуку (стр. 11): фон --gp,
   бордер 1.5px --gpp, текст --gd, высота 48px, радиус 14px. */
.menuday-app .btn-secondary-link{
  display:flex;align-items:center;justify-content:center;gap:6px;
  width:100%;margin-top:10px;
  height:48px;padding:0 16px;
  background:var(--gp);
  border:1.5px solid var(--gpp);
  border-radius:14px;
  font-family:inherit;
  font-size:.95rem;font-weight:600;color:var(--gd);
  cursor:pointer;
  transition:background .2s var(--ease-out, ease), transform .15s var(--ease-out, ease), border-color .2s var(--ease-out, ease);
}
.menuday-app .btn-secondary-link:hover{background:#DCEFE3;border-color:var(--g);transform:translateY(-1px)}
.menuday-app .btn-secondary-link:active{transform:translateY(0)}
.menuday-app .btn-secondary-link:focus-visible{outline:3px solid var(--g);outline-offset:2px}
.menuday-app .btn-secondary-link strong{color:var(--gd);font-weight:700;margin-left:2px}
.menuday-app .welcome-fine{text-align:center;font-size:.78rem;color:var(--t3);margin-top:14px}

/* ═══════ STEP ШАБЛОН ═══════ */
.menuday-app .step-body{flex:1;min-height:0;overflow-y:auto;padding:0 18px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.menuday-app .step-body::-webkit-scrollbar{display:none}
.menuday-app .step-pad{padding:20px 0 0}
.menuday-app .step-head{margin-bottom:20px}
.menuday-app .step-eyebrow{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--gd);margin-bottom:6px}
.menuday-app .step-title{font-family:'Playfair Display',serif;font-size:clamp(1.65rem,5.5vw,2.1rem);font-weight:800;color:var(--t1);line-height:1.2}
.menuday-app .step-hint{font-size:.9rem;color:var(--t2);margin-top:6px;line-height:1.5}

/* ═══════ GENERAL CONTROLS ═══════ */
.menuday-app .tags-group{margin-bottom:18px}
.menuday-app .tags-group-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--t3);margin-bottom:10px;display:block}
.menuday-app .tags-wrap{display:flex;flex-wrap:wrap;gap:8px}
.menuday-app .tag{
  display:inline-flex;align-items:center;gap:7px;
  height:var(--touch);padding:0 16px;border-radius:50px;
  border:1.5px solid var(--bdr2);background:var(--surf);color:var(--t2);
  font-size:.88rem;font-weight:600;user-select:none;transition:all .18s;
}
.menuday-app .tag:hover{border-color:var(--g);color:var(--gd);transform:translateY(-1px)}
.menuday-app .tag.active{background:var(--gp);color:var(--gd);border-color:var(--gpp);font-weight:700}
.menuday-app .tag-ico{font-size:.95rem}

.menuday-app input[type=range]{
  -webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:6px;
  background:var(--surf2);border:none;outline:none;cursor:pointer;display:block;
}
.menuday-app input[type=range]:focus-visible{outline:3px solid var(--g);outline-offset:4px;border-radius:8px}
.menuday-app input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;width:28px;height:28px;border-radius:50%;
  background:linear-gradient(140deg,var(--g),var(--gd));
  border:3px solid #fff;box-shadow:0 2px 10px rgba(69,174,107,.5);cursor:grab;transition:transform .15s;
}
.menuday-app input[type=range]::-webkit-slider-thumb:active{transform:scale(1.2);cursor:grabbing}
.menuday-app input[type=range]::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:linear-gradient(140deg,var(--g),var(--gd));border:3px solid #fff;cursor:grab}

.menuday-app .slider-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:.82rem;font-weight:600;color:var(--t3)}
.menuday-app .slider-label-val{color:var(--gd);font-weight:700}
.menuday-app .slider-ticks{display:flex;justify-content:space-between;margin-top:8px;padding:0 1px}
.menuday-app .slider-tick{font-size:.72rem;color:var(--t3);font-weight:600}
.menuday-app .slider-minmax{display:flex;justify-content:space-between;margin-top:6px;font-size:.72rem;color:var(--t3)}
.menuday-app .slider-row-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.menuday-app .slider-val-badge{
  font-size:.9rem;font-weight:800;color:var(--gd);
  background:var(--gp);border:1.5px solid var(--gpp);
  padding:2px 10px;border-radius:20px;
}

/* ═══════ INFO CARDS ═══════ */
.menuday-app .info-card{
  display:flex;align-items:flex-start;gap:10px;
  padding:12px 14px;border-radius:14px;margin-bottom:14px;
  font-size:.86rem;line-height:1.5;
}
.menuday-app .info-card.info-amber{background:var(--ambp);border:1px solid rgba(217,119,6,.2);color:var(--ambd)}
.menuday-app .info-card.info-green{background:var(--gp);border:1px solid var(--gpp);color:var(--gd)}
.menuday-app .info-icon{font-size:1rem;flex-shrink:0;margin-top:1px}

/* ═══════ FAMILY CARD ═══════ */
.menuday-app .fam-card{background:var(--surf);border-radius:22px;padding:20px 18px 16px;margin-bottom:16px;border:1.5px solid var(--bdr);box-shadow:var(--sh1)}
.menuday-app .fam-avatars{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;min-height:56px;align-items:center;margin-bottom:12px}
.menuday-app .fam-av{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;border:2px solid rgba(69,174,107,.18)}
.menuday-app .fam-stat{text-align:center;margin-bottom:16px}
.menuday-app .fam-num{font-family:'Playfair Display',serif;font-size:2.8rem;font-weight:900;color:var(--gd);line-height:1}
.menuday-app .fam-num-label{font-size:.84rem;color:var(--t2);margin-top:3px;font-weight:500}

/* ═══════ GENDER TOGGLE ═══════ */
.menuday-app .gender-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.menuday-app .gender-btn{
  height:60px;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  border:1.5px solid var(--bdr);background:var(--surf);color:var(--t2);font-size:.88rem;font-weight:700;transition:all .18s;
}
.menuday-app .gender-btn:hover{border-color:var(--g);transform:translateY(-1px)}
.menuday-app .gender-btn.active{background:var(--gp);border-color:var(--g);color:var(--gd)}
.menuday-app .gender-ico{font-size:1.4rem}

/* ═══════ BMR CARD ═══════ */
.menuday-app .bmr-card{
  background:linear-gradient(135deg,var(--gp),#D8F2E5);
  border:1.5px solid var(--gpp);border-radius:20px;padding:16px 18px;margin-bottom:16px;
}
.menuday-app .bmr-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.menuday-app .bmr-item{flex:1;text-align:center}
.menuday-app .bmr-main{flex:1.4}
.menuday-app .bmr-val{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;color:var(--t1);line-height:1}
.menuday-app .bmr-val.green{color:var(--gd);font-size:1.8rem}
.menuday-app .bmi-ok{color:var(--gd)}
.menuday-app .bmi-warn{color:var(--amb)}
.menuday-app .bmi-status{font-size:.62rem;color:var(--t3);font-weight:600;font-family:'DM Sans',sans-serif}
.menuday-app .bmr-label{font-size:.62rem;color:var(--t2);margin-top:3px;line-height:1.3;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.menuday-app .bmr-arrow{color:var(--gpp);font-size:1.2rem;flex-shrink:0}
.menuday-app .bmr-divider{width:1px;height:36px;background:var(--gpp);flex-shrink:0}
.menuday-app .bmr-note{font-size:.76rem;color:var(--t3);text-align:center}

/* ═══════ GOAL GRID ═══════ */
.menuday-app .goal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.menuday-app .goal-opt{
  border-radius:16px;padding:14px 10px;text-align:center;
  border:1.5px solid var(--bdr);background:var(--surf);transition:all .18s;
}
.menuday-app .goal-opt:hover{border-color:var(--g);transform:translateY(-2px)}
.menuday-app .goal-opt.active{border-color:var(--g);background:var(--gp)}
.menuday-app .goal-opt.active .goal-title{color:var(--gd)}
.menuday-app .goal-icon{font-size:1.5rem;margin-bottom:6px}
.menuday-app .goal-title{font-size:.82rem;font-weight:800;color:var(--t1);margin-bottom:3px}
.menuday-app .goal-sub{font-size:.63rem;color:var(--t3);line-height:1.3}

/* ═══════ KCAL RESULT ═══════ */
.menuday-app .kcal-result{
  background:linear-gradient(140deg,var(--gd),#0A5D32);
  border-radius:18px;padding:16px 18px;margin-bottom:16px;text-align:center;
}
.menuday-app .kcal-main{display:flex;align-items:baseline;justify-content:center;gap:6px;margin-bottom:8px}
.menuday-app .kcal-num{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:900;color:#fff}
.menuday-app .kcal-unit{font-size:.88rem;color:rgba(255,255,255,.7);font-weight:600}
.menuday-app .kcal-macros{display:flex;align-items:center;justify-content:center;gap:6px}
.menuday-app .kcal-macro-item{display:flex;flex-direction:column;align-items:center}
.menuday-app .macro-num{font-size:.95rem;font-weight:800;color:#fff}
.menuday-app .macro-name{font-size:.62rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.05em}
.menuday-app .kcal-macro-sep{color:rgba(255,255,255,.3);font-size:1.2rem}

/* ═══════ ACTIVITY LIST ═══════ */
.menuday-app .activity-list{display:flex;flex-direction:column;gap:7px;margin-bottom:6px}
.menuday-app .activity-opt{
  display:flex;align-items:center;gap:12px;padding:12px 14px;
  border-radius:14px;border:1.5px solid var(--bdr);background:var(--surf);transition:all .18s;
}
.menuday-app .activity-opt:hover{border-color:var(--g)}
.menuday-app .activity-opt.active{background:var(--gp);border-color:var(--gpp)}
.menuday-app .activity-opt.active .activity-label{color:var(--gd)}
.menuday-app .activity-icon{font-size:1.3rem;flex-shrink:0;width:28px;text-align:center}
.menuday-app .activity-info{flex:1}
.menuday-app .activity-label{font-size:.9rem;font-weight:700;color:var(--t1)}
.menuday-app .activity-sub{font-size:.76rem;color:var(--t3)}
.menuday-app .activity-coeff{font-size:.78rem;font-weight:800;color:var(--t3);flex-shrink:0}

/* ═══════ COOK FREQ GRID ═══════ */
.menuday-app .freq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.menuday-app .freq-opt{
  border-radius:16px;padding:14px 10px;text-align:center;
  border:1.5px solid var(--bdr);background:var(--surf);transition:all .18s;position:relative;
}
.menuday-app .freq-opt:hover{border-color:var(--g);transform:translateY(-2px)}
.menuday-app .freq-opt.active{border-color:var(--g);background:var(--gp)}
.menuday-app .freq-opt.active .freq-name{color:var(--gd)}
.menuday-app .freq-opt.batch.active{border-color:var(--amb);background:var(--ambp)}
.menuday-app .freq-opt.batch.active .freq-name{color:var(--amb)}
.menuday-app .freq-ico{font-size:1.5rem;margin-bottom:6px}
.menuday-app .freq-name{font-size:.8rem;font-weight:800;color:var(--t1);margin-bottom:2px}
.menuday-app .freq-sub{font-size:.63rem;color:var(--t3);line-height:1.3}
.menuday-app .freq-badge{font-size:.62rem;font-weight:700;color:var(--amb);margin-top:5px}

/* ═══════ COOKTIME ═══════ */
.menuday-app .cooktime-row{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:6px}
.menuday-app .cooktime-opt{
  border-radius:12px;padding:10px 6px;text-align:center;
  border:1.5px solid var(--bdr);background:var(--surf);transition:all .18s;
}
.menuday-app .cooktime-opt:hover{border-color:var(--g)}
.menuday-app .cooktime-opt.active{background:var(--gp);border-color:var(--gpp)}
.menuday-app .cooktime-opt.active .cooktime-label{color:var(--gd)}
.menuday-app .cooktime-label{font-size:.8rem;font-weight:800;color:var(--t1);margin-bottom:2px}
.menuday-app .cooktime-sub{font-size:.62rem;color:var(--t3);line-height:1.3}

/* ═══════ BUDGET ROW ═══════ */
.menuday-app .budget-row{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:14px}
.menuday-app .budget-opt{border-radius:16px;padding:14px 10px;text-align:center;border:1.5px solid var(--bdr);background:var(--surf);transition:all .18s}
.menuday-app .budget-opt:hover{border-color:var(--g);transform:translateY(-2px)}
.menuday-app .budget-opt.active{border-color:var(--g);background:var(--gp)}
.menuday-app .budget-opt.active .budget-name{color:var(--gd)}
.menuday-app .budget-ico{font-size:1.5rem;margin-bottom:6px}
.menuday-app .budget-name{font-size:.8rem;font-weight:800;color:var(--t1);margin-bottom:2px}
.menuday-app .budget-sub{font-size:.65rem;color:var(--t3)}

/* ═══════ DISLIKE INPUT ═══════ */
.menuday-app .dislike-input-wrap{margin-bottom:6px}
.menuday-app .dislike-input{
  width:100%;border:1.5px solid var(--bdr2);border-radius:14px;background:var(--surf2);
  padding:12px 14px;font-size:.92rem;color:var(--t1);outline:none;resize:none;
  transition:border-color .2s;line-height:1.5;
}
.menuday-app .dislike-input:focus{border-color:var(--g);background:var(--surf)}
.menuday-app .dislike-input::placeholder{color:var(--t-dis)}
.menuday-app .field-hint{font-size:.74rem;color:var(--t3);margin-top:5px}

/* ═══════ STEP FOOTER ═══════ */
.menuday-app .step-foot{padding:12px 18px calc(14px + var(--sab));background:var(--surf);border-top:1px solid var(--bdr);flex-shrink:0}
.menuday-app .btn-primary{
  width:100%;height:52px;border-radius:16px;
  background:linear-gradient(140deg,#52BE7A,var(--gd));
  color:#fff;font-size:1rem;font-weight:700;border:none;
  display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 4px 16px rgba(69,174,107,.35);transition:all .2s;
}
.menuday-app .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(69,174,107,.45)}
.menuday-app .btn-primary:active{transform:translateY(0)}
.menuday-app .btn-ghost{
  background:none;border:none;color:var(--t3);font-size:.9rem;font-weight:600;
  width:100%;text-align:center;padding:12px;margin-top:2px;transition:color .15s;
  height:var(--touch);display:flex;align-items:center;justify-content:center;
}
.menuday-app .btn-ghost:hover{color:var(--gd)}

/* ═══════ SWIPE ═══════ */
.menuday-app #s-swipe{background:var(--bg)}
.menuday-app .swipe-head{padding:14px 18px 6px;flex-shrink:0}
.menuday-app .swipe-dots{display:flex;gap:5px;margin-bottom:11px;overflow:hidden;max-width:100%}
.menuday-app .s-dot{height:4px;border-radius:4px;background:var(--surf2);transition:all .3s;flex:1;min-width:3px}
.menuday-app .s-dot.done{background:var(--g)}
.menuday-app .s-dot.now{background:var(--gl);flex:2}
.menuday-app .swipe-eyebrow{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--gd)}
.menuday-app .swipe-title{font-family:'Playfair Display',serif;font-size:clamp(1.35rem,5vw,1.75rem);font-weight:800;color:var(--t1);line-height:1.2;margin-top:4px}
.menuday-app .swipe-title em{font-style:italic;color:var(--gd)}
.menuday-app .swipe-hint-sub{font-size:.76rem;color:var(--t3);margin-top:4px}
.menuday-app .swipe-hint{font-size:.72rem;color:var(--t3);text-align:center;padding:0 18px 4px;flex-shrink:0}
.menuday-app .swipe-area{flex:1;display:flex;align-items:center;justify-content:center;padding:4px 18px}
.menuday-app .card-stack{position:relative;width:100%;max-width:320px;height:330px}
.menuday-app .dish-card{
  position:absolute;inset:0;background:var(--surf);border-radius:24px;
  overflow:hidden;cursor:grab;will-change:transform;
  box-shadow:var(--sh2);border:1px solid var(--bdr);user-select:none;touch-action:none;
}
.menuday-app .dish-card:active{cursor:grabbing}
.menuday-app .dish-card.behind-1{transform:scale(.95) translateY(12px);z-index:1;filter:brightness(.98)}
.menuday-app .dish-card.behind-2{transform:scale(.90) translateY(24px);z-index:0;filter:brightness(.96)}
.menuday-app .dish-card.top{z-index:3}
.menuday-app .card-img{height:175px;display:flex;align-items:center;justify-content:center;position:relative}
.menuday-app .card-img-bg{position:absolute;inset:0;font-size:5.5rem;display:flex;align-items:center;justify-content:center;opacity:.08;filter:blur(8px);pointer-events:none}
.menuday-app .card-img-fg{position:relative;z-index:1;font-size:3rem}
.menuday-app .card-body{padding:14px 16px}
.menuday-app .card-name{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:800;color:var(--t1);line-height:1.2}
.menuday-app .card-desc{font-size:.8rem;color:var(--t3);line-height:1.45;margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.menuday-app .card-meta{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap}
.menuday-app .card-meta-item{display:flex;align-items:center;gap:5px;font-size:.78rem;color:var(--t3);font-weight:500}
.menuday-app .vote-ov{position:absolute;inset:0;border-radius:24px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .1s;z-index:10;pointer-events:none}
.menuday-app .vote-ov.like{background:rgba(69,174,107,.13)}
.menuday-app .vote-ov.nope{background:rgba(205,60,60,.1)}
.menuday-app .vote-stamp{padding:8px 18px;border-radius:50px;border:2.5px solid;font-size:.95rem;font-weight:900;letter-spacing:.04em;background:rgba(255,255,255,.88);backdrop-filter:blur(8px)}
.menuday-app .vote-stamp.like{border-color:var(--g);color:var(--gd);transform:rotate(-8deg)}
.menuday-app .vote-stamp.nope{border-color:#C94040;color:#C94040;transform:rotate(6deg)}
.menuday-app .swipe-btns{display:flex;align-items:center;justify-content:center;gap:14px;padding:6px 18px calc(14px + var(--sab));flex-shrink:0}
.menuday-app .sw-btn{border-radius:50%;border:none;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
.menuday-app .sw-undo{width:var(--touch);height:var(--touch);background:var(--surf);box-shadow:var(--sh1);border:1.5px solid var(--bdr)}
.menuday-app .sw-undo:hover{background:var(--surf2);transform:scale(1.05)}
.menuday-app .sw-nope{width:58px;height:58px;background:var(--surf);box-shadow:0 4px 14px rgba(200,60,60,.18);border:1.5px solid rgba(200,60,60,.2)}
.menuday-app .sw-nope:hover{background:#fff5f5;transform:scale(1.06)}
.menuday-app .sw-like{width:70px;height:70px;background:linear-gradient(140deg,#52BE7A,var(--gd));box-shadow:0 8px 24px rgba(69,174,107,.48);border:none}
.menuday-app .sw-like:hover{transform:scale(1.07);box-shadow:0 12px 28px rgba(69,174,107,.56)}
.menuday-app .sw-like:active,.menuday-app .sw-nope:active,.menuday-app .sw-undo:active{transform:scale(.96)}
.menuday-app .sw-spacer{display:inline-block;width:44px;height:44px;flex-shrink:0}

/* ═══════ AHA SCREEN ═══════ */
.menuday-app #s-aha{overflow-y:auto;background:var(--bg)}
.menuday-app .aha-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:calc(12px + var(--sat)) 16px 10px;
  background:linear-gradient(135deg,var(--gp),#D8F2E5);
  border-bottom:1px solid var(--gpp);flex-shrink:0;
}
.menuday-app .aha-greeting{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:800;color:var(--t1)}
.menuday-app .aha-sub{font-size:.75rem;color:var(--t2);margin-top:2px}
.menuday-app .aha-save-btn{
  height:var(--touch);padding:0 16px;
  background:linear-gradient(140deg,#52BE7A,var(--gd));
  border:none;border-radius:22px;color:#fff;font-size:.86rem;font-weight:700;
  white-space:nowrap;box-shadow:0 4px 12px rgba(69,174,107,.35);transition:all .18s;flex-shrink:0;
} 
.menuday-app .aha-save-btn:hover{transform:translateY(-1px)}

/* МАКРО полоска */
.menuday-app .aha-macros{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 14px;background:var(--surf);border-bottom:1px solid var(--bdr)}
.menuday-app .aha-macro-box{background:var(--surf2);border-radius:12px;padding:9px 6px;text-align:center}
.menuday-app .aha-macro-box.green{background:var(--gp)}
.menuday-app .aha-macro-val{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:900;color:var(--t1)}
.menuday-app .aha-macro-box.green .aha-macro-val{color:var(--gd)}
.menuday-app .aha-macro-lbl{font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--t3);margin-top:2px}

/* Batch banner */
.menuday-app .batch-banner{
  margin:10px 14px;background:var(--ambp);border:1px solid rgba(217,119,6,.2);
  border-radius:16px;overflow:hidden;
}
.menuday-app .batch-banner-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(217,119,6,.15)}
.menuday-app .batch-banner-icon{font-size:1.1rem}
.menuday-app .batch-banner-title{font-size:.82rem;font-weight:800;color:#7C4A03}
.menuday-app .batch-banner-items{padding:8px 14px;display:flex;flex-direction:column;gap:7px}
.menuday-app .batch-item{display:flex;align-items:center;gap:10px}
.menuday-app .batch-item-ico{font-size:1.2rem;flex-shrink:0}
.menuday-app .batch-item-name{font-size:.85rem;font-weight:700;color:#7C4A03}
.menuday-app .batch-item-meta{font-size:.73rem;color:#9D6010}
.menuday-app .batch-note{font-size:.76rem;color:#9D6010;padding:8px 14px;border-top:1px solid rgba(217,119,6,.1);font-style:italic}

/* Табы AHA */
.menuday-app .aha-tabs{display:flex;background:var(--surf);border-bottom:1px solid var(--bdr);flex-shrink:0}
.menuday-app .aha-tab{flex:1;height:var(--touch);display:flex;align-items:center;justify-content:center;gap:5px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:.84rem;font-weight:700;color:var(--t3);transition:all .18s}
.menuday-app .aha-tab.active{color:var(--gd);border-bottom-color:var(--g)}
.menuday-app .aha-tab-panel{display:none;padding:14px 14px calc(24px + var(--sab))}
.menuday-app .aha-tab-panel.active{display:block}

/* Меню дни */
.menuday-app .week-list { display:flex; flex-direction:column; gap:14px; margin-bottom:14px; }
.menuday-app .day-card { background:var(--surf); border-radius:20px; border:1.5px solid var(--bdr); overflow:hidden; box-shadow:var(--sh1); }
.menuday-app .day-head { padding:11px 14px 9px; background:var(--gp); border-bottom:1px solid var(--gpp); display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
.menuday-app .day-head-left { display:flex; flex-direction:column; gap:2px; }
.menuday-app .day-weekday { font-family:'Playfair Display', serif; font-size:1rem; font-weight:800; color:var(--t1); }
.menuday-app .day-kcal-wrap { display:flex; flex-direction:column; align-items:flex-end; gap:4px; min-width:0; }
.menuday-app .day-kcal-val { font-size:.72rem; font-weight:700; color:var(--t2); white-space:nowrap; }
.menuday-app .day-kcal-of { font-weight:400; color:var(--t3); }

.menuday-app .meals-wrap { display:flex; flex-direction:column; }
.menuday-app .meal-section { border-bottom:1px solid rgba(69,174,107,.07); }
.menuday-app .meal-section:last-child { border-bottom:none; }
.menuday-app .meal-type-label {
  padding:8px 14px 0;
  font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em;
  display:flex; align-items:center; gap:5px;
  margin-bottom:0; /* перебиваем глобальный .meal-type-label из старых стилей */
}
.menuday-app .mtl-icon { font-size:.85rem; }

.menuday-app .meal-item { cursor:default; min-height:58px; }
.menuday-app .meal-content { display:flex; align-items:center; gap:10px; padding:7px 14px 10px; }
.menuday-app .meal-emoji {
  width:44px; height:44px; border-radius:13px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:1.35rem;
}
.menuday-app .meal-info { flex:1; min-width:0; }
.menuday-app .meal-name { font-size:.92rem; font-weight:700; color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.menuday-app .meal-meta { display:flex; align-items:center; gap:5px; margin-top:3px; font-size:.73rem; color:var(--t3); flex-wrap:wrap; }
.menuday-app .meta-sep { color:var(--bdr2); }
.menuday-app .meal-kcal { color:var(--t3); }
.menuday-app .meal-badge-wrap { margin-top:4px; }
.menuday-app .meal-badge { display:inline-flex; align-items:center; gap:3px; font-size:.62rem; font-weight:700; padding:2px 7px; border-radius:8px; white-space:nowrap; }
.menuday-app .meal-arrow { color:var(--t-dis); flex-shrink:0; margin-left:auto; }

.menuday-app .stats-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }

/* Shop list */
.menuday-app .shop-list{background:var(--surf);border-radius:16px;border:1px solid var(--bdr);overflow:hidden;margin-bottom:14px}
.menuday-app .shop-item-row{display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid var(--bdr);font-size:.88rem}
.menuday-app .shop-item-row:last-child{border-bottom:none}
.menuday-app .shop-item-name{color:var(--t1);font-weight:500}
.menuday-app .shop-item-qty{color:var(--t3)}
.menuday-app .aha-empty{text-align:center;padding:32px;color:var(--t3);font-size:.9rem}

/* Price */
.menuday-app .price-card{background:var(--surf);border-radius:18px;overflow:hidden;border:1.5px solid var(--bdr);margin-bottom:12px}
.menuday-app .pc-head{padding:10px 14px;background:var(--surf2);display:flex;justify-content:space-between;align-items:center}
.menuday-app .pc-head-t{font-size:.76rem;font-weight:800;color:var(--t2)}
.menuday-app .pc-upd{font-size:.65rem;color:var(--t3)}
.menuday-app .pc-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.04)}
.menuday-app .pc-store{font-size:.88rem;font-weight:600;color:var(--t2);display:flex;align-items:center;gap:10px}
.menuday-app .pc-ico{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.74rem;font-weight:900;color:#fff;flex-shrink:0}
.menuday-app .pc-samokat{background:#FF5800}
.menuday-app .pc-lavka{background:#1A1A1A;color:#FFD600!important}
.menuday-app .pc-vv{background:#00A651}
.menuday-app .pc-px{background:#006EB5}
.menuday-app .pc-price{font-size:.97rem;font-weight:800}
.menuday-app .pc-win{color:var(--gd)}
.menuday-app .pc-lose{color:var(--t3)}
.menuday-app .pc-badge{font-size:.62rem;font-weight:800;padding:3px 9px;border-radius:20px;background:var(--gp);color:var(--gd);border:1px solid var(--gpp)}
.menuday-app .pc-save{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:var(--gp)}
.menuday-app .pc-save-l{font-size:.78rem;color:var(--gd);font-weight:600}
.menuday-app .pc-save-v{font-size:.92rem;font-weight:900;color:var(--gd)}

/* Bottom CTA */
.menuday-app .aha-bottom-cta{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.menuday-app .aha-fine{text-align:center;font-size:.74rem;color:var(--t3)}
.menuday-app .btn-action{
  width:100%;height:52px;border-radius:16px;
  background:linear-gradient(140deg,#FF8533,#FF6B00);
  color:#fff;font-size:.97rem;font-weight:700;border:none;
  display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 5px 18px rgba(255,107,0,.3);transition:all .2s;
}
.menuday-app .btn-action:hover{transform:translateY(-1px)}

/* ═══════ SHEETS ═══════ */
.menuday-app .sheet-backdrop{
  position:fixed;inset:0;z-index:100;
  background:rgba(26,46,34,.48);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  display:none;align-items:flex-end;justify-content:center;
}
.menuday-app .sheet-backdrop.open{display:flex}
.menuday-app .sheet{
  background:var(--surf);border-radius:28px 28px 0 0;
  width:100%;max-width:500px;max-height:88dvh;
  display:flex;flex-direction:column;
  transform:translateY(100%);transition:transform .32s var(--ease-out);overflow:hidden;
}
.menuday-app .sheet-backdrop.open .sheet{transform:translateY(0)}
.menuday-app .sheet-handle{width:36px;height:4px;background:var(--surf2);border-radius:2px;margin:12px auto 0;flex-shrink:0;cursor:grab}
.menuday-app .sheet-scroll{flex:1;overflow-y:auto;scrollbar-width:none}
.menuday-app .sheet-scroll::-webkit-scrollbar{display:none}

/* Reg sheet */
.menuday-app .reg-title{font-family:'Playfair Display',serif;font-size:1.45rem;font-weight:800;color:var(--t1);margin-bottom:4px}
.menuday-app .reg-sub{font-size:.88rem;color:var(--t2);margin-bottom:18px;line-height:1.5}
.menuday-app .reg-btn{width:100%;height:52px;border-radius:16px;font-size:.95rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .18s;margin-bottom:10px;border:none}
.menuday-app .reg-apple{background:#1A1A1A;color:#fff}
.menuday-app .reg-apple:hover{background:#2F2F2F}
.menuday-app .reg-google{background:var(--surf);color:var(--t1);border:1.5px solid var(--bdr2)!important}
.menuday-app .reg-google:hover{background:var(--surf2)}
.menuday-app .reg-divider{position:relative;text-align:center;margin:12px 0}
.menuday-app .reg-divider::before{content:'';position:absolute;left:0;top:50%;right:0;height:1px;background:var(--bdr)}
.menuday-app .reg-divider span{background:var(--surf);padding:0 12px;font-size:.74rem;color:var(--t3);position:relative}
.menuday-app .reg-email-inp{width:100%;height:50px;border-radius:14px;border:1.5px solid var(--bdr2);background:var(--surf2);padding:0 15px;font-size:.95rem;margin-bottom:10px;font-family:inherit;color:var(--t1);outline:none;transition:all .2s}
.menuday-app .reg-email-inp:focus{border-color:var(--g);background:var(--surf)}
.menuday-app .reg-submit{width:100%;height:52px;border-radius:16px;border:none;background:linear-gradient(140deg,#52BE7A,var(--gd));color:#fff;font-size:.97rem;font-weight:800;transition:all .18s}
.menuday-app .reg-submit:hover{transform:translateY(-1px)}
.menuday-app .reg-skip{width:100%;text-align:center;background:none;border:none;color:var(--t3);font-size:.82rem;margin-top:14px;padding:8px;height:var(--touch);display:flex;align-items:center;justify-content:center}

/* ═══════ TOAST ═══════ */
.menuday-app .toast{
  position:fixed;bottom:calc(24px + var(--sab));left:50%;
  transform:translateX(-50%) translateY(20px);
  background:var(--t1);color:#fff;
  padding:12px 20px;border-radius:14px;font-size:.9rem;font-weight:600;
  box-shadow:var(--sh3);z-index:500;opacity:0;transition:all .3s var(--ease-out);pointer-events:none;white-space:nowrap;
}
.menuday-app .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* ═══════ RESPONSIVE ═══════ */
@media(max-width:360px){
  .menuday-app .goal-grid{grid-template-columns:1fr}
  .menuday-app .freq-grid{grid-template-columns:1fr 1fr}
  .menuday-app .cooktime-row{grid-template-columns:repeat(2,1fr)}
  .menuday-app .budget-row{grid-template-columns:1fr}
  .menuday-app .aha-macros{grid-template-columns:repeat(2,1fr)}
}
@media(prefers-reduced-motion:reduce){
  .menuday-app *{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
</style>