<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMenuStore } from '@/stores/menuStore'
import { storeToRefs } from 'pinia'
import { useTrack } from '@/composables/useTrack'
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/authStore'
import { applyHardFilters } from '@/utils/mealPlanGenerator'
const { track, trackRecipe, EVENT } = useTrack()

// ─── ИМПОРТ АТОМОВ И ОРГАНИЗМОВ ───
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BottomSheet from '@/components/organisms/BottomSheet.vue'
import RecipeDetailSheet from '@/components/organisms/RecipeDetailSheet.vue'

const store = useMenuStore()
const searchStore = useSearchStore()
const auth = useAuthStore()

// Тогл «Подходит мне» — применяет жёсткие фильтры (аллергии, диета, дизлайки)
// из preferences пользователя. По дефолту выключен — пользователь сам решает.
const onlyMine = ref(false)

// Открываем модалку когда из поиска выбрали рецепт
watch(() => searchStore.pendingRecipe, (recipe) => {
  if (recipe) {
    openModal(recipe)
    searchStore.clearPending()
  }
})
// Вытягиваем данные и состояние загрузки из твоего обновленного Pinia Store
const { recipes, recipesLoading } = storeToRefs(store)

// ─── ФИЛЬТРЫ ───
const FILTERS =[
  { label: '🍽️ Все',    value: 'all' },
  { label: '🍳 Завтрак', value: 'breakfast' },
  { label: '🥗 Обед',    value: 'lunch' },
  { label: '🍷 Ужин',    value: 'dinner' },
  { label: '🍎 Перекус', value: 'snack' },
]
// ─── ФИЛЬТРЫ ───
const activeFilter = ref('all')

// Добавляем эту функцию сюда:
function applyFilter(filterId) {
  // 1. Сначала записываем действие в аналитику
  track(EVENT.FEED_FILTER_USED, { 
    filterType: 'category', 
    value: filterId 
  })
  
  // 2. Затем реально меняем фильтр, что триггерит buildQueue (через watch)
  activeFilter.value = filterId
}

const MEAL_TYPES = {
  breakfast: { label: 'Завтрак', bg: '#FEF3C7', fg: '#633806' },
  lunch:     { label: 'Обед',    bg: '#EBF8F1', fg: '#085041' },
  dinner:    { label: 'Ужин',    bg: '#EEEDFE', fg: '#3C3489' },
  snack:     { label: 'Перекус', bg: '#E6F1FB', fg: '#0C447C' },
}

// ─── ОЧЕРЕДЬ КАРТОЧЕК ───
const queue     = ref([])
const queueIdx  = ref(0)
const liked     = ref([])
const swipeHist = ref([])

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQueue() {
  // 1. Фильтр по типу приёма (как было)
  let list = activeFilter.value === 'all'
      ? recipes.value.slice()
      : recipes.value.filter(r => r.type === activeFilter.value)

  // 2. «Подходит мне» — отсекаем рецепты, противоречащие аллергиям и диете
  if (onlyMine.value && auth.preferences) {
    list = applyHardFilters(list, auth.preferences)
  }

  queue.value = shuffle(list)
  queueIdx.value = 0
  liked.value =[]
  swipeHist.value =[]
}

watch(activeFilter, buildQueue)
watch(onlyMine, (v) => {
  track(EVENT.FEED_FILTER_USED, { filterType: 'only_mine', value: v ? 'on' : 'off' })
  buildQueue()
})
watch(recipes, v => { if (v.length) buildQueue() }, { immediate: true })

const currentRecipe = computed(() => queue.value[queueIdx.value])
let lingerStartTs = Date.now()
watch(currentRecipe, (rec, prev) => {
  if (prev) {
    const ms = Date.now() - lingerStartTs
    if (ms >= 5000) trackRecipe(EVENT.FEED_CARD_LINGER, prev, { lingerMs: ms })
  }
  lingerStartTs = Date.now()
})
const remaining     = computed(() => Math.max(0, queue.value.length - queueIdx.value))
const isEmpty       = computed(() => !recipesLoading.value && remaining.value === 0 && queue.value.length > 0)
const isQueueEmpty  = computed(() => !recipesLoading.value && queue.value.length === 0)

