<script setup>
/**
 * AppTopbar.vue — Универсальная шапка «Время Есть»
 *
 * Props:
 *   title          String   — заголовок страницы (необязательно, берётся из роута)
 *   showBack       Boolean  — показывать кнопку «назад» (вложенные страницы)
 *   searchScope    String   — 'recipes' | 'prices' | 'all' | null (отключить поиск)
 *
 * Emit:
 *   back           — нажата кнопка назад
 *
 * Зависимости:
 *   - useAuthStore   (pinia) — auth.user, auth.isPremium
 *   - useSearchStore (pinia) — query, results, isLoading, search()
 *   - useNotifStore  (pinia) — unreadCount
 *   - vue-router
 *   - tokens.css глобально
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }   from '@/stores/authStore'
import { useSearchStore } from '@/stores/search'
import { useNotifStore }  from '@/stores/notifications'

// ── Props & Emits ──────────────────────────────────────────────
const props = defineProps({
  title:       { type: String,  default: null },
  showBack:    { type: Boolean, default: false },
  searchScope: { type: String,  default: 'all' }, // 'recipes' | 'prices' | 'all' | null
})

const emit = defineEmits(['back'])

// ── Stores & Router ────────────────────────────────────────────
const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const search = useSearchStore()
const notifs = useNotifStore()

// ── Состояния ──────────────────────────────────────────────────
const searchActive  = ref(false)   // шапка в режиме поиска
const searchInput   = ref(null)    // ref на <input>
const localQuery    = ref('')      // локальная копия строки запроса
let   debounceTimer = null

// ── Вычисляемые ───────────────────────────────────────────────
const pageTitle = computed(() => {
  if (props.title) return props.title
  // Автозаголовок по имени роута
  const titles = {
    recipes:  'Рецепты',
    menu:     'Меню на неделю',
    saved:    'Сохранения',
    prices:   'Сравнение цен',
    profile:  'Профиль',
  }
  return titles[route.name] || ''
})

// Инициалы пользователя для аватара
const userInitial = computed(() => {
  if (!auth.user) return ''
  const src = auth.user?.name || auth.user?.email || ''
  return src[0]?.toUpperCase() || '?'
})

// Имя / никнейм пользователя
const userName = computed(() => {
  if (!auth.user) return ''
  return auth.user?.name || auth.user?.email?.split('@')[0] || ''
})

// Показывать ли кнопку поиска
const hasSearch = computed(() => !!props.searchScope)

// Бейдж уведомлений (макс 99)
const notifBadge = computed(() => {
  const n = notifs.unreadCount || 0
  return n > 99 ? '99+' : n > 0 ? String(n) : ''
})

// ── Поиск ─────────────────────────────────────────────────────
async function openSearch() {
  searchActive.value = true
  await nextTick()
  searchInput.value?.focus()
}

function closeSearch() {
  searchActive.value = false
  localQuery.value   = ''
  search.clear()
}

function onQueryInput(e) {
  localQuery.value = e.target.value
  clearTimeout(debounceTimer)
  if (!localQuery.value.trim()) {
    search.clear()
    return
  }
  // Debounce 350ms — не дёргаем API при каждом символе
  debounceTimer = setTimeout(() => {
    search.search(localQuery.value, props.searchScope)
  }, 350)
}

function onQueryKeydown(e) {
  if (e.key === 'Escape') closeSearch()
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer)
    search.search(localQuery.value, props.searchScope)
  }
}

// Закрываем поиск при переходе на другую страницу
watch(() => route.path, closeSearch)

// Закрываем по клику вне шапки
function onDocClick(e) {
  if (searchActive.value && !e.target.closest('.topbar')) {
    closeSearch()
  }
}
onMounted(()  => document.addEventListener('click', onDocClick, { passive: true }))
onUnmounted(() => document.removeEventListener('click', onDocClick))

// ── Навигация ──────────────────────────────────────────────────
function goBack() {
  emit('back')
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function goProfile() {
  router.push('/profile')
}

function goAuth() {
  router.push('/auth')
}

function goNotifications() {
  router.push('/notifications')
}
</script>

<template>
  <header class="topbar" :class="{ 'topbar--search': searchActive }">

    <!-- ══════════════════════════════════════════
         ОБЫЧНЫЙ РЕЖИМ
    ══════════════════════════════════════════ -->
    <template v-if="!searchActive">

      <!-- Левая зона: back или лого -->
      <div class="topbar__left">
        <button
            v-if="showBack"
            class="topbar__icon-btn"
            @click="goBack"
            aria-label="Назад"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <router-link v-else to="/" class="topbar__logo" aria-label="Время Есть — на главную">
          <!-- Логомарк -->
          <div class="logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <!-- Текст — скрывается на узких экранах когда показывает заголовок -->
          <span class="logo-text" :class="{ 'logo-text--hidden': pageTitle }" aria-hidden="true">
            Время Есть
          </span>
        </router-link>
      </div>

      <!-- Центр: заголовок страницы -->
      <div class="topbar__center" v-if="pageTitle && !showBack">
        <h2 class="topbar__title">{{ pageTitle }}</h2>
      </div>
      <!-- Вложенная страница: заголовок слева рядом с back -->
      <div class="topbar__center topbar__center--back" v-else-if="pageTitle && showBack">
        <h2 class="topbar__title">{{ pageTitle }}</h2>
      </div>

      <!-- Правая зона: иконки действий -->
      <div class="topbar__right">

        <!-- Поиск -->
        <button
            v-if="hasSearch"
            class="topbar__icon-btn"
            @click.stop="openSearch"
            aria-label="Поиск"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        <!-- Уведомления -->
        <button
            class="topbar__icon-btn topbar__notif-btn"
            @click="goNotifications"
            :aria-label="notifBadge ? `Уведомления, ${notifBadge} непрочитанных` : 'Уведомления'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notifBadge" class="notif-badge" aria-hidden="true">{{ notifBadge }}</span>
        </button>

        <!-- ── АВАТАР: авторизован ── -->
        <button
            v-if="auth.user"
            class="topbar__avatar-btn"
            @click="goProfile"
            :aria-label="`Профиль — ${userName}`"
        >
          <!-- Фото профиля если есть -->
          <img
              v-if="auth.user?.avatar_url"
              :src="auth.user?.avatar_url"
              :alt="userName"
              class="avatar-img"
          />
          <!-- Иначе — инициал -->
          <div v-else class="avatar-initials" aria-hidden="true">
            {{ userInitial }}
          </div>
          <!-- Premium бейдж -->
          <div
              v-if="auth.isPremium"
              class="premium-badge"
              aria-label="Premium подписка"
              title="Premium"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </button>

        <!-- ── АВАТАР: гость ── -->
        <button
            v-else
            class="topbar__guest-btn"
            @click="goAuth"
            aria-label="Войти в аккаунт"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="guest-label">Войти</span>
        </button>

      </div>
    </template>

    <!-- ══════════════════════════════════════════
         РЕЖИМ ПОИСКА
         Вся шапка трансформируется в строку поиска
    ══════════════════════════════════════════ -->
    <template v-else>

      <!-- Кнопка назад из поиска -->
      <button
          class="topbar__icon-btn topbar__search-back"
          @click="closeSearch"
          aria-label="Закрыть поиск"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <!-- Строка поиска -->
      <div class="topbar__search-wrap" role="search">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
            ref="searchInput"
            class="topbar__search-input"
            type="search"
            inputmode="search"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            :placeholder="searchScope === 'prices' ? 'Найти продукт...' : 'Рецепты, ингредиенты, продукты...'"
            :value="localQuery"
            @input="onQueryInput"
            @keydown="onQueryKeydown"
            aria-label="Поиск по приложению"
            aria-autocomplete="list"
            aria-controls="search-results"
        />
        <!-- Очистить запрос -->
        <button
            v-if="localQuery"
            class="search-clear-btn"
            @click="localQuery = ''; search.clear(); searchInput?.focus()"
            aria-label="Очистить поиск"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </button>
      </div>

      <!-- Индикатор загрузки -->
      <div v-if="search.isLoading" class="topbar__search-spinner" aria-label="Поиск..." role="status">
        <div class="spinner"></div>
      </div>

    </template>

  </header>

  <!-- ══════════════════════════════════════════
       ВЫПАДАЮЩИЕ РЕЗУЛЬТАТЫ ПОИСКА
       Teleport вне шапки — не обрезается overflow
  ══════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="search-drop">
      <div
          v-if="searchActive && (search.results?.recipes?.length || search.results?.products?.length || search.isEmpty)"
          class="search-dropdown"
          id="search-results"
          role="listbox"
          aria-label="Результаты поиска"
      >

        <!-- Пусто -->
        <div v-if="search.isEmpty && !search.isLoading" class="search-empty">
          <span aria-hidden="true">🔍</span>
          Ничего не нашли по запросу «{{ localQuery }}»
        </div>

        <!-- Группа: Рецепты -->
        <div v-if="search.results?.recipes?.length" class="search-group">
          <div class="search-group__label">Рецепты</div>
          <button
              v-for="recipe in search.results.recipes.slice(0, 5)"
              :key="recipe.id"
              class="search-item"
              role="option"
              @click="() => { search.openRecipe(recipe); closeSearch(); router.push('/recipes') }"
          >
            <img
                v-if="recipe.image_url"
                :src="recipe.image_url"
                :alt="recipe.title"
                class="search-item__img"
                loading="lazy"
            />
            <div
                v-else
                class="search-item__img-placeholder"
                :style="{ background: recipe.bg || 'var(--surf2)' }"
                aria-hidden="true"
            >{{ recipe.emoji || '🍽️' }}</div>
            <div class="search-item__body">
              <p class="search-item__title">{{ recipe.title }}</p>
              <p class="search-item__meta">{{ recipe.cook_time_min }} мин · {{ recipe.calories }} ккал</p>
            </div>
            <span class="search-item__arrow" aria-hidden="true">›</span>
          </button>
        </div>

        <!-- Группа: Продукты и цены -->
        <div v-if="search.results?.products?.length" class="search-group">
          <div class="search-group__label">Продукты и цены</div>
          <router-link
              v-for="product in search.results.products.slice(0, 4)"
              :key="product.id"
              :to="`/prices/${product.slug}`"
              class="search-item"
              role="option"
              @click="closeSearch"
          >
            <div class="search-item__price-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div class="search-item__body">
              <p class="search-item__title">{{ product.name }}</p>
              <p class="search-item__meta search-item__meta--price">
                <span v-if="product.price_samokat">Самокат {{ product.price_samokat }} ₽</span>
                <span v-if="product.price_lavka" class="price-sep">· Лавка {{ product.price_lavka }} ₽</span>
              </p>
            </div>
            <span class="search-item__arrow" aria-hidden="true">›</span>
          </router-link>
        </div>

        <!-- Показать всё -->
        <router-link
            v-if="search.results?.total > 9"
            :to="`/search?q=${encodeURIComponent(localQuery)}`"
            class="search-show-all"
            @click="closeSearch"
        >
          Показать все результаты ({{ search.results.total }})
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>

      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ══════════════════════════════════════════════════════════
   ШАПКА
   Высота: --topbar-h (56px) + safe-area-inset-top
   Все токены из tokens.css
══════════════════════════════════════════════════════════ */

