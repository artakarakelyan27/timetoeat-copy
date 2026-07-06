<!--
  InstallPrompt.vue — Add to Home Screen / Update banner
  «Время Есть» v3.0 · 2026

  Три состояния:
    1. needRefresh = true     → синий баннер «Доступно обновление»
    2. canInstall = true (Android/Desktop) → зелёный баннер «Установить»
    3. isIOS && showIOSHint   → bottom-sheet с инструкцией Share → Home Screen

  Все состояния взаимоисключающие — приоритет: update > install > iOS hint.
  Баннеры респектят safe-area, prefers-reduced-motion, имеют корректный a11y.

  Зависимости:
    @/composables/usePWA  (источник состояния и методов)
    @/styles/pwa.css       (transitions ve-slide-up, ve-sheet-up — глобально)
-->

<script setup>
import { computed } from 'vue'
import { usePWA } from '@/composables/usePWA'

const {
  isIOS,
  isStandalone,
  canInstall,
  needRefresh,
  showIOSHint,
  promptInstall,
  dismissIOSHint,
  applyUpdate,
  dismissInstallBanner,
  dismissUpdateBanner,
} = usePWA()

// Только один баннер за раз. update имеет наивысший приоритет.
const showUpdateBanner = computed(() => needRefresh.value)
const showInstallBanner = computed(
  () => canInstall.value && !isStandalone.value && !needRefresh.value
)
const showIOSSheet = computed(
  () =>
    isIOS.value &&
    showIOSHint.value &&
    !isStandalone.value &&
    !needRefresh.value
)
</script>

<template>
  <Teleport to="body">
    <!-- ═══════════════════════════════════════════════════════════════
         1. UPDATE BANNER — новая версия SW активирована
         ═══════════════════════════════════════════════════════════════ -->
    <Transition name="ve-slide-up">
      <div
        v-if="showUpdateBanner"
        class="ve-banner ve-banner--update"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="ve-banner__icon ve-banner__icon--green" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2v6h-6"/>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
            <path d="M3 22v-6h6"/>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
        </div>
        <div class="ve-banner__body">
          <p class="ve-banner__title">Доступно обновление</p>
          <p class="ve-banner__sub">Новая версия готова к установке</p>
        </div>
        <button
          class="ve-banner__cta"
          type="button"
          @click="applyUpdate"
        >
          Обновить
        </button>
        <button
          class="ve-banner__close"
          type="button"
          aria-label="Закрыть уведомление об обновлении"
          @click="dismissUpdateBanner"
        >
          <svg viewBox="0 0 24 24" width="14" height="14"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- ═══════════════════════════════════════════════════════════════
         2. INSTALL BANNER — Android/Desktop с beforeinstallprompt
         ═══════════════════════════════════════════════════════════════ -->
    <Transition name="ve-slide-up">
      <div
        v-if="showInstallBanner"
        class="ve-banner ve-banner--install"
        role="complementary"
        aria-label="Установить приложение"
      >
        <div class="ve-banner__app-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22"
               fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="ve-banner__body">
          <p class="ve-banner__title">Время Есть</p>
          <p class="ve-banner__sub">Установи — работает офлайн</p>
        </div>
        <button
          class="ve-banner__cta"
          type="button"
          @click="promptInstall"
        >
          Установить
        </button>
        <button
          class="ve-banner__close"
          type="button"
          aria-label="Закрыть предложение установки"
          @click="dismissInstallBanner"
        >
          <svg viewBox="0 0 24 24" width="14" height="14"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- ═══════════════════════════════════════════════════════════════
         3. iOS SAFARI BOTTOM SHEET — A2HS инструкция
         iOS не даёт beforeinstallprompt. Единственный путь — Share → Home.
         ═══════════════════════════════════════════════════════════════ -->
    <Transition name="ve-sheet-up">
      <div
        v-if="showIOSSheet"
        class="ve-backdrop"
        role="presentation"
        @click.self="dismissIOSHint"
      >
        <div
          class="ve-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ve-ios-sheet-title"
          aria-describedby="ve-ios-sheet-desc"
        >
          <div class="ve-sheet__handle" aria-hidden="true"></div>

          <div class="ve-sheet__header">
            <div class="ve-sheet__app-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26"
                   fill="none" stroke="white" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="ve-sheet__heading">
              <h2 id="ve-ios-sheet-title">Установи «Время Есть»</h2>
              <p id="ve-ios-sheet-desc">Будет на главном экране, как обычное приложение</p>
            </div>
            <button
              class="ve-sheet__close"
              type="button"
              aria-label="Закрыть"
              @click="dismissIOSHint"
            >
              <svg viewBox="0 0 24 24" width="14" height="14"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <ol class="ve-steps">
            <li class="ve-step">
              <span class="ve-step__num">1</span>
              <div class="ve-step__body">
                <p class="ve-step__text">
                  Нажми
                  <span class="ve-share-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                  </span>
                  «Поделиться» внизу экрана Safari
                </p>
              </div>
            </li>

            <li class="ve-step">
              <span class="ve-step__num">2</span>
              <div class="ve-step__body">
                <p class="ve-step__text">
                  Выбери «На экран «Домой»»
                  <span class="ve-plus-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="4" ry="4"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  </span>
                </p>
              </div>
            </li>

            <li class="ve-step">
              <span class="ve-step__num">3</span>
              <div class="ve-step__body">
                <p class="ve-step__text">
                  Нажми «Добавить» в правом верхнем углу — готово!
                </p>
              </div>
            </li>
          </ol>

          <button
            class="ve-sheet__primary"
            type="button"
            @click="dismissIOSHint"
          >
            Понятно
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Базовый banner ─────────────────────────────────────────────────────── */
.ve-banner {
  position: fixed;
  left: var(--sp-md);
  right: var(--sp-md);
  bottom: calc(var(--nav-total-h, 60px) + var(--sp-md));
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-md);
  padding-left: calc(var(--sp-md) + var(--sal));
  padding-right: calc(var(--sp-md) + var(--sar));
  background: var(--surf);
  border: 1px solid var(--bdr);
  border-radius: 16px;
  box-shadow: var(--sh3);
  z-index: 1000;
  max-width: 440px;
  margin-inline: auto;
}

