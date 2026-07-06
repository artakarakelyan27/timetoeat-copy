<script setup>
/**
 * SavedView.vue — «Время Есть»
 *
 * ИЗМЕНЕНИЯ v1.1 (Этап 1):
 * ✓ FIX-08 — createdRecipes теперь реально приходит из menuStore (был ReferenceError)
 * ✓ FIX-07 — variant="outline" теперь существует в BaseButton
 * ✓ FIX-12 — safeCreated вычисляется из store.createdRecipes (не undefined)
 * ✓ FIX-13 — Toast cleanup: clearTimeout при onUnmounted
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter }       from 'vue-router'
import { useMenuStore }    from '@/stores/menuStore'

import BaseButton     from '@/components/atoms/BaseButton.vue'
import BaseBadge      from '@/components/atoms/BaseBadge.vue'
import BaseInput      from '@/components/atoms/BaseInput.vue'
import BottomSheet    from '@/components/organisms/BottomSheet.vue'
import RecipeDetailSheet from '@/components/organisms/RecipeDetailSheet.vue'
import { useTrack } from '@/composables/useTrack'
const { track, trackRecipe, EVENT } = useTrack()

const router = useRouter()
const store  = useMenuStore()

// Защищённый доступ — работает с любой версией store (старой и новой).
// Не используем storeToRefs чтобы не получить undefined если свойство
// отсутствует в устаревшей версии store на сервере.
const savedRecipes   = computed(() => store.savedRecipes   ?? [])
const createdRecipes = computed(() => store.createdRecipes ?? [])

// При монтировании грузим список рецептов автора с бэка. Без этого
// «Мои рецепты» всегда будет пустым, даже если рецепты созданы.
onMounted(() => {
  if (typeof store.fetchCreatedRecipes === 'function') {
    store.fetchCreatedRecipes()
  }
})

// ─── ВКЛАДКИ ─────────────────────────────────────────────────
const activeTab = ref('saved')

function setTab(tab) {
  track(EVENT.SAVED_TAB_SWITCHED, { tab, fromTab: activeTab.value })
  activeTab.value = tab
}

function goToCreate() {
  // Добавляем трекинг перед переходом
  track(EVENT.RECIPE_CREATE_START, { source: activeTab.value })
  router.push('/recipes/create')
}

// ─── ФИЛЬТРЫ И ПОИСК ─────────────────────────────────────────
const FILTERS = [
  { label: '❤️ Все',     id: 'all' },
  { label: '🍳 Завтрак', id: 'breakfast' },
  { label: '🥗 Обед',    id: 'lunch' },
  { label: '🍷 Ужин',    id: 'dinner' },
  { label: '🍎 Перекус', id: 'snack' },
]

const MEAL_TYPES = {
  breakfast: { label: 'Завтрак', bg: '#FEF3C7', fg: '#633806' },
  lunch:     { label: 'Обед',    bg: '#EBF8F1', fg: '#085041' },
  snack:     { label: 'Перекус', bg: '#E6F1FB', fg: '#0C447C' },
  dinner:    { label: 'Ужин',    bg: '#EEEDFE', fg: '#3C3489' },
}

const activeFilter = ref('all')
const searchQuery  = ref('')

watch(searchQuery, (q) => {
  // Мы не трекаем каждый символ (это создаёт лишний шум в базе),
  // а записываем событие, только когда пользователь ввёл что-то осмысленное.
  if (q.trim().length >= 3) {
    track(EVENT.SAVED_SEARCH, { 
      queryLength: q.trim().length 
    })
  }
})

const filteredSaved = computed(() => {
  // savedRecipes — уже computed с ?? [] защитой выше
  let list = [...savedRecipes.value]
  if (activeFilter.value !== 'all') list = list.filter(r => r?.type === activeFilter.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter(r =>
    r?.name?.toLowerCase().includes(q) ||
    r?.desc?.toLowerCase().includes(q)
  )
  return list
})

// safeCreated = просто алиас, createdRecipes уже computed с ?? [] защитой
const safeCreated = createdRecipes

// ─── МОДАЛКА РЕЦЕПТА ─────────────────────────────────────────
const modalOpen   = ref(false)
const modalRecipe = ref(null)

function openModal(r) {
  // Трекаем просмотр с указанием вкладки (saved или created)
  trackRecipe(EVENT.RECIPE_VIEW, r, { source: activeTab.value })
  
  modalRecipe.value = r
  modalOpen.value = true
}

// Валидные слоты приёма пищи. Используются и в меню-пикере, и в confirmAddToMenu
// для подстановки безопасного дефолта, если у рецепта пустой type.
const VALID_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner']
const selectedSlot = ref('lunch')

function confirmAddToMenu(dayIdx) {
  if (!recipeToAdd.value) return

  // Используем выбранный пользователем слот, а не recipe.type напрямую.
  // Это гарантирует, что блюдо попадёт в видимый раздел меню — тот же
  // фикс, что мы делали в RecipesView. Без этого пользовательский рецепт
  // с пустым type уходил в скрытый слот и казался удалённым.
  const slot = VALID_SLOTS.includes(selectedSlot.value) ? selectedSlot.value : 'lunch'

  // Фиксируем добавление именно из раздела «Сохранённое»
  trackRecipe(EVENT.RECIPE_ADD_TO_MENU, recipeToAdd.value, {
    dayIdx,
    mealType: slot,
    source: activeTab.value === 'created' ? 'created' : 'saved',
  })

  store.addDishToMenu(dayIdx, slot, recipeToAdd.value.id)
  isDayPickerOpen.value = false
  modalOpen.value = false
  showToast(`📅 Добавлено: ${MEAL_TYPES[slot]?.label || 'Меню'} · ${WEEK_DAYS[dayIdx]}`)
}

// ─── УДАЛЕНИЕ ────────────────────────────────────────────────
// Раньше removeRecipe всегда работал через toggleSavedRecipe (закладки в
// localStorage). Это корректно для вкладки «Сохранённые», но НЕ работает
// для «Мои рецепты»: пользовательские рецепты живут на бэке, и убрать их
// можно только через DELETE /user-recipes/{id}.
//
// Теперь логика разветвлена по вкладкам:
//   - 'saved'   → toggleSavedRecipe (анбукмарк, остаётся в общей ленте)
//   - 'created' → deleteCreatedRecipe (полное удаление с сервера)
async function removeRecipe(recipeId) {
  if (activeTab.value === 'created') {
    const recipe = createdRecipes.value.find(r => r.id === recipeId)
    if (!recipe) return

    // Простой confirm — без модалки, чтобы не плодить лишний UI.
    // Если в дальнейшем понадобится красивый диалог — заменить на BottomSheet.
    const ok = window.confirm(`Удалить рецепт «${recipe.name}»? Это действие необратимо.`)
    if (!ok) return

    trackRecipe(EVENT.RECIPE_UNSAVE, recipe, { source: 'created' })

    const success = await store.deleteCreatedRecipe(recipeId)
    if (success) {
      modalOpen.value = false
      showToast('🗑 Рецепт удалён')
    } else {
      showToast('Не удалось удалить рецепт')
    }
    return
  }

  // Вкладка «Сохранённые» — старое поведение.
  const recipe = store.savedRecipes.find(r => r.id === recipeId)
  if (recipe) trackRecipe(EVENT.RECIPE_UNSAVE, recipe)
  store.toggleSavedRecipe(recipeId)
}

// ─── ДОБАВЛЕНИЕ В МЕНЮ ───────────────────────────────────────
const isDayPickerOpen = ref(false)
const recipeToAdd     = ref(null)

const WEEK_DAYS = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг',
  'Пятница', 'Суббота', 'Воскресенье',
]

// ─── TOAST ───────────────────────────────────────────────────
const toastMsg     = ref('')
const toastVisible = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value     = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2400)
}

// FIX-13: очищаем таймер при размонтировании
onUnmounted(() => clearTimeout(toastTimer))

function promptAddMenu(recipe) {
  recipeToAdd.value = recipe
  // По умолчанию слот = тип рецепта, если он валидный. Иначе — обед как
  // нейтральный дефолт. Пользователь всё равно увидит чипы и сможет поменять.
  selectedSlot.value = VALID_SLOTS.includes(recipe?.type) ? recipe.type : 'lunch'
  isDayPickerOpen.value = true
}

// function confirmAddToMenu(dayIdx) {
//   if (!recipeToAdd.value) return
//   store.addDishToMenu(dayIdx, recipeToAdd.value.type, recipeToAdd.value.id)
//   isDayPickerOpen.value = false
//   modalOpen.value       = false
//   showToast(`📅 Добавлено на ${WEEK_DAYS[dayIdx]}`)
// }
</script>

<template>
  <div class="saved-view">

    <!-- СЕГМЕНТИРОВАННЫЙ КОНТРОЛ (HIG) -->
    <div class="tabs-wrap">
      <div class="segmented-control" role="tablist" aria-label="Вкладки рецептов">
        <button
          class="segment-btn"
          :class="{ active: activeTab === 'saved' }"
          @click="setTab('saved')" 
        >
          Сохранённые
        </button>

        <button
          class="segment-btn"
          :class="{ active: activeTab === 'created' }"
          @click="setTab('created')"
        >
          Мои рецепты
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- ВКЛАДКА: СОХРАНЁННЫЕ                      -->
    <!-- ══════════════════════════════════════════ -->
    <div v-show="activeTab === 'saved'" class="tab-content">

      <!-- ПОИСК -->
      <div class="search-wrap">
        <BaseInput v-model="searchQuery" type="search" placeholder="Поиск рецептов…">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </template>
          <template #suffix>
            <BaseButton
              v-if="searchQuery"
              variant="icon"
              size="sm"
              ariaLabel="Очистить поиск"
              @click="searchQuery = ''"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </BaseButton>
          </template>
        </BaseInput>
      </div>

      <!-- ФИЛЬТРЫ -->
      <div class="filter-bar" role="group" aria-label="Фильтр по приёму пищи">
        <BaseButton
          v-for="f in FILTERS"
          :key="f.id"
          variant="pill"
          :isActive="activeFilter === f.id"
          @click="activeFilter = f.id"
        >
          {{ f.label }}
        </BaseButton>
      </div>

      <!-- СПИСОК -->
      <main class="list-wrap">
        <!-- Пустой стейт: нет сохранённых вообще -->
        <div v-if="!savedRecipes || savedRecipes.length === 0" class="empty-state">
          <div class="empty-icon" aria-hidden="true">💔</div>
          <div class="empty-title">Пока ничего нет</div>
          <div class="empty-sub">Листай рецепты и нажимай ❤️, чтобы сохранять понравившиеся</div>
        </div>

        <!-- Пустой стейт: не найдено по фильтру/поиску -->
        <div v-else-if="filteredSaved.length === 0" class="empty-state">
          <div class="empty-icon" aria-hidden="true">🔍</div>
          <div class="empty-title">Ничего не найдено</div>
          <div class="empty-sub">Попробуй другой фильтр или измени запрос</div>
          <BaseButton variant="primary" @click="activeFilter = 'all'; searchQuery = ''">
            Сбросить
          </BaseButton>
        </div>

        <!-- СЕТКА КАРТОЧЕК -->
        <div v-else class="recipe-grid">
          <article
            v-for="recipe in filteredSaved"
            :key="recipe.id"
            class="recipe-card"
            role="button"
            tabindex="0"
            @click="openModal(recipe)"
            @keydown.enter.space.prevent="openModal(recipe)"
          >
            <div class="card-img-wrap">
              <img
                v-if="recipe.image"
                :src="recipe.image"
                :alt="recipe.name"
                class="card-img"
                loading="lazy"
              />
              <div
                v-else
                class="card-img-ph"
                :style="{ background: recipe.bg || 'var(--gp)' }"
                aria-hidden="true"
              >
                {{ recipe.emoji || '🍽️' }}
              </div>
              <button
                class="card-remove"
                @click.stop="removeRecipe(recipe.id)"
                aria-label="Удалить из сохранений"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="card-body">
              <div class="card-tags">
                <BaseBadge :variant="recipe.type" shape="rect" size="sm">
                  {{ MEAL_TYPES[recipe.type]?.label || 'Блюдо' }}
                </BaseBadge>
                <BaseBadge v-if="recipe.isVeg"  variant="green" shape="rect" size="sm">🥦 Вег</BaseBadge>
                <BaseBadge v-if="recipe.isFast" variant="amber" shape="rect" size="sm">⚡ Быстро</BaseBadge>
              </div>
              <div class="card-title">{{ recipe.name }}</div>
              <div class="card-meta">
                <span v-if="recipe.time">⏱ {{ recipe.time }} мин</span>
                <span v-if="recipe.kcal">🔥 {{ recipe.kcal }} ккал</span>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- ВКЛАДКА: МОИ РЕЦЕПТЫ (FIX-08/12)          -->
    <!-- ══════════════════════════════════════════ -->
    <div v-show="activeTab === 'created'" class="tab-content">
      <main class="list-wrap">

        <!-- Пустой стейт: псевдо-форма-приглашение -->
        <div v-if="safeCreated.length === 0" class="creator-onboarding">
          <div class="creator-icon" aria-hidden="true">✨</div>
          <h2 class="creator-title">Твой первый рецепт</h2>
          <p class="creator-sub">Поделись кулинарным шедевром. С чего начнём?</p>

          <div
            class="fake-form"
            role="button"
            tabindex="0"
            @click="goToCreate"
            @keydown.enter.space.prevent="goToCreate"
          >
            <div class="fake-label">Название блюда</div>
            <BaseInput
              modelValue=""
              placeholder="Напр: Запечённые котлеты..."
              disabled
              class="fake-input-margin"
            />
            <!-- pointer-events: none — это не интерактивная кнопка внутри fake-form -->
            <BaseButton variant="primary" style="pointer-events: none;">
              Продолжить
            </BaseButton>
          </div>
        </div>

        <!-- Созданные рецепты -->
        <div v-else class="created-recipes-container">
          <div class="recipe-grid">
            <article
              v-for="recipe in safeCreated"
              :key="recipe.id"
              class="recipe-card"
              role="button"
              tabindex="0"
              @click="openModal(recipe)"
              @keydown.enter.space.prevent="openModal(recipe)"
            >
              <div class="card-img-wrap">
                <img
                  v-if="recipe.image"
                  :src="recipe.image"
                  :alt="recipe.name"
                  class="card-img"
                  loading="lazy"
                />
                <div
                  v-else
                  class="card-img-ph"
                  :style="{ background: recipe.bg || 'var(--gp)' }"
                  aria-hidden="true"
                >
                  {{ recipe.emoji || '🍽️' }}
                </div>
              </div>
              <div class="card-body">
                <div class="card-title">{{ recipe.name }}</div>
              </div>
            </article>
          </div>

          <div class="add-more-wrap">
            <!-- FIX-07: variant="outline" теперь существует в BaseButton -->
            <BaseButton variant="outline" @click="goToCreate">
              + Добавить ещё рецепт
            </BaseButton>
          </div>
        </div>

      </main>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- МОДАЛКИ                                   -->
    <!-- ══════════════════════════════════════════ -->
    <RecipeDetailSheet v-model="modalOpen" :recipe="modalRecipe">
      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" @click="removeRecipe(modalRecipe.id)">
            🗑 Удалить
          </BaseButton>
          <BaseButton variant="primary" @click="promptAddMenu(modalRecipe)">
            📅 В меню
          </BaseButton>
        </div>
      </template>
    </RecipeDetailSheet>

    <!-- День для добавления в меню -->
    <BottomSheet v-model="isDayPickerOpen" title="Куда добавить рецепт?">
      <!-- Шаг 1: приём пищи. По умолчанию выбран тип рецепта. -->
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
      <div class="day-picker">
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

    <!-- TOAST -->
    <div
      class="toast"
      :class="{ show: toastVisible }"
      role="status"
      aria-live="polite"
    >
      {{ toastMsg }}
    </div>

  </div>
</template>

<style scoped>
/* ─── LAYOUT ─────────────────────────────────────────────── */
.saved-view {
  flex:            1;
  display:         flex;
  flex-direction:  column;
  overflow:        hidden;
  background:      var(--bg);
}