.topbar {
  position:     sticky;
  top:          0;
  z-index:      200;
  flex-shrink:  0;

  /* Safe area сверху (Dynamic Island, Notch) */
  padding-top:  var(--sat);

  display:      flex;
  align-items:  center;
  gap:          4px;
  height:       calc(var(--topbar-h) + var(--sat));
  padding-left:  max(var(--sal), 12px);
  padding-right: max(var(--sar), 12px);

  background:   rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--bdr);
  /* Стеклянный эффект */
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  box-shadow:   0 1px 0 var(--bdr);

  /* Плавный переход между режимами */
  transition: background 0.2s ease;
}

/* ── Левая зона ── */
.topbar__left {
  display:     flex;
  align-items: center;
  flex-shrink: 0;
}

.topbar__logo {
  display:        flex;
  align-items:    center;
  gap:            8px;
  text-decoration: none;
  /* touch target */
  min-height:     var(--touch);
  padding:        0 4px 0 0;
}

.logo-mark {
  width:           32px;
  height:          32px;
  border-radius:   9px;
  background:      linear-gradient(140deg, var(--g), var(--gd));
  box-shadow:      var(--sh-logo);
  display:         flex;
  align-items:     center;
  justify-content: center;
  flex-shrink:     0;
}

.logo-text {
  font-family:    'Playfair Display', Georgia, serif;
  font-size:      1rem;
  font-weight:    800;
  color:          var(--t1);
  line-height:    1;
  white-space:    nowrap;
  transition:     opacity 0.2s ease, max-width 0.2s ease;
  max-width:      120px;
  overflow:       hidden;
}