@supports (padding: max(0px)) {
  .ve-banner {
    bottom: max(var(--nav-total-h, 60px), env(safe-area-inset-bottom)) + var(--sp-md);
  }
}

.ve-banner--update {
  border-color: var(--bdr2);
}

.ve-banner__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ve-banner__icon--green {
  background: var(--gp);
  color: var(--gd);
}

.ve-banner__app-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: linear-gradient(140deg, var(--g), var(--gd));
  box-shadow: var(--sh-logo);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ve-banner__body {
  flex: 1;
  min-width: 0;
}

.ve-banner__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--t1);
  margin: 0 0 2px;
  line-height: 1.3;
}

.ve-banner__sub {
  font-size: 12px;
  color: var(--t3);
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ve-banner__cta {
  flex-shrink: 0;
  background: linear-gradient(140deg, var(--g), var(--gd));
  color: white;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 16px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  box-shadow: var(--sh-cta);
  min-height: var(--touch);
  min-width: 88px;
  font-family: inherit;
  transition: transform 0.15s var(--ease-spring),
              box-shadow 0.15s var(--ease-out);
}

.ve-banner__cta:hover { transform: translateY(-1px); }
.ve-banner__cta:active { transform: scale(0.97); }
.ve-banner__cta:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}

.ve-banner__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surf2);
  color: var(--t3);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
  flex-shrink: 0;
  /* touch target расширяем «прозрачным» padding'ом через ::before */
  position: relative;
}

.ve-banner__close::before {
  content: '';
  position: absolute;
  inset: -6px;          /* 32 + 12 = 44px touch target */
}

.ve-banner__close:hover { background: var(--gpp); color: var(--t1); }


/* ─── iOS Bottom Sheet ──────────────────────────────────────────────────── */
.ve-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 46, 34, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.ve-sheet {
  background: var(--surf);
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 480px;
  padding: var(--sp-sm) var(--sp-xl) calc(var(--sp-xl) + var(--sab));
  box-shadow: var(--sh3);
  animation: ve-sheet-rise 0.42s var(--ease-spring);
}

@keyframes ve-sheet-rise {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.ve-sheet__handle {
  width: 36px;
  height: 5px;
  border-radius: 3px;
  background: var(--t-dis);
  margin: 6px auto 16px;
}

.ve-sheet__header {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  margin-bottom: var(--sp-xl);
}

.ve-sheet__app-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(140deg, var(--g), var(--gd));
  box-shadow: var(--sh-logo);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ve-sheet__heading {
  flex: 1;
  min-width: 0;
}

.ve-sheet__heading h2 {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 800;
  color: var(--t1);
  margin: 0 0 4px;
  line-height: 1.2;
}

.ve-sheet__heading p {
  font-size: 13px;
  color: var(--t3);
  margin: 0;
  line-height: 1.4;
}

.ve-sheet__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surf2);
  color: var(--t3);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.ve-sheet__close::before {
  content: '';
  position: absolute;
  inset: -6px;
}


/* ─── Steps ─────────────────────────────────────────────────────────────── */
.ve-steps {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--sp-xl);
}

.ve-step {
  display: flex;
  gap: var(--sp-md);
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--bdr);
}

.ve-step:last-child {
  border-bottom: 0;
}

.ve-step__num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--gp);
  color: var(--gd);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ve-step__body {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.ve-step__text {
  font-size: 15px;
  color: var(--t1);
  margin: 0;
  line-height: 1.45;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.ve-share-icon,
.ve-plus-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--bluep);
  color: var(--ios-system-blue);
  vertical-align: middle;
}

.ve-plus-icon {
  background: var(--surf2);
  color: var(--t1);
}


/* ─── Primary action ─────────────────────────────────────────────────────── */
.ve-sheet__primary {
  width: 100%;
  padding: 16px;
  background: linear-gradient(140deg, var(--g), var(--gd));
  color: white;
  font-size: 15px;
  font-weight: 700;
  border-radius: 14px;
  border: 0;
  cursor: pointer;
  box-shadow: var(--sh-cta);
  font-family: inherit;
  min-height: 48px;
  transition: transform 0.15s var(--ease-spring);
}

.ve-sheet__primary:active {
  transform: scale(0.98);
}

.ve-sheet__primary:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}


/* ─── Reduced motion ─────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ve-sheet { animation: none; }
  .ve-banner__cta:hover,
  .ve-banner__cta:active,
  .ve-sheet__primary:active { transform: none; }
}
</style>