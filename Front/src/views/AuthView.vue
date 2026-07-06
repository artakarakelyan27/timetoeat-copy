<script setup>
/**
 * AuthView.vue — экран /auth
 *
 * v2.0 — РЕДИЗАЙН ПО БРЕНДБУКУ «Время Есть» v1.0
 *
 * Что изменилось:
 *  ✓ FIX-AUTH-A1 — типографика: Playfair Display 800 для заголовков,
 *                   DM Sans 400/500/700 для UI и тела текста
 *  ✓ FIX-AUTH-A2 — цветовая палитра: только зелёная брендовая (--g, --gd, --gp,
 *                   --gpp), бордеры и тени строго из tokens.css
 *  ✓ FIX-AUTH-A3 — добавлены декоративные blob'ы как на welcome-экране
 *                   (визуальная связь с онбордингом)
 *  ✓ FIX-AUTH-A4 — touch targets ≥ 44px по Apple HIG (брендбук стр. 18)
 *  ✓ FIX-AUTH-A5 — focus-visible: 3px solid --g, outline-offset: 2px
 *                   (WCAG 2.1 AA — критерий 2.4.7)
 *  ✓ FIX-AUTH-A6 — тон голоса: «ты» вместо «вы» (брендбук стр. 19, 22)
 *  ✓ FIX-AUTH-A7 — заменили битую кнопку «Пропустить → /menu» на «← На главную»
 *                   (раньше она вела на защищённый роут и сразу же
 *                    редиректилась обратно на онбординг)
 *  ✓ FIX-AUTH-A8 — добавлены Apple ID / Google login кнопки (заглушки)
 *                   для согласованности с reg-sheet в онбординге
 *  ✓ FIX-AUTH-A9 — автофокус на первое поле
 *  ✓ FIX-AUTH-A10 — корректные `autocomplete`-атрибуты (email/current-password
 *                   для login, new-password для register)
 *  ✓ FIX-AUTH-A11 — prefers-reduced-motion поддержка
 *
 * Логика авторизации не менялась.
 */
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const mode     = ref(route.query.mode === 'register' ? 'register' : 'login')
const email    = ref('')
const password = ref('')
const name     = ref('')
const error    = ref('')
const loading  = ref(false)

const emailField = ref(null)
const nameField  = ref(null)

const isLogin = computed(() => mode.value === 'login')

function focusFirst() {
  // В режиме регистрации первое поле — имя; в режиме входа — email
  if (mode.value === 'register' && nameField.value) {
    nameField.value.focus()
  } else if (emailField.value) {
    emailField.value.focus()
  }
}

function toggleMode() {
  mode.value = isLogin.value ? 'register' : 'login'
  error.value = ''
  nextTick(focusFirst)
}

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(email.value, password.value)
    } else {
      await auth.register(email.value, password.value, name.value || 'Пользователь')
    }
    router.push('/menu')
  } catch (e) {
    const msg = e?.message || ''
    if (msg.includes('fetch') || msg.includes('Failed')) {
      error.value = 'Нет связи с сервером. Проверь интернет и попробуй снова.'
    } else {
      error.value = msg || 'Что-то пошло не так. Попробуй ещё раз.'
    }
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.push('/')
}

function notImplemented() {
  error.value = 'Этот способ входа пока в разработке. Используй email.'
}

onMounted(() => {
  nextTick(focusFirst)
})
</script>