/* На маленьких экранах когда есть заголовок — скрываем текст лого */
.logo-text--hidden {
  max-width: 0;
  opacity:   0;
}

/* ── Центр: заголовок ── */
.topbar__center {
  flex:        1;
  min-width:   0;
  display:     flex;
  align-items: center;
  /* Центрируем заголовок между left и right */
  justify-content: center;
}

.topbar__center--back {
  justify-content: flex-start;
  padding-left:    4px;
}

.topbar__title {
  font-family:   'DM Sans', system-ui, sans-serif;
  font-size:     1rem;
  font-weight:   700;
  color:         var(--t1);
  line-height:   1.2;
  margin:        0;
  white-space:   nowrap;
  overflow:      hidden;
  text-overflow: ellipsis;
  max-width:     100%;
}

/* ── Правая зона ── */
.topbar__right {
  display:     flex;
  align-items: center;
  gap:         2px;
  flex-shrink: 0;
  margin-left: auto;
}

/* ── Иконка-кнопка (базовый стиль) ── */
.topbar__icon-btn {
  width:           44px;
  height:          44px;
  border-radius:   12px;
  border:          none;
  background:      transparent;
  color:           var(--t2);
  cursor:          pointer;
  display:         flex;
  align-items:     center;
  justify-content: center;
  flex-shrink:     0;
  transition:      background 0.15s ease, color 0.15s ease, transform 0.15s var(--ease-spring);
  -webkit-tap-highlight-color: transparent;
}
.topbar__icon-btn:hover  { background: var(--surf2); color: var(--t1); }
.topbar__icon-btn:active { transform: scale(0.9); }
.topbar__icon-btn:focus-visible {
  outline:        3px solid var(--g);
  outline-offset: 2px;
}

