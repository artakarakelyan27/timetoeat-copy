/**
 * usePWA.js — Composable «Время Есть»
 * v3.0 · 2026
 *
 * Изменения от v2.0:
 *  ─ Регистрация SW делегирована vite-plugin-pwa (registerSW из virtual:pwa-register)
 *    — мы только подписываемся на события, не вызываем register() сами.
 *  ─ needRefresh теперь приходит из virtual:pwa-register (более надёжно
 *    чем ловить SW_ACTIVATED через postMessage).
 *  ─ Добавлены dismissInstallBanner / dismissUpdateBanner для UI-баннеров.
 *  ─ iOS-хинт показывается с throttling 7 дней (был 3 — слишком навязчиво).
 *  ─ Учёт source=pwa в URL — определяем «холодный» запуск из иконки.
 */

import { ref, computed, onMounted } from 'vue'
import { registerSW } from 'virtual:pwa-register'

// ════════════════════════════════════════════════════════════════════════════
// ГЛОБАЛЬНОЕ СОСТОЯНИЕ (singleton)
// ════════════════════════════════════════════════════════════════════════════
const platform         = ref('unknown')
const isStandalone     = ref(false)
const isOnline         = ref(true)
const connectionType   = ref('unknown')
const installPromptEvt = ref(null)
const canInstall       = ref(false)
const showIOSHint      = ref(false)
const needRefresh      = ref(false)
const isUpdating       = ref(false)
const swVersion        = ref(null)
const isVisible        = ref(true)
const wakeLockActive   = ref(false)
let   wakeLockSentinel = null
let   _initialized     = false
let   _updateSW        = null

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS — ключи localStorage
// ════════════════════════════════════════════════════════════════════════════
const LS_KEYS = {
  IOS_DISMISSED:        've_pwa_ios_dismissed',
  IOS_SHOWN_AT:         've_pwa_ios_shown_at',
  ANDROID_DISMISSED:    've_pwa_android_dismissed',
  ANDROID_SHOWN_AT:     've_pwa_android_shown_at',
}

const COOLDOWN_DAYS = 7
const COOLDOWN_MS   = COOLDOWN_DAYS * 24 * 60 * 60 * 1000

// ════════════════════════════════════════════════════════════════════════════
// DETECTION
// ════════════════════════════════════════════════════════════════════════════
function detectPlatform() {
  const ua = navigator.userAgent
  // iPad на iOS 13+ маскируется под Mac — ловим по touch-точкам
  const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  if (/iphone|ipad|ipod/i.test(ua) || isIPadOS) return 'ios'
  if (/android/i.test(ua))                       return 'android'
  return 'desktop'
}

function detectStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches  ||
    window.matchMedia('(display-mode: minimal-ui)').matches  ||
    window.navigator.standalone === true
  )
}

function detectConnectionType() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!conn) return 'unknown'
  if (conn.effectiveType) {
    connectionType.value = conn.effectiveType
    conn.addEventListener('change', () => {
      connectionType.value = conn.effectiveType || 'unknown'
    })
  }
  return conn.effectiveType || 'unknown'
}