<template>
  <div class="auth-view">
    <!-- Декоративные блоб-формы как на welcome-экране онбординга -->
    <div class="auth-blob auth-blob-1" aria-hidden="true"></div>
    <div class="auth-blob auth-blob-2" aria-hidden="true"></div>

    <!-- Кнопка «На главную» — заменяет битую "Пропустить → /menu" -->
    <button class="auth-back" @click="goHome" aria-label="На главную">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span>На главную</span>
    </button>

    <main class="auth-card" role="main">
      <!-- Логотип -->
      <header class="auth-logo">
        <div class="logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
        </div>
        <span class="logo-text">Время Есть</span>
      </header>

      <!-- Заголовок и подзаголовок -->
      <div class="auth-intro">
        <span class="auth-eyebrow">{{ isLogin ? 'Вход' : 'Регистрация' }}</span>
        <h1 class="auth-title">
          {{ isLogin ? 'С возвращением!' : 'Создаём аккаунт' }}
        </h1>
        <p class="auth-sub">
          {{ isLogin
            ? 'Войди, чтобы продолжить с того же места'
            : 'Минута — и меню недели всегда под рукой' }}
        </p>
      </div>

      <!-- SSO-заглушки (визуально согласованы с онбордингом) -->
      <div class="auth-sso">
        <button type="button" class="btn-sso btn-sso-apple" @click="notImplemented">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.38.77 3.2.73.97-.05 2.08-.86 3.73-.74 1.31.1 2.43.66 3.19 1.73-2.92 1.68-2.44 5.81.24 6.82-.54 1.48-1.18 2.87-2.36 4.32zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span>{{ isLogin ? 'Войти через Apple' : 'Регистрация через Apple' }}</span>
        </button>
        <button type="button" class="btn-sso btn-sso-google" @click="notImplemented">
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{{ isLogin ? 'Войти через Google' : 'Регистрация через Google' }}</span>
        </button>
      </div>

      <div class="auth-divider"><span>или email</span></div>

      <!-- Форма -->
      <form @submit.prevent="submit" class="auth-form" novalidate>
        <div v-if="!isLogin" class="auth-field">
          <label for="auth-name" class="auth-label">Имя</label>
          <input
            id="auth-name"
            ref="nameField"
            v-model="name"
            type="text"
            class="auth-input"
            placeholder="Как тебя зовут?"
            autocomplete="given-name"
            maxlength="40"
          />
        </div>

        <div class="auth-field">
          <label for="auth-email" class="auth-label">Email</label>
          <input
            id="auth-email"
            ref="emailField"
            v-model="email"
            type="email"
            class="auth-input"
            placeholder="you@example.com"
            autocomplete="email"
            inputmode="email"
            required
          />
        </div>

        <div class="auth-field">
          <label for="auth-password" class="auth-label">Пароль</label>
          <input
            id="auth-password"
            v-model="password"
            type="password"
            class="auth-input"
            placeholder="Минимум 6 символов"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            required
            minlength="6"
          />
        </div>

        <div v-if="error" class="auth-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="btn-cta" :disabled="loading">
          <span v-if="loading">Подождите...</span>
          <template v-else>
            <span>{{ isLogin ? 'Войти' : 'Создать аккаунт' }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </template>
        </button>
      </form>

      <!-- Переключение режима -->
      <p class="auth-switch">
        {{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
        <button type="button" @click="toggleMode" class="auth-switch-btn">
          {{ isLogin ? 'Зарегистрироваться' : 'Войти' }}
        </button>
      </p>

      <p class="auth-fine">
        Нажимая «{{ isLogin ? 'Войти' : 'Создать аккаунт' }}», ты соглашаешься
        с условиями использования и политикой конфиденциальности.
      </p>
    </main>
  </div>
</template>

<style scoped>
/* ==========================================================================
   AuthView v2.1 — соответствие брендбуку «Время Есть» v1.0

   v2.1 изменения по брендбуку:
   ✓ FIX-AUTH-B1 — убран бордер с .auth-card: брендбук стр. 10 явно говорит
                    «тени предпочитаются обводкам». Раньше карточка имела
                    одновременно border 1px и shadow var(--sh3) — двойное
                    разделение, не соответствует системе глубины.
   ✓ FIX-AUTH-B2 — радиус .btn-sso приведён к 15px (брендбук стр. 11 — кнопки).
                    Было 14px — мелкая, но видимая рассинхронность с CTA.
   ✓ FIX-AUTH-B3 — добавлен eyebrow-лейбл «Вход» / «Регистрация»: единый
                    паттерн заголовка с шагами онбординга (.step-eyebrow).
   ✓ FIX-AUTH-B4 — увеличен focus-ring на инпутах с 1.5px до 2px (брендбук
                    стр. 12: «бордер 1.5px transparent → #45AE6B при фокусе»,
                    но 2px при фокусе даёт лучший a11y-сигнал).
   ✓ FIX-AUTH-B5 — Apple SSO остался #1A1A1A — это не нарушение палитры,
                    а требование Apple HIG (sign-in with Apple branding rules).
                    Добавлен комментарий чтобы будущие правщики не «исправляли».
   ========================================================================== */

.auth-view {
  position: relative;
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom)) 16px;
  overflow: hidden;
}

/* Декоративные blob'ы — визуальная связь с welcome-экраном онбординга */
.auth-blob {
  position: absolute;
  border-radius: 50%;
  background: rgba(69, 174, 107, 0.09);
  pointer-events: none;
  filter: blur(40px);
}
.auth-blob-1 {
  width: 320px; height: 320px;
  top: -120px; right: -100px;
}
.auth-blob-2 {
  width: 280px; height: 280px;
  bottom: -100px; left: -90px;
  background: rgba(127, 212, 160, 0.10);
}

/* Кнопка «На главную» в верхнем левом углу */
.auth-back {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top));
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px 0 10px;
  border-radius: 22px;
  background: var(--surf);
  border: 1px solid var(--bdr);
  color: var(--t2);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s var(--ease-out, ease), transform 0.15s var(--ease-out, ease);
  box-shadow: var(--sh1);
  z-index: 2;
}
.auth-back:hover { background: var(--gp); color: var(--gd); transform: translateY(-1px); }
.auth-back:active { transform: translateY(0); }
.auth-back:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}

/* Карточка — FIX-AUTH-B1: только тень, без бордера (брендбук стр. 10) */
.auth-card {
  position: relative;
  z-index: 1;
  background: var(--surf);
  border-radius: 24px;
  padding: 28px 22px calc(20px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 420px;
  box-shadow: var(--sh3);
  margin-top: 56px; /* отступ под фиксированную auth-back */
}

/* Логотип */
.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.logo-mark {
  width: 44px;
  height: 44px;
  background: linear-gradient(140deg, var(--g), var(--gd));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sh-logo);
  flex-shrink: 0;
}
.logo-text {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--t1);
  letter-spacing: -0.01em;
}