/* ── Уведомления с бейджем ── */
.topbar__notif-btn {
  position: relative;
}

.notif-badge {
  position:        absolute;
  top:             6px;
  right:           6px;
  min-width:       18px;
  height:          16px;
  padding:         0 5px;
  border-radius:   8px;
  background:      var(--coral);
  color:           #fff;
  font-size:       0.625rem;  /* 10px */
  font-weight:     800;
  line-height:     16px;
  text-align:      center;
  pointer-events:  none;
  /* Обводка чтобы не сливался с иконкой */
  box-shadow:      0 0 0 2px #fff;
}

/* ── Аватар авторизованного пользователя ── */
.topbar__avatar-btn {
  position:        relative;
  width:           36px;
  height:          36px;
  border-radius:   50%;
  border:          2px solid var(--gpp);
  background:      var(--gp);
  cursor:          pointer;
  display:         flex;
  align-items:     center;
  justify-content: center;
  flex-shrink:     0;
  /* touch target через margin негативный */
  margin:          4px;
  transition:      border-color 0.15s ease, transform 0.15s var(--ease-spring);
  -webkit-tap-highlight-color: transparent;
}
.topbar__avatar-btn:hover  { border-color: var(--g); }
.topbar__avatar-btn:active { transform: scale(0.93); }
.topbar__avatar-btn:focus-visible {
  outline:        3px solid var(--g);
  outline-offset: 2px;
}

.avatar-img {
  width:         100%;
  height:        100%;
  border-radius: 50%;
  object-fit:    cover;
}

.avatar-initials {
  font-size:   0.875rem;
  font-weight: 700;
  color:       var(--gd);
  line-height: 1;
  user-select: none;
}