const visibleCards = computed(() => {
  const cards =[]
  // Рисуем 3 карточки. В обратном порядке, чтобы depth 0 была поверх всех в DOM
  for (let i = Math.min(2, queue.value.length - queueIdx.value - 1); i >= 0; i--) {
    cards.push({ recipe: queue.value[queueIdx.value + i], depth: i })
  }
  return cards
})

// ─── РЕАКТИВНЫЙ СВАЙП ───
const isDragging = ref(false)
const swipeFlyOut = ref(null) // 'right' или 'left'
const dragX = ref(0)
const dragY = ref(0)

let startX = 0, startY = 0
let dirLocked = false, isVertical = false

const likeOpacity = computed(() => {
  if (swipeFlyOut.value === 'right') return 1
  if (swipeFlyOut.value === 'left') return 0
  return isDragging.value && dragX.value > 10 ? Math.min((dragX.value - 10) / 100, 1) : 0
})

const nopeOpacity = computed(() => {
  if (swipeFlyOut.value === 'left') return 1
  if (swipeFlyOut.value === 'right') return 0
  return isDragging.value && dragX.value < -10 ? Math.min((Math.abs(dragX.value) - 10) / 100, 1) : 0
})

function getCardStyle(depth) {
  let progress = 0
  if (isDragging.value) progress = Math.min(Math.abs(dragX.value) / 150, 1)
  else if (swipeFlyOut.value) progress = 1

  if (depth === 0) {
    if (swipeFlyOut.value) {
      const dir = swipeFlyOut.value === 'right' ? 1 : -1
      const w = window.innerWidth || 400
      return {
        transform: `translate(${dir * w * 1.5}px, -40px) rotate(${dir * 30}deg) scale(1)`,
        opacity: 0,
        transition: 'transform 0.35s ease-in, opacity 0.35s ease-in',
        zIndex: 10,
        pointerEvents: 'none'
      }
    }
    if (isDragging.value) {
      return {
        transform: `translate(${dragX.value}px, ${dragY.value * 0.1}px) rotate(${dragX.value * 0.05}deg) scale(1)`,
        transition: 'none',
        zIndex: 10,
        cursor: 'grabbing'
      }
    }
    return {
      transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
      transition: 'transform 0.4s var(--ease-spring)',
      zIndex: 10,
      cursor: 'grab'
    }
  }

  if (depth === 1) {
    const scale = 0.95 + (0.05 * progress)
    const ty = 18 - (18 * progress)
    return {
      transform: `translate(0px, ${ty}px) rotate(0deg) scale(${scale})`,
      zIndex: 1, pointerEvents: 'none',
      transition: isDragging.value ? 'none' : 'transform 0.4s var(--ease-spring)'
    }
  }

  if (depth === 2) {
    const scale = 0.90 + (0.05 * progress)
    const ty = 36 - (18 * progress)
    return {
      transform: `translate(0px, ${ty}px) rotate(0deg) scale(${scale})`,
      opacity: 0.85 + (0.15 * progress),
      zIndex: 0, pointerEvents: 'none',
      transition: isDragging.value ? 'none' : 'all 0.4s var(--ease-spring)'
    }
  }
}

function startDrag(e) {
  if (swipeFlyOut.value || modalOpen.value || isDayPickerOpen.value) return
  if (e.target.closest('.tcard-tap-zone')) return

  isDragging.value = true; dirLocked = false; isVertical = false
  dragX.value = 0; dragY.value = 0

  const p = e.touches ? e.touches[0] : e
  startX = p.clientX; startY = p.clientY

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onEnd)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
}

