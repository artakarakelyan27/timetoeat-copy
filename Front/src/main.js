import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAnalytics, EVENT } from './composables/useAnalytics'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// ── PostHog (опционально, активируется если задан VITE_POSTHOG_KEY) ──
if (import.meta.env.VITE_POSTHOG_KEY) {
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.posthog.com',
      capture_pageview: false, // мы трекаем page_view сами через router
      autocapture: false,
    })
    window.posthog = posthog
  })
}

// ── Yandex Metrika ID (counter-snippet — в index.html) ──
if (import.meta.env.VITE_YM_ID) {
  window.__YM_ID__ = Number(import.meta.env.VITE_YM_ID)
}

// ── Системные события ──
const { track } = useAnalytics()

router.afterEach((to, from) => {
  const safePath = to.path
  track(EVENT.PAGE_VIEW, {
    route: safePath,
    name: to.name,
    fromRoute: from.path,
  })
  window.posthog?.capture?.('$pageview', { $current_url: safePath })
  window.ym?.(window.__YM_ID__, 'hit', safePath)
})

if (!window.__VE_SESSION_TRACKED__) {
  window.__VE_SESSION_TRACKED__ = true
  track(EVENT.SESSION_START, {
    platform: 'web',
    isPWA: window.matchMedia('(display-mode: standalone)').matches,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    hasToken: !!localStorage.getItem('token'),
  })
  window.ym?.(window.__YM_ID__, 'userParams', {
    isPWA: window.matchMedia('(display-mode: standalone)').matches,
    hasToken: !!localStorage.getItem('token'),
    anonId: localStorage.getItem('ve_anon_id'),
  })
  window.ym?.(window.__YM_ID__, 'setUserID', localStorage.getItem('ve_anon_id'))
}

let lastHidden = null
document.addEventListener('visibilitychange', () => {
  if (document.hidden) lastHidden = Date.now()
  else if (lastHidden) {
    track(EVENT.APP_FOREGROUND, { awayMs: Date.now() - lastHidden })
    lastHidden = null
  }
})

app.config.errorHandler = (err, instance, info) => {
  console.error(err)
  track(EVENT.APP_ERROR, {
    message: String(err?.message || err).slice(0, 500),
    component: instance?.$options?.name || 'unknown',
    info,
  })
}

app.mount('#app')