/* Premium бейдж — звёздочка в углу аватара */
.premium-badge {
  position:        absolute;
  bottom:          -3px;
  right:           -3px;
  width:           16px;
  height:          16px;
  border-radius:   50%;
  background:      linear-gradient(135deg, #F59E0B, #D97706);
  color:           #fff;
  display:         flex;
  align-items:     center;
  justify-content: center;
  box-shadow:      0 0 0 2px #fff;
  pointer-events:  none;
}

/* ── Кнопка для гостя ── */
.topbar__guest-btn {
  display:         flex;
  align-items:     center;
  gap:             5px;
  height:          34px;
  padding:         0 12px 0 10px;
  border-radius:   20px;
  border:          1.5px solid var(--gpp);
  background:      var(--gp);
  color:           var(--gd);
  cursor:          pointer;
  font-family:     inherit;
  font-size:       0.8125rem;
  font-weight:     700;
  white-space:     nowrap;
  flex-shrink:     0;
  /* touch target */
  min-height:      44px;
  transition:      background 0.15s ease, border-color 0.15s ease, transform 0.15s var(--ease-spring);
  -webkit-tap-highlight-color: transparent;
}
.topbar__guest-btn:hover  { background: var(--gpp); border-color: var(--g); }
.topbar__guest-btn:active { transform: scale(0.96); }
.topbar__guest-btn:focus-visible {
  outline:        3px solid var(--g);
  outline-offset: 2px;
}

.guest-label {
  /* Скрываем текст на очень маленьких экранах */
  display: inline;
}

/* ══════════════════════════════════════════════════════════
   РЕЖИМ ПОИСКА
══════════════════════════════════════════════════════════ */
.topbar__search-back {
  flex-shrink: 0;
}

.topbar__search-wrap {
  flex:            1;
  display:         flex;
  align-items:     center;
  gap:             8px;
  height:          38px;
  padding:         0 10px;
  border-radius:   12px;
  background:      var(--surf2);
  border:          1.5px solid transparent;
  transition:      border-color 0.15s ease;
}

.topbar__search-wrap:focus-within {
  border-color: var(--g);
  background:   var(--gp);
}

.search-icon {
  color:       var(--t3);
  flex-shrink: 0;
}

.topbar__search-input {
  flex:         1;
  border:       none;
  background:   transparent;
  font-family:  inherit;
  font-size:    1rem; /* 16px — предотвращает zoom на iOS */
  color:        var(--t1);
  outline:      none;
  min-width:    0;
  caret-color:  var(--g);
}

.topbar__search-input::placeholder { color: var(--t3); }

/* Убираем крестик системный в Safari/Chrome */
.topbar__search-input::-webkit-search-cancel-button { display: none; }

.search-clear-btn {
  width:           28px;
  height:          28px;
  border-radius:   50%;
  border:          none;
  background:      var(--gpp);
  color:           var(--gd);
  cursor:          pointer;
  flex-shrink:     0;
  display:         flex;
  align-items:     center;
  justify-content: center;
  transition:      background 0.15s ease;
}
.search-clear-btn:hover { background: var(--g); color: #fff; }

/* Спиннер поиска */
.topbar__search-spinner {
  flex-shrink: 0;
  width:       20px;
  display:     flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width:        18px;
  height:       18px;
  border:       2px solid var(--gpp);
  border-top-color: var(--g);
  border-radius: 50%;
  animation:    spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════
   АДАПТИВ
   375px — стандартный iPhone SE
   320px — минимум
══════════════════════════════════════════════════════════ */

/* На маленьком экране: текст «Войти» убираем, оставляем иконку */
@media (max-width: 374px) {
  .guest-label { display: none; }
  .topbar__guest-btn { padding: 0 10px; }
}

/* Уменьшаем gap между иконками на узком экране */
@media (max-width: 360px) {
  .topbar__right { gap: 0; }
  .topbar__icon-btn { width: 40px; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .topbar, .topbar__icon-btn, .topbar__avatar-btn,
  .topbar__guest-btn, .logo-text, .spinner {
    transition: none;
    animation:  none;
  }
}

/* ══════════════════════════════════════════════════════════
   АНИМАЦИИ РЕЖИМА ПОИСКА
══════════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: no-preference) {
  /* Контент шапки fade при переключении */
  .topbar > * {
    animation: topbar-fadein 0.18s ease both;
  }

  @keyframes topbar-fadein {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
</style>

<!-- ══════════════════════════════════════════════════════════
     ГЛОБАЛЬНЫЕ СТИЛИ для .search-dropdown
     (Teleport рендерит вне scoped-контекста)
══════════════════════════════════════════════════════════ -->
<style>
.search-dropdown {
  position:   fixed;
  top:        calc(var(--topbar-h) + var(--sat));
  left:       0;
  right:      0;
  z-index:    199; /* ниже шапки (200) */
  max-height: calc(100dvh - var(--topbar-h) - var(--sat) - var(--nav-total-h) - 16px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  background:    #fff;
  border-bottom: 1px solid var(--bdr);
  box-shadow:    var(--sh2);

  /* Скролл не "прыгает" */
  overscroll-behavior: contain;
}

/* Анимация выпадения */
@media (prefers-reduced-motion: no-preference) {
  .search-drop-enter-active { transition: opacity 0.2s ease, transform 0.2s var(--ease-out); }
  .search-drop-leave-active { transition: opacity 0.15s ease; }
  .search-drop-enter-from   { opacity: 0; transform: translateY(-8px); }
  .search-drop-leave-to     { opacity: 0; }
}

/* ── Группы ── */
.search-group {
  padding-top: 8px;
}

.search-group__label {
  padding:        4px 16px 6px;
  font-size:      0.6875rem;  /* 11px */
  font-weight:    700;
  color:          var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

/* ── Элемент результата ── */
/*
  FIX-SEARCH-CLICK: раньше .search-item был button без width:100%, а у браузера
  button по умолчанию shrink-to-fit (inline-block-like). Из-за этого
  кликабельная зона была равна ширине контента (≈ 44px иконка + текст),
  и тапы по «пустой» правой части строки игнорировались. Лечится через
  width:100% + сброс button-стилей (border/background/text-align).
*/
.search-item {
  /* В .search-dropdown это либо <button>, либо <router-link>. Делаем block
     с явным width:100%, чтобы вся ширина была кликабельной. */
  display:         flex;
  width:           100%;
  align-items:     center;
  gap:             12px;
  padding:         10px 16px;
  text-decoration: none;
  color:           inherit;
  transition:      background 0.12s ease;
  cursor:          pointer;
  /* touch target */
  min-height:      52px;

  /* Сброс button-defaults — рендерим как обычную строку списка. */
  background:      transparent;
  border:          none;
  text-align:      left;
  font:            inherit;
  -webkit-tap-highlight-color: transparent;
}

.search-item:hover,
.search-item:focus-visible {
  background: var(--gp);
  outline:    none;
}

.search-item:active {
  background: var(--gpp);
}

.search-item__img {
  width:         44px;
  height:        44px;
  border-radius: 10px;
  object-fit:    cover;
  flex-shrink:   0;
  background:    var(--surf2);
}

.search-item__img-placeholder {
  width:           44px;
  height:          44px;
  border-radius:   10px;
  background:      var(--surf2);
  display:         flex;
  align-items:     center;
  justify-content: center;
  font-size:       1.5rem;
  line-height:     1;
  flex-shrink:     0;
}

.search-item__price-icon {
  width:           44px;
  height:          44px;
  border-radius:   10px;
  background:      var(--bluep);
  color:           var(--blued);
  display:         flex;
  align-items:     center;
  justify-content: center;
  flex-shrink:     0;
}

.search-item__body {
  flex:      1;
  min-width: 0;
}

.search-item__title {
  font-size:     0.9375rem;
  font-weight:   600;
  color:         var(--t1);
  margin:        0 0 2px;
  white-space:   nowrap;
  overflow:      hidden;
  text-overflow: ellipsis;
}

.search-item__meta {
  font-size:   0.75rem;
  color:       var(--t3);
  margin:      0;
  white-space: nowrap;
}

.search-item__meta--price { color: var(--gd); font-weight: 600; }
.price-sep { color: var(--t3); font-weight: 400; }

.search-item__arrow {
  font-size:   1.1rem;
  color:       var(--t3);
  flex-shrink: 0;
  line-height: 1;
}

/* ── Пустое состояние ── */
.search-empty {
  padding:     32px 16px;
  text-align:  center;
  font-size:   0.9375rem;
  color:       var(--t3);
  display:     flex;
  flex-direction: column;
  align-items: center;
  gap:         10px;
}

.search-empty span { font-size: 2rem; }

/* ── Показать все ── */
.search-show-all {
  display:         flex;
  align-items:     center;
  justify-content: center;
  gap:             6px;
  padding:         14px 16px;
  border-top:      1px solid var(--bdr);
  text-decoration: none;
  font-size:       0.875rem;
  font-weight:     700;
  color:           var(--gd);
  transition:      background 0.12s ease;
}

.search-show-all:hover  { background: var(--gp); }
.search-show-all:active { background: var(--gpp); }
</style>