function removeDragListeners() {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onEnd)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onEnd)
}

function onMove(e) {
  if (!isDragging.value) return
  const p = e.touches ? e.touches[0] : e
  const dx = p.clientX - startX
  const dy = p.clientY - startY

  if (!dirLocked && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    isVertical = Math.abs(dy) > Math.abs(dx)
    dirLocked = true
  }

  if (isVertical) return
  if (e.cancelable) e.preventDefault()

  dragX.value = dx
  dragY.value = dy
}

function onEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  removeDragListeners()

  if (isVertical) { dragX.value = 0; dragY.value = 0; return }

  const threshold = Math.min(window.innerWidth * 0.25, 90)
  if (dragX.value > threshold) processSwipe('right')
  else if (dragX.value < -threshold) processSwipe('left')
  else { dragX.value = 0; dragY.value = 0 }
}

function processSwipe(dir) {

  if (swipeFlyOut.value) return
  swipeFlyOut.value = dir

  const rec = currentRecipe.value

  if (rec) trackRecipe(
      dir === 'right' ? EVENT.FEED_SWIPE_RIGHT : EVENT.FEED_SWIPE_LEFT,
      rec,
  )

  if (dir === 'right') {
    if (rec) {
      liked.value.push(rec)
      store.toggleSavedRecipe(rec.id)
    }
    showToast('❤️ Сохранено')
  } else {
    showToast('👋 Пропущено')
  }

  swipeHist.value.push({ dir, rec })
  setTimeout(() => {
    queueIdx.value++; swipeFlyOut.value = null; dragX.value = 0; dragY.value = 0
  }, 350)
}

// ─── ДОБАВЛЕНИЕ В МЕНЮ (STORE INTEGRATION) ───
const isDayPickerOpen = ref(false)
const recipeToAdd = ref(null)
const WEEK_DAYS =['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

// Пользователь сам выбирает приём пищи перед выбором дня. По умолчанию —
// тип самого рецепта (если задан и валиден), иначе — обед как наиболее
// нейтральный слот. Раньше тип брался напрямую из рецепта без возможности
// поменять, из-за чего блюдо могло уйти в скрытый слот (например, перекус
// у семьи без детей — секция перекусов скрыта) и казалось «удалённым».
const VALID_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner']
const selectedSlot = ref('lunch')

// Открыть выбор дня
function promptAddMenu(recipe) {
  if (!recipe) return
  recipeToAdd.value = recipe
  selectedSlot.value = VALID_SLOTS.includes(recipe.type) ? recipe.type : 'lunch'
  isDayPickerOpen.value = true
}

// Подтвердить выбор дня и сохранить в Стор
function confirmAddToMenu(dayIdx) {
  if (!recipeToAdd.value) return

  // Используем выбранный пользователем слот, а не recipe.type напрямую.
  // Это гарантирует, что блюдо попадёт в видимый раздел меню.
  const slot = VALID_SLOTS.includes(selectedSlot.value) ? selectedSlot.value : 'lunch'
  store.addDishToMenu(dayIdx, slot, recipeToAdd.value.id)

  // ← ДОБАВИТЬ — самый сильный сигнал (вес 3.5 в системе)
  trackRecipe(EVENT.RECIPE_ADD_TO_MENU, recipeToAdd.value, { dayIdx, mealType: slot })

  isDayPickerOpen.value = false
  modalOpen.value = false
  showToast(`📅 Добавлено: ${MEAL_TYPES[slot]?.label || 'Меню'} · ${WEEK_DAYS[dayIdx]}`)
}


// ─── КНОПКИ ДЕЙСТВИЙ (ПАНЕЛЬ) ───
function btnNope() { if (!swipeFlyOut.value && !isEmpty.value) processSwipe('left') }
function btnLike() { if (!swipeFlyOut.value && !isEmpty.value) processSwipe('right') }
function btnInfo() { if (currentRecipe.value) openModal(currentRecipe.value) }

// ─── РЕЦЕПТ MODAL ───
const modalOpen   = ref(false)
const modalRecipe = ref(null)

function openModal(r) { 
  // 1. Добавляем трекинг события открытия (та самая функция)
  trackRecipe(EVENT.FEED_CARD_OPEN, r, { 
    queuePos: queueIdx.value 
  })
  
  // 2. Обычная логика открытия окна
  modalRecipe.value = r; 
  modalOpen.value = true 
}
function closeModal() { modalOpen.value = false }

// ─── TOAST ───
const toastMsg     = ref('')
const toastVisible = ref(false)
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg; toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2400)
}