/* Заголовок */
.auth-intro { margin-bottom: 20px; }

/* FIX-AUTH-B3: eyebrow по паттерну onboarding step-eyebrow */
.auth-eyebrow {
  display: inline-block;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gd);
  margin-bottom: 6px;
}

.auth-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.7rem, 5.5vw, 2.1rem);
  font-weight: 800;
  color: var(--t1);
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0 0 6px 0;
}
.auth-sub {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--t2);
  line-height: 1.5;
  margin: 0;
}

/* SSO-кнопки */
.auth-sso {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
/* FIX-AUTH-B2: радиус 15px (брендбук, секция кнопок) */
.btn-sso {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  padding: 0 16px;
  border-radius: 15px;
  border: 1.5px solid var(--gpp);
  background: var(--surf);
  color: var(--t1);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s var(--ease-out, ease), transform 0.15s var(--ease-out, ease), border-color 0.2s var(--ease-out, ease);
  width: 100%;
}
.btn-sso:hover { background: var(--gp); border-color: var(--g); transform: translateY(-1px); }
.btn-sso:active { transform: translateY(0); }
.btn-sso:focus-visible { outline: 3px solid var(--g); outline-offset: 2px; }

/* FIX-AUTH-B5: Apple Sign-in требует чёрный фон по Apple HIG.
   Это не нарушение палитры — это бренд-требование Apple. Не править. */
.btn-sso-apple {
  background: #1A1A1A;
  color: #fff;
  border-color: #1A1A1A;
}
.btn-sso-apple:hover { background: #000; border-color: #000; }

/* Разделитель */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 14px;
  color: var(--t3);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bdr);
}

/* Форма */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.auth-label {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--t2);
  letter-spacing: 0.02em;
}
/* FIX-AUTH-B4: focus-border 2px (мощнее a11y-сигнал) */
.auth-input {
  height: 48px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: var(--surf2);
  padding: 0 14px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 1rem;
  color: var(--t1);
  outline: none;
  transition: border-color 0.2s var(--ease-out, ease), background 0.2s var(--ease-out, ease);
  width: 100%;
}
.auth-input::placeholder { color: var(--t-dis); }
.auth-input:hover { border-color: var(--bdr2); }
.auth-input:focus,
.auth-input:focus-visible {
  border: 2px solid var(--g);
  background: var(--surf);
  outline: none;
}

/* Ошибка */
.auth-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--coralp);
  color: var(--coral-text-emphasis, var(--coral));
  border: 1px solid var(--coral-border, var(--coral));
  border-radius: 12px;
  padding: 10px 12px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.4;
  margin-top: 4px;
}
.auth-error svg {
  flex-shrink: 0;
  margin-top: 2px;
}

/* CTA-кнопка — точно по брендбуку (стр. 11) */
.btn-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 50px;
  border-radius: 15px;
  background: linear-gradient(140deg, var(--g), var(--gd));
  color: #fff;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: var(--sh-cta);
  transition: transform 0.2s var(--ease-out, ease), box-shadow 0.2s var(--ease-out, ease);
  margin-top: 8px;
  width: 100%;
}
.btn-cta:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(69, 174, 107, 0.48);
}
.btn-cta:active:not(:disabled) { transform: translateY(0); }
.btn-cta:focus-visible { outline: 3px solid var(--g); outline-offset: 3px; }
.btn-cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

/* Переключение режима */
.auth-switch {
  text-align: center;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.9rem;
  color: var(--t3);
  margin: 18px 0 0 0;
  font-weight: 500;
}
.auth-switch-btn {
  color: var(--gd);
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  margin-left: 2px;
  font-size: inherit;
  font-family: inherit;
  border-radius: 6px;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s var(--ease-out, ease);
}
.auth-switch-btn:hover { text-decoration-color: var(--gd); }
.auth-switch-btn:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
  text-decoration-color: transparent;
}

/* Юр. сноска */
.auth-fine {
  text-align: center;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.74rem;
  color: var(--t3);
  margin: 14px 0 0 0;
  line-height: 1.5;
  font-weight: 400;
}

/* Reduced motion (брендбук стр. 16, WCAG 2.3.3) */
@media (prefers-reduced-motion: reduce) {
  .auth-back, .btn-sso, .btn-cta, .auth-input {
    transition: none;
  }
  .btn-cta:hover, .btn-sso:hover, .auth-back:hover {
    transform: none;
  }
}

/* Узкие экраны */
@media (max-width: 380px) {
  .auth-card {
    padding: 22px 18px calc(18px + env(safe-area-inset-bottom));
    border-radius: 20px;
  }
  .auth-back span { display: none; }
  .auth-back {
    width: 44px;
    padding: 0;
    justify-content: center;
  }
}
</style>