/* TABS (Segmented Control HIG) */
.tabs-wrap {
  padding:       var(--sp-sm) var(--sp-lg) var(--sp-md);
  background:    var(--surf);
  border-bottom: 1px solid var(--bdr);
  flex-shrink:   0;
}
.segmented-control {
  display:       flex;
  background:    var(--surf2);
  padding:       4px;
  border-radius: 12px;
}
.segment-btn {
  flex:          1;
  height:        36px;
  text-align:    center;
  font-size:     0.85rem;
  font-weight:   600;
  color:         var(--t3);
  border-radius: 8px;
  transition:    background 0.2s, color 0.2s, box-shadow 0.2s;
}
.segment-btn.active {
  background: var(--surf);
  color:      var(--t1);
  box-shadow: var(--sh1);
}

/* ВКЛАДКИ */
.tab-content {
  flex:            1;
  display:         flex;
  flex-direction:  column;
  overflow:        hidden;
}

/* ПОИСК + ФИЛЬТРЫ */
.search-wrap {
  padding:     var(--sp-md) var(--sp-lg) 0;
  background:  var(--surf);
  flex-shrink: 0;
}
.filter-bar {
  flex-shrink:   0;
  background:    var(--surf);
  border-bottom: 1px solid var(--bdr);
  padding:       var(--sp-md) var(--sp-lg);
  overflow-x:    auto;
  white-space:   nowrap;
  scrollbar-width: none;
  display:       flex;
  gap:           8px;
}
.filter-bar::-webkit-scrollbar { display: none; }