// ─── KEYBOARD ───
function onKeyDown(e) {
  if (e.key === 'Escape') {
    if (isDayPickerOpen.value) { isDayPickerOpen.value = false; return }
    if (modalOpen.value) { closeModal(); return }
  }
  if (modalOpen.value || isDayPickerOpen.value) return
  if (e.key === 'ArrowRight') btnLike()
  if (e.key === 'ArrowLeft')  btnNope()
  if ((e.key === 'Enter' || e.key === ' ') && !swipeFlyOut.value) { e.preventDefault(); btnInfo() }
}

onMounted(async () => {
  document.addEventListener('keydown', onKeyDown)
  // Запрашиваем рецепты с API при загрузке.
  // Передаём prefs — бэк отфильтрует по диете/аллергиям/любимым кухням.
  if (!recipes.value.length) {
    await store.fetchRecipes({ preferences: auth.preferences })
  }
})

// Если юзер поменял prefs в профиле — перезагружаем ленту
watch(() => auth.preferences, async () => {
  await store.fetchRecipes({ preferences: auth.preferences })
}, { deep: true })

onUnmounted(() => {
  removeDragListeners()
  document.removeEventListener('keydown', onKeyDown)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="recipes-view">

    <!-- ── FILTER BAR ── -->
    <div class="filter-bar" role="group" aria-label="Фильтр по приёму пищи">
      <!-- ИСПОЛЬЗУЕМ BaseButton для фильтров -->
      <BaseButton
          v-for="f in FILTERS"
          :key="f.value"
          variant="pill"
          :isActive="activeFilter === f.value"
          @click="activeFilter = f.value"
      >
        {{ f.label }}
      </BaseButton>

      <!-- Тогл «Подходит мне»: применяет аллергии и диету из preferences -->
      <BaseButton
          variant="pill"
          :isActive="onlyMine"
          aria-label="Показать только подходящие мне рецепты"
          @click="onlyMine = !onlyMine"
      >
        ✓ Подходит мне
      </BaseButton>
    </div>

    <!-- ── STACK AREA ── -->
    <main class="stack-wrap" id="main-content" role="main" aria-label="Лента рецептов">

      <div v-if="recipesLoading" class="loading-wrap" role="status">
        <div class="spinner" aria-hidden="true"></div>
        <span>Ищем лучшие рецепты…</span>
      </div>

      <div v-else-if="isQueueEmpty" class="empty-stack" role="status">
        <div class="empty-icon" aria-hidden="true">🔍</div>
        <div class="empty-title">Нет рецептов</div>
        <div class="empty-sub">Попробуй другой фильтр</div>
        <BaseButton variant="primary" @click="activeFilter = 'all'">Показать все</BaseButton>
      </div>

      <div v-else-if="isEmpty" class="empty-stack" role="status">
        <div class="empty-icon" aria-hidden="true">🍽️</div>
        <div class="empty-title">Рецепты закончились!</div>
        <div class="empty-sub mb-4">
          Ты просмотрел {{ queue.length }} рецептов.<br>
          Понравилось: {{ liked.length }}
        </div>
        <BaseButton variant="primary" @click="buildQueue">Смотреть снова</BaseButton>
      </div>

      <!-- Card stack -->
      <div v-else class="stack" aria-label="Карточки рецептов">
        <div
            v-for="c in visibleCards"
            :key="c.recipe.id"
            class="tcard"
            :style="getCardStyle(c.depth)"
            :aria-label="c.depth === 0 ? `Рецепт: ${c.recipe.name}` : undefined"
            :aria-hidden="c.depth !== 0"
            @mousedown="c.depth === 0 ? startDrag($event) : null"
            @touchstart="c.depth === 0 ? startDrag($event) : null"
        >
          <!-- Зона фото -->
          <div class="tcard-img-wrap">
            <img v-if="c.recipe.image" :src="c.recipe.image" :alt="c.recipe.name" class="tcard-img" loading="lazy" />
            <div v-else class="tcard-img-ph" :style="{ background: c.recipe.bg || 'var(--gp)' }" aria-hidden="true">
              {{ c.recipe.emoji || '🍽️' }}
            </div>

            <!-- Зона тапа для открытия модалки -->
            <button v-if="c.depth === 0" class="tcard-tap-zone" @click.stop="openModal(c.recipe)" aria-label="Открыть рецепт">
              <span class="tcard-tap-hint" aria-hidden="true">Нажми, чтобы открыть рецепт</span>
            </button>
          </div>

          <!-- Оверлеи свайпа -->
          <div v-if="c.depth === 0" class="overlay-like" :style="{ opacity: likeOpacity }" aria-hidden="true">ВКУСНО ❤</div>
          <div v-if="c.depth === 0" class="overlay-nope" :style="{ opacity: nopeOpacity }" aria-hidden="true">ПРОПУСТИТЬ ✕</div>

          <!-- Тело карточки (Переведено на BaseBadge) -->
          <div class="tcard-body">
            <div class="tcard-tags">
              <BaseBadge :variant="c.recipe.type" shape="rect" size="sm">
                {{ MEAL_TYPES[c.recipe.type]?.label || 'Блюдо' }}
              </BaseBadge>
              <BaseBadge v-if="c.recipe.isVeg" variant="green" shape="rect" size="sm">🥦 Вег</BaseBadge>
              <BaseBadge v-if="c.recipe.isFast" variant="amber" shape="rect" size="sm">⚡ Быстро</BaseBadge>
            </div>

            <div class="tcard-title">{{ c.recipe.name }}</div>
            <div v-if="c.recipe.desc" class="tcard-desc">{{ c.recipe.desc }}</div>

            <!--
              Бейдж авторства для рецептов, опубликованных пользователями.
              Показывается, если бэк проставил признак (created_by / author_name).
              Имя — в кавычках-ёлочках (типографика брендбука); если имени нет,
              текст без кавычек: «Добавлено пользователем».
            -->
            <div v-if="c.recipe.isUserRecipe" class="tcard-author">
              <svg class="tcard-author-ico" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="tcard-author-text">
                Добавлено пользователем<template v-if="c.recipe.authorName"> «{{ c.recipe.authorName }}»</template>
              </span>
            </div>

            <div class="tcard-meta">
              <span v-if="c.recipe.time">⏱ {{ c.recipe.time }} мин</span>
              <span v-if="c.recipe.kcal">🔥 {{ c.recipe.kcal }} ккал</span>
              <span v-if="c.recipe.ings?.length">🧾 {{ c.recipe.ings.length }} ингр.</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── ACTION BUTTONS ── -->
    <div v-if="!recipesLoading && !isQueueEmpty" class="actions-toolbar" role="toolbar" aria-label="Действия с рецептом">
      <!-- ИСПОЛЬЗУЕМ BaseButton -->
      <BaseButton variant="icon" size="md" ariaLabel="Открыть рецепт" @click="btnInfo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
      </BaseButton>

      <div class="actions-core">
        <BaseButton variant="icon" size="lg" class="btn-nope" :disabled="isEmpty" ariaLabel="Не нравится, пропустить" @click="btnNope">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </BaseButton>
        <BaseButton variant="icon" size="xl" class="btn-like" :disabled="isEmpty" ariaLabel="Нравится" @click="btnLike">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </BaseButton>
      </div>

      <BaseButton variant="icon" size="md" ariaLabel="Добавить в меню" :disabled="isEmpty" @click="promptAddMenu(currentRecipe)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>
        </svg>
      </BaseButton>
    </div>

    <!-- ── РЕЦЕПТ MODAL ── -->
    <RecipeDetailSheet v-model="modalOpen" :recipe="modalRecipe">
      <template #footer>
        <BaseButton variant="primary" @click="promptAddMenu(modalRecipe)">
          📅 Добавить в меню
        </BaseButton>
      </template>
    </RecipeDetailSheet>

    <!-- ── ВЫБОР ПРИЁМА ПИЩИ + ДНЯ (BottomSheet) ── -->
    <BottomSheet v-model="isDayPickerOpen" title="Куда добавить рецепт?">
      <!-- Шаг 1: приём пищи (по умолчанию — тип рецепта) -->
      <div class="picker-section-label">Приём пищи</div>
      <div class="slot-chips" role="radiogroup" aria-label="Выбор приёма пищи">
        <button
          v-for="slot in ['breakfast','lunch','snack','dinner']"
          :key="slot"
          type="button"
          class="slot-chip"
          :class="{ active: selectedSlot === slot }"
          role="radio"
          :aria-checked="selectedSlot === slot"
          :style="selectedSlot === slot
            ? { background: MEAL_TYPES[slot].bg, color: MEAL_TYPES[slot].fg, borderColor: MEAL_TYPES[slot].fg }
            : {}"
          @click="selectedSlot = slot"
        >
          {{ MEAL_TYPES[slot].label }}
        </button>
      </div>

      <!-- Шаг 2: день недели -->
      <div class="picker-section-label">День недели</div>
      <div class="flex flex-col gap-2 mt-2">
        <BaseButton
            v-for="(day, idx) in WEEK_DAYS"
            :key="idx"
            variant="secondary"
            @click="confirmAddToMenu(idx)"
        >
          {{ day }}
        </BaseButton>
      </div>
    </BottomSheet>

    <!-- ── TOAST ── -->
    <div class="toast" :class="{ show: toastVisible }" role="status" aria-live="polite" aria-atomic="true">
      {{ toastMsg }}
    </div>

  </div>
</template>

<style scoped>
/* ── WRAPPER ──────────────────────────────────────────────── */
.recipes-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  user-select: none;
  -webkit-user-select: none;
}

/* ── TOPBAR ──────────────────────────────────────────────── */
.topbar {
  padding: calc(8px + var(--sat)) 16px 8px;
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surf); border-bottom: 1px solid var(--bdr);
  flex-shrink: 0; z-index: 30;
}
.logo-wrap { display: flex; align-items: center; gap: 9px; }
.logo-mark {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(140deg, var(--g), var(--gd));
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--sh-logo); flex-shrink: 0;
}
.logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.05rem; font-weight: 800; color: var(--t1);
}

