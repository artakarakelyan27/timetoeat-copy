<script setup>
/**
 * SplashScreen.vue — «Время Есть»
 *
 * Показывается авторизованному пользователю при старте приложения
 * пока идёт refreshFromServer() + fetchRecipes() + fetchWeekMenu().
 *
 * Эмиты:
 *   done — когда анимация завершена и данные загружены → App.vue скрывает splash
 *
 * Логика:
 *   1. Запускаем параллельно анимацию (мин. 1400ms) и загрузку данных.
 *   2. Эмитим 'done' когда выполнено И то И другое.
 *   3. Если данные пришли раньше — ждём окончания анимации.
 *   4. Если анимация завершилась раньше — ждём данных.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMenuStore } from '@/stores/menuStore'

const emit = defineEmits(['done'])

const auth = useAuthStore()
const menu = useMenuStore()

// Фазы анимации: idle → logo → text → tagline → done
const phase = ref('idle')

// Минимальное время показа splash (ms) — чтобы анимация успела отыграть
const MIN_DURATION = 1000

const _timers = []

onMounted(async () => {
  const startTime = Date.now()

  // Запускаем анимацию
  _timers.push(setTimeout(() => { phase.value = 'logo'    },   50))
  _timers.push(setTimeout(() => { phase.value = 'text'    },  300))
  _timers.push(setTimeout(() => { phase.value = 'tagline' },  580))
  _timers.push(setTimeout(() => { phase.value = 'ready'   },  850))

  // Параллельно грузим данные.
  // ВАЖНО: fetchRecipes теперь учитывает prefs пользователя (фильтр на бэке
  // по диете/аллергиям/кухням), поэтому сначала ждём refreshFromServer,
  // и только потом грузим рецепты с prefs.
  try {
    await auth.refreshFromServer()
  } catch {
    // Офлайн или 401 — без prefs, грузим всё подряд
  }
  try {
    await Promise.all([
      menu.fetchRecipes({ preferences: auth.preferences }),
      menu.fetchWeekMenu(),
    ])
  } catch {
    // Офлайн — продолжаем с кешем
  }

  // Ждём минимальное время показа
  const elapsed = Date.now() - startTime
  const wait = Math.max(0, MIN_DURATION - elapsed)

  _timers.push(setTimeout(() => {
    phase.value = 'exit'
    // Даём время fade-out анимации
    _timers.push(setTimeout(() => emit('done'), 380))
  }, wait))
})

onUnmounted(() => {
  _timers.forEach(clearTimeout)
})
</script>

<template>
  <div class="splash" :class="'phase-' + phase" aria-live="polite" aria-label="Загрузка приложения">

    <div class="splash-center">

      <!-- Логотип -->
      <div class="logo-wrap" :class="{ visible: phase !== 'idle' }">
        <div class="logo-mark">
          <!-- Градиентный фон — squircle -->
          <div class="logo-bg"></div>
          <!-- Циферблат -->
          <svg class="logo-clock" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="16" stroke="rgba(255,255,255,0.9)" stroke-width="3"/>
            <line x1="24" y1="24" x2="24" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="24" y1="24" x2="33" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="24" cy="24" r="2" fill="white"/>
          </svg>
        </div>
        <!-- Пульсирующее кольцо -->
        <div class="logo-ring" :class="{ pulse: phase === 'ready' }"></div>
      </div>

      <!-- Название -->
      <div class="brand-name" :class="{ visible: phase === 'text' || phase === 'tagline' || phase === 'ready' }">
        Время Есть
      </div>

      <!-- Подзаголовок -->
      <div class="tagline" :class="{ visible: phase === 'tagline' || phase === 'ready' }">
        Меню на неделю за 60 секунд
      </div>

      <!-- Прогресс-индикатор -->
      <div class="progress-wrap" :class="{ visible: phase === 'ready' }">
        <div class="progress-dots">
          <div class="dot" style="animation-delay: 0ms"></div>
          <div class="dot" style="animation-delay: 180ms"></div>
          <div class="dot" style="animation-delay: 360ms"></div>
        </div>
      </div>

    </div>

    <!-- Декоративный фон — волны -->
    <div class="splash-bg-wave wave-1"></div>
    <div class="splash-bg-wave wave-2"></div>

  </div>
</template>

<style scoped>
/* ── ОБЁРТКА ── */
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  /* Учитываем Safe Area на iOS */
  padding-top: var(--sat);
  padding-bottom: var(--sab);
  overflow: hidden;
  /* Fade-out при exit */
  opacity: 1;
  transition: opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
.phase-exit {
  opacity: 0;
  pointer-events: none;
}

/* ── ЦЕНТРАЛЬНЫЙ БЛОК ── */
.splash-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  position: relative;
  z-index: 2;
}

/* ── ЛОГОТИП ── */
.logo-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  opacity: 0;
  transform: scale(0.6) translateY(12px);
  transition:
    opacity 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.logo-wrap.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.logo-mark {
  width: 80px;
  height: 80px;
  border-radius: 22px; /* squircle */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(69, 174, 107, 0.38);
}
.logo-bg {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: linear-gradient(140deg, #45AE6B, #1E6D38);
}
.logo-clock {
  position: relative;
  z-index: 1;
  width: 44px;
  height: 44px;
}

/* Пульсирующее кольцо при phase=ready */
.logo-ring {
  position: absolute;
  inset: -8px;
  border-radius: 30px;
  border: 2px solid rgba(69, 174, 107, 0);
  transition: border-color 0.3s;
}
.logo-ring.pulse {
  border-color: rgba(69, 174, 107, 0.25);
  animation: ring-pulse 1.4s ease-in-out infinite;
}
@keyframes ring-pulse {
  0%   { transform: scale(1);    opacity: 1; }
  100% { transform: scale(1.18); opacity: 0; }
}

/* ── НАЗВАНИЕ ── */
.brand-name {
  font-family: 'Playfair Display', serif;
  font-weight: 800;
  font-size: 2rem;      /* 32px */
  line-height: 1.2;
  color: var(--t1);
  letter-spacing: -0.02em;
  text-align: center;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.brand-name.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── ПОДЗАГОЛОВОК ── */
.tagline {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--t3);
  text-align: center;
  margin-top: 8px;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.05s,
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.05s;
}
.tagline.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── ПРОГРЕСС ── */
.progress-wrap {
  margin-top: 48px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease 0.1s;
}
.progress-wrap.visible {
  opacity: 1;
}
.progress-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--g);
  animation: dot-bounce 1.1s ease-in-out infinite;
}
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1;   }
}

/* ── ДЕКОРАТИВНЫЕ ВОЛНЫ ── */
.splash-bg-wave {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}
.wave-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(69, 174, 107, 0.07) 0%, transparent 70%);
  bottom: -100px;
  right: -80px;
  animation: wave-float 6s ease-in-out infinite;
}
.wave-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(69, 174, 107, 0.05) 0%, transparent 70%);
  top: -60px;
  left: -60px;
  animation: wave-float 8s ease-in-out infinite reverse;
}
@keyframes wave-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(12px, -16px) scale(1.06); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .logo-wrap, .brand-name, .tagline, .progress-wrap {
    transition-duration: 0.01ms !important;
  }
  .dot, .logo-ring, .wave-1, .wave-2 {
    animation: none !important;
  }
  .logo-wrap  { opacity: 1; transform: none; }
  .brand-name { opacity: 1; transform: none; }
  .tagline    { opacity: 1; transform: none; }
  .progress-wrap { opacity: 1; }
}
</style>