/* СПИСОК */
.list-wrap {
  flex:            1;
  overflow-y:      auto;
  padding:         var(--sp-lg);
  padding-bottom:  calc(var(--nav-total-h) + var(--sp-2xl));
  scrollbar-width: none;
}
.list-wrap::-webkit-scrollbar { display: none; }

/* GRID И КАРТОЧКИ */
.recipe-grid {
  display:               grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap:                   12px;
}
.recipe-card {
  background:    var(--surf);
  border-radius: 16px;
  box-shadow:    var(--sh1);
  overflow:      hidden;
  cursor:        pointer;
  transition:    transform 0.18s var(--ease-out), box-shadow 0.18s;
  position:      relative;
}
.recipe-card:hover { transform: translateY(-2px); box-shadow: var(--sh2); }
.recipe-card:active { transform: scale(0.98); }
.recipe-card:focus-visible { outline: 2px solid var(--g); outline-offset: 2px; }

.card-img-wrap {
  position: relative;
  height:   140px;
  overflow: hidden;
}
.card-img    { width: 100%; height: 100%; object-fit: cover; }
.card-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 44px; }

/* Кнопка удаления карточки */
.card-remove {
  position:      absolute;
  top:           8px;
  right:         8px;
  width:         28px;
  height:        28px;
  border-radius: 50%;
  background:    rgba(0, 0, 0, 0.45);
  color:         var(--surf);
  border:        none;
  display:       flex;
  align-items:   center;
  justify-content: center;
  cursor:        pointer;
  z-index:       5;
  transition:    background 0.15s;
}
.card-remove:hover { background: rgba(0, 0, 0, 0.6); }