/* ── FILTER BAR ──────────────────────────────────────────── */
.filter-bar {
  flex-shrink: 0; background: var(--surf); border-bottom: 1px solid var(--bdr);
  padding: 10px 16px; overflow-x: auto; white-space: nowrap;
  scrollbar-width: none; display: flex; gap: 8px; z-index: 20;
}
.filter-bar::-webkit-scrollbar { display: none; }

/* Родитель: убираем лишние проценты, дадим надёжные пиксельные отступы */
.stack-wrap {
  flex: 1;
  min-height: 0;          /* ← КРИТИЧНО: без этого flex-child не сжимается */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 16px;
  overflow: hidden;
}

/* 2. stack — убрать aspect-ratio и max-height, добавить height: 100% */
.stack {
  position: relative;
  width: 100%;
  max-width: 380px;
  height: 100%;           /* ← занимает всю высоту stack-wrap */
  margin: 0 auto;
  flex-shrink: 0;
  /* УБРАТЬ: aspect-ratio, max-height */
}

/* ── CARD (УНИВЕРСАЛЬНАЯ КАРТОЧКА) ───────────────────────── */
.tcard {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  overflow: hidden;
  background: var(--surf);
  box-shadow: 0 10px 32px rgba(0,0,0,0.08); /* Мягкая эппловская тень */
  border: 1px solid var(--bdr);
  will-change: transform;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
}