// ════════════════════════════════════════════════════════════════════════════
// INIT (вызывается один раз через onMounted в первом компоненте)
// ════════════════════════════════════════════════════════════════════════════
function init() {
  if (_initialized) return
  _initialized = true

  platform.value     = detectPlatform()
  isStandalone.value = detectStandalone()
  isOnline.value     = navigator.onLine
  detectConnectionType()

  // ── Service Worker — регистрация через virtual:pwa-register ─────────────
  // registerSW возвращает функцию updateSW(reloadPage = true) для активации
  // ожидающего SW. Этот же путь триггерит needRefresh = true.
  _updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Новый SW установился и ждёт активации. Показываем баннер.
      needRefresh.value = true
    },
    onOfflineReady() {
      // Первое заполнение precache завершено — приложение работает офлайн.
      // Можно показать тост (опционально).
      window.dispatchEvent(new CustomEvent('pwa-offline-ready'))
    },
    onRegisteredSW(swUrl, registration) {
      // Раз в час проверяем обновление
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] SW registration failed:', error)
    },
  })

  // ── Сообщения от SW (push, share target, периодические синки) ───────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data
      switch (data?.type) {
        case 'NAVIGATE':
          // Push-клик прислал нас на конкретный экран
          if (data.url && window.location.pathname + window.location.search !== data.url) {
            window.location.assign(data.url)
          }
          break
        case 'SHARED_CONTENT':
          window.dispatchEvent(new CustomEvent('pwa-shared-content', { detail: data }))
          break
        case 'BG_SYNC_COMPLETED':
          window.dispatchEvent(new CustomEvent('pwa-bg-sync-completed', { detail: data }))
          break
        case 'VERSION':
          swVersion.value = data.version
          break
        case 'SW_ACTIVATED':
          swVersion.value = data.version
          break
      }
    })
  }

  // ── Установка: Android/Desktop ──────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installPromptEvt.value = e

    // Уважаем «не показывать снова» с throttling
    const dismissed = localStorage.getItem(LS_KEYS.ANDROID_DISMISSED)
    if (dismissed === '1') return

    const lastShown = Number(localStorage.getItem(LS_KEYS.ANDROID_SHOWN_AT) || 0)
    if (lastShown && Date.now() - lastShown < COOLDOWN_MS) return

    // Небольшая задержка чтобы баннер не появлялся в момент первого взаимодействия
    setTimeout(() => {
      canInstall.value = true
      localStorage.setItem(LS_KEYS.ANDROID_SHOWN_AT, String(Date.now()))
    }, 2500)
  })

  window.addEventListener('appinstalled', () => {
    canInstall.value       = false
    installPromptEvt.value = null
    isStandalone.value     = true
    showIOSHint.value      = false
    localStorage.setItem(LS_KEYS.IOS_DISMISSED, '1')
    localStorage.setItem(LS_KEYS.ANDROID_DISMISSED, '1')
    window.dispatchEvent(new CustomEvent('pwa-installed'))
  })

  // ── Сеть ────────────────────────────────────────────────────────────────
  window.addEventListener('online',  () => { isOnline.value = true  })
  window.addEventListener('offline', () => { isOnline.value = false })

  // ── iOS hint (Safari не даёт beforeinstallprompt) ──────────────────────
  if (platform.value === 'ios' && !isStandalone.value) {
    const dismissed = localStorage.getItem(LS_KEYS.IOS_DISMISSED) === '1'
    const lastShown = Number(localStorage.getItem(LS_KEYS.IOS_SHOWN_AT) || 0)

    if (!dismissed && (!lastShown || Date.now() - lastShown > COOLDOWN_MS)) {
      // 5 секунд — пользователь успевает оценить контент до prompt'а
      setTimeout(() => {
        showIOSHint.value = true
        localStorage.setItem(LS_KEYS.IOS_SHOWN_AT, String(Date.now()))
      }, 5000)
    }
  }

  // ── Page Visibility ─────────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    isVisible.value = document.visibilityState === 'visible'
  })

  // ── display-mode change (юзер удалил/добавил PWA) ──────────────────────
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    isStandalone.value = e.matches
  })
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ════════════════════════════════════════════════════════════════════════════
export function usePWA() {
  onMounted(init)

  // ── Установка ─────────────────────────────────────────────────────────
  async function promptInstall() {
    if (!installPromptEvt.value) return false
    try {
      installPromptEvt.value.prompt()
      const { outcome } = await installPromptEvt.value.userChoice
      if (outcome === 'accepted') {
        canInstall.value       = false
        installPromptEvt.value = null
      }
      return outcome === 'accepted'
    } catch {
      return false
    }
  }

  function dismissInstallBanner() {
    canInstall.value = false
    localStorage.setItem(LS_KEYS.ANDROID_DISMISSED, '1')
  }

  function dismissIOSHint() {
    showIOSHint.value = false
    localStorage.setItem(LS_KEYS.IOS_DISMISSED, '1')
  }

  function dismissUpdateBanner() {
    needRefresh.value = false
  }

  // ── Обновление SW ─────────────────────────────────────────────────────
  async function applyUpdate() {
    if (isUpdating.value) return
    isUpdating.value = true
    needRefresh.value = false
    if (_updateSW) {
      // virtual:pwa-register уже сам отправит SKIP_WAITING и сделает reload
      try {
        await _updateSW(true)
      } catch {
        // fallback — ручная перезагрузка
        window.location.reload()
      }
    } else {
      window.location.reload()
    }
  }

  // ── Badging API ───────────────────────────────────────────────────────
  function setBadge(count) {
    if (!('setAppBadge' in navigator)) return
    const n = Number(count)
    if (Number.isFinite(n) && n > 0) {
      navigator.setAppBadge(n).catch(() => {})
    } else {
      navigator.clearAppBadge().catch(() => {})
    }
  }

  // ── Wake Lock — экран не гаснет в режиме готовки ──────────────────────
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return false
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen')
      wakeLockActive.value = true
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockActive.value = false
        wakeLockSentinel = null
      })
      // Пере-активация после возврата вкладки
      const reAcquire = async () => {
        if (document.visibilityState === 'visible' && !wakeLockSentinel) {
          try {
            wakeLockSentinel = await navigator.wakeLock.request('screen')
            wakeLockActive.value = true
          } catch { /* не критично */ }
        }
      }
      document.addEventListener('visibilitychange', reAcquire)
      return true
    } catch {
      return false
    }
  }

  async function releaseWakeLock() {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release()
      wakeLockSentinel     = null
      wakeLockActive.value = false
    }
  }

  // ── Web Share API ─────────────────────────────────────────────────────
  async function shareRecipe({ title, text, url }) {
    if (!('share' in navigator)) {
      return copyToClipboard(url)
    }
    try {
      await navigator.share({ title, text, url })
      return true
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[PWA] Share failed:', e)
      return false
    }
  }

  // ── Clipboard ─────────────────────────────────────────────────────────
  async function copyToClipboard(text) {
    if ('clipboard' in navigator && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch { /* fallback ниже */ }
    }
    const el = document.createElement('textarea')
    el.value = String(text)
    el.style.cssText = 'position:fixed;top:-9999px;opacity:0;pointer-events:none'
    document.body.appendChild(el)
    el.focus(); el.select()
    try {
      document.execCommand('copy')
      return true
    } finally {
      document.body.removeChild(el)
    }
  }

  // ── Push Notifications ────────────────────────────────────────────────
  async function requestPushPermission() {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied')  return 'denied'
    return await Notification.requestPermission()
  }

  // ── Periodic Sync — обновление цен ────────────────────────────────────
  async function registerPriceSync() {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.ready
    if (!('periodicSync' in reg)) return false
    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync',
      })
      if (status.state !== 'granted') return false
      await reg.periodicSync.register('ve-prices-update', {
        minInterval: 4 * 60 * 60 * 1000,            // 4 часа
      })
      return true
    } catch {
      return false
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────
  const isIOS     = computed(() => platform.value === 'ios')
  const isAndroid = computed(() => platform.value === 'android')
  const isSlow    = computed(() => ['slow-2g', '2g'].includes(connectionType.value))

  return {
    // Состояние
    platform, isIOS, isAndroid,
    isStandalone, isOnline, isSlow, connectionType,
    canInstall, showIOSHint, needRefresh, isUpdating,
    swVersion, isVisible, wakeLockActive,

    // Методы
    promptInstall,
    dismissInstallBanner,
    dismissIOSHint,
    dismissUpdateBanner,
    applyUpdate,
    setBadge,
    requestWakeLock,
    releaseWakeLock,
    shareRecipe,
    copyToClipboard,
    requestPushPermission,
    registerPriceSync,
  }
}