.card-body  { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
.card-tags  { display: flex; gap: 4px; flex-wrap: wrap; }
.card-title {
  font-family:           'Playfair Display', serif;
  font-size:             0.95rem;
  font-weight:           800;
  color:                 var(--t1);
  line-height:           1.3;
  display:               -webkit-box;
  -webkit-line-clamp:    2;
  line-clamp:            2;
  -webkit-box-orient:    vertical;
  overflow:              hidden;
}
.card-meta { display: flex; gap: 6px; font-size: 0.72rem; color: var(--t3); flex-wrap: wrap; }

/* EMPTY STATES */
.empty-state {
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  justify-content: center;
  height:          100%;
  min-height:      50vh;
  gap:             10px;
  text-align:      center;
}
.empty-icon  { font-size: 64px; margin-bottom: 4px; }
.empty-title {
  font-family: 'Playfair Display', serif;
  font-size:   1.3rem;
  color:       var(--t2);
  line-height: 1.3;
}
.empty-sub {
  font-size:   0.88rem;
  color:       var(--t3);
  line-height: 1.6;
  max-width:   260px;
  margin-bottom: 8px;
}

/* CREATOR ONBOARDING */
.creator-onboarding {
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  justify-content: center;
  height:          100%;
  min-height:      50vh;
  text-align:      center;
}
.creator-icon  { font-size: 56px; margin-bottom: 12px; }
.creator-title {
  font-family:   'Playfair Display', serif;
  font-size:     1.4rem;
  font-weight:   800;
  color:         var(--t1);
  margin-bottom: 8px;
}
.creator-sub {
  font-size:     0.9rem;
  color:         var(--t3);
  line-height:   1.5;
  margin-bottom: var(--sp-3xl);
  max-width:     280px;
}
.fake-form {
  width:         100%;
  max-width:     340px;
  background:    var(--surf);
  border:        1.5px dashed var(--bdr2);
  border-radius: 20px;
  padding:       var(--sp-xl);
  text-align:    left;
  cursor:        pointer;
  transition:    border-color 0.2s, background 0.2s;
  box-shadow:    var(--sh1);
}
.fake-form:hover,
.fake-form:focus-visible {
  border-color: var(--g);
  background:   var(--bg);
}
.fake-label        { font-size: 0.8rem; font-weight: 700; color: var(--t2); margin-bottom: 8px; }
.fake-input-margin { margin-bottom: var(--sp-lg); }

.created-recipes-container { width: 100%; }
.add-more-wrap {
  margin-top:    var(--sp-2xl);
  padding-top:   var(--sp-2xl);
  border-top:    1px dashed var(--bdr);
  display:       flex;
  justify-content: center;
}

/* МОДАЛКА — внутренние стили (.recipe-details, .modal-img-wrap, .ing-row, .step-row,
   .section-title) вынесены в components/organisms/RecipeDetailSheet.vue */

.modal-footer-btns {
  display: flex;
  gap:     10px;
}
.modal-footer-btns > * { flex: 1; }

/* ДНИ */
.day-picker { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

/* ── ПИКЕР: ПРИЁМ ПИЩИ + ДЕНЬ ─────────────────────────────── */
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

/* TOAST */
.toast {
  position:   fixed;
  bottom:     calc(var(--nav-total-h) + 12px);
  left:       50%;
  transform:  translateX(-50%) translateY(10px);
  background: var(--t1);
  color:      var(--surf);
  padding:    10px 20px;
  border-radius: 14px;
  font-size:  0.88rem;
  font-weight: 600;
  box-shadow: var(--sh3);
  /* z-index: 500 — ВЫШЕ BottomSheet (300) и BottomNav (90), чтобы toast был всегда виден */
  z-index:    500;
  opacity:    0;
  transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out);
  pointer-events: none;
  white-space:    nowrap;
  max-width:      calc(100vw - 32px);
  text-align:     center;
}
.toast.show {
  opacity:   1;
  transform: translateX(-50%) translateY(0);
}
</style>