/* Фото: 3:2 — пропорция журнального фуд-фото, ограничена 42% карточки */
.tcard-img-wrap {
  position: relative;
  width: 100%;
  max-height: 45%;        /* ← вместо aspect-ratio: 3/2 */
  aspect-ratio: 3 / 2;   /* оставить как подсказку, но max-height перебивает */
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surf2);
}

.tcard-img {
  width: 100%; height: 100%; object-fit: cover; pointer-events: none; display: block;
}
.tcard-img-ph {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 5rem; pointer-events: none;
}

/* Починенная подсказка (блюр-плашка) */
.tcard-tap-zone {
  position: absolute; inset: 0; background: transparent; border: none;
  cursor: pointer; z-index: 5; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 12px; -webkit-tap-highlight-color: transparent;
}
.tcard-tap-hint {
  background: rgba(26, 46, 34, 0.65);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  /* На мобилках показываем всегда, но полупрозрачно, чтобы не бесило */
  opacity: 0.85;
  pointer-events: none;
}

/* Оверлеи свайпа (Лайк / Дизлайк) */
.overlay-like, .overlay-nope {
  position: absolute; top: 20px; padding: 7px 14px; border-radius: 12px;
  font-size: 1.4rem; font-weight: 900; letter-spacing: 0.05em; opacity: 0; border: 4px solid;
  pointer-events: none; z-index: 20; background: var(--surf);
}
.overlay-like { left: 20px; color: #45AE6B; border-color: #45AE6B; transform: rotate(-10deg); }
.overlay-nope { right: 20px; color: #C94040; border-color: #C94040; transform: rotate(10deg); }

/* Тело карточки: отступы по шкале брендбука (md=12px) */
.tcard-body {
  padding: 12px 16px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}
.tcard-body::-webkit-scrollbar { display: none; }

.tcard-tags {
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;
}

.tcard-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--t1);
  line-height: 1.25;
  margin-bottom: 4px;
}

.tcard-desc {
  font-size: 0.82rem;
  color: var(--t3);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tcard-meta {
  display: flex; gap: 10px; font-size: 0.78rem; font-weight: 600; color: var(--t3);
  flex-wrap: wrap; align-items: center;
  margin-top: auto;
  padding-top: 8px;
}

/* ── БЕЙДЖ АВТОРА (для пользовательских опубликованных рецептов) ── */
.tcard-author {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 8px;
  background: var(--gp);
  border: 1px solid var(--gpp);
  border-radius: 6px;
  align-self: flex-start;
  max-width: 100%;
}
.tcard-author-ico {
  flex-shrink: 0;
  color: var(--gd);
}
.tcard-author-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--gd);
  line-height: 1.3;
  /* На длинных именах сворачиваем с ellipsis, чтобы не ломать карточку */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── ACTION BUTTONS ──────────────────────────────────────── */
.actions-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  /* Меньше вертикального пространства — воздух уже в stack-wrap */
  padding: 8px 8px calc(8px + var(--sab, 0px));
  flex-shrink: 0;
}
.actions-core { display: flex; gap: 12px; align-items: center; }

.btn-nope {
  color: var(--coral); border: 2px solid rgba(201, 64, 64, 0.18);
  box-shadow: 0 4px 12px rgba(201, 64, 64, 0.08); background: var(--surf);
}
.btn-like {
  color: var(--surf); background: linear-gradient(140deg, var(--g), var(--gd));
  box-shadow: 0 8px 24px rgba(69, 174, 107, 0.4); border: none;
}

/* Кастомные стили для кнопок-иконок Tinder */
.btn-nope {
  color: var(--coral); border: 2px solid rgba(201, 64, 64, 0.18);
  box-shadow: var(--sh1); background: var(--surf);
}
.btn-nope:hover { background: var(--coralp); border-color: rgba(201,64,64,0.35); }
.btn-like {
  color: var(--surf); background: linear-gradient(140deg, var(--g), var(--gd));
  box-shadow: 0 8px 24px rgba(69, 174, 107, 0.48); border: none;
}
.btn-like:hover { transform: scale(1.05); box-shadow: 0 12px 28px rgba(69, 174, 107, 0.56); }

/* ── EMPTY / LOADING ─────────────────────────────────────── */
.loading-wrap {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px; color: var(--t3);
  background: var(--bg); border-radius: 20px; z-index: 50;
}
.spinner {
  width: 40px; height: 40px; border: 3px solid var(--gpp); border-top-color: var(--g);
  border-radius: 50%; animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-stack {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 10px; color: var(--t3); text-align: center; padding: 24px;
}
.empty-icon  { font-size: 64px; margin-bottom: 4px; }
.empty-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--t2); line-height: 1.3; }
.empty-sub   { font-size: .88rem; line-height: 1.6; max-width: 280px; margin-bottom: 16px; }

/* ── TOAST ───────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: calc(var(--nav-h) + var(--sab) + 12px);
  left: 50%; transform: translateX(-50%) translateY(10px);
  background: var(--t1); color: #fff; padding: 10px 20px; border-radius: 14px;
  font-size: .88rem; font-weight: 600; box-shadow: var(--sh3); z-index: 300; opacity: 0;
  transition: opacity .28s var(--ease-out), transform .28s var(--ease-out);
  pointer-events: none; white-space: nowrap; max-width: calc(100vw - 32px); text-align: center;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* УТИЛИТЫ ДЛЯ ВЕРСТКИ МОДАЛКИ (Tailwind-like) */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.aspect-video { aspect-ratio: 16 / 9; }
.bg-gp { background: var(--gp); }
.rounded-2xl { border-radius: 16px; }
.rounded-lg { border-radius: 8px; }
.text-6xl { font-size: 4rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.font-bold { font-weight: 700; }
.text-t2 { color: var(--t2); }
.text-t3 { color: var(--t3); }
.text-gd { color: var(--gd); }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }
.py-2 { padding-top: 8px; padding-bottom: 8px; }
.border-b { border-bottom: 1px solid var(--bdr); }
.border-bdr { border-color: var(--bdr); }
.border-\[1\.5px\] { border-width: 1.5px; }
.border-gpp { border-color: var(--gpp); }
.shrink-0 { flex-shrink: 0; }
.object-cover { object-fit: cover; }
.leading-relaxed { line-height: 1.625; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.overflow-hidden { overflow: hidden; }
.relative { position: relative; }
.flex-wrap { flex-wrap: wrap; }

/* ── ПИКЕР: ПРИЁМ ПИЩИ + ДЕНЬ ────────────────────────────── */
.picker-section-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--t3);
  margin: 14px 0 8px;
}
.picker-section-label:first-child { margin-top: 4px; }

.slot-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.slot-chip {
  flex: 1 1 calc(50% - 3px);
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1.5px solid var(--bdr2);
  background: var(--surf);
  color: var(--t2);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.slot-chip:hover:not(.active) {
  background: var(--gp);
  color: var(--gd);
  border-color: var(--g);
}
.slot-chip.active {
  font-weight: 700;
}
.slot-chip:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}
</style>