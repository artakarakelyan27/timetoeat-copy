/**
 * sw.js — Service Worker «Время Есть»
 * v3.0 · 2026 · Workbox + injectManifest
 *
 * Этот файл компилируется vite-plugin-pwa в режиме `injectManifest`:
 *  ─ self.__WB_MANIFEST подставляется автоматически (precache с ревизиями).
 *  ─ Импорты из workbox-* tree-shake'ятся в финальный бандл.
 *  ─ Старая ручная замена __BUILD_HASH__ больше не нужна — Workbox
 *    сам управляет версиями.
 *
 * Сохранены кастомные обработчики:
 *  ─ Push notifications (8 триггеров из ТЗ)
 *  ─ Notification click → deep-link в приложение
 *  ─ Share Target API (recipe.com → «Время Есть»)
 *  ─ Background Sync (offline-список покупок)
 *  ─ Periodic Background Sync (обновление цен раз в 4 часа)
 *  ─ Offline fallback (минимальная HTML-заглушка)
 *
 * Стратегии кеширования:
 *  ─ App Shell (HTML/JS/CSS):    Workbox precache (CacheFirst с auto-update)
 *  ─ Google Fonts CSS:           StaleWhileRevalidate
 *  ─ Google Fonts woff2:         CacheFirst, TTL 1 год
 *  ─ Изображения рецептов:       CacheFirst, TTL 30 дней, max 200 файлов
 *  ─ /api/recipes (read):        StaleWhileRevalidate, TTL 1 день
 *  ─ /api/prices (read):         NetworkFirst, timeout 4s, fallback на кеш
 *  ─ /api/* (write — POST):      Background Sync queue
 *  ─ Навигация (HTML SPA):       NetworkFirst → fallback на precache index
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. WORKBOX IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  NetworkOnly,
} from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { clientsClaim } from 'workbox-core'

// ═══════════════════════════════════════════════════════════════════════════
// 2. ВЕРСИЯ И ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

const SW_VERSION = '3.0.0'

// skipWaiting вызываем по запросу из приложения — пользователь сам решает,
// когда применить обновление (нажатие кнопки «Обновить» в баннере).
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// При активации забираем контроль над всеми вкладками без перезагрузки.
clientsClaim()

// ═══════════════════════════════════════════════════════════════════════════
// 3. PRECACHE — APP SHELL
// ═══════════════════════════════════════════════════════════════════════════
// Vite-plugin-pwa подставляет сюда все статические ассеты с ревизиями.
// При новой сборке Workbox умно скачивает только изменённые файлы.

precacheAndRoute(self.__WB_MANIFEST || [])

// Удаляем precache от предыдущих версий
cleanupOutdatedCaches()

// ═══════════════════════════════════════════════════════════════════════════
// 4. SPA NAVIGATION ROUTE
// ═══════════════════════════════════════════════════════════════════════════
// Любой навигационный запрос (что-то типа /menu, /recipes/123) обслуживается
// из precache index.html — клиентский роутинг разберётся сам.
// Workbox сам отдаст precached index.html (с ревизионным хешем) — это и есть
// настоящий offline App Shell.

const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(navigationHandler, {
    // Не перехватываем системные/служебные пути (они должны идти через сеть)
    denylist: [
      /^\/api\//,
      /^\/share-target/,
      /^\/auth\/callback/,
      /^\/_/,
      /\.[a-z0-9]+$/i,
      // ↓↓↓ ДОБАВЬ ВОТ ЭТИ СТРОКИ — SEO-префиксы Nuxt-зоны
      /^\/recepty(\/|$)/,
      /^\/iz(\/|$)/,
      /^\/iz-ostatkov(\/|$)/,
      /^\/chto-prigotovit(\/|$)/,
      /^\/menyu-na-nedelyu(\/|$)/,
      /^\/spravochnik(\/|$)/,
      /^\/kak-gotovit(\/|$)/,
      /^\/sezon(\/|$)/,
      /^\/gotovim-vprok(\/|$)/,
      /^\/blog(\/|$)/,
      /^\/o-proekte(\/|$)/,
      /^\/og\//,
      /^\/sitemap\.xml$/,
      /^\/robots\.txt$/,
    ],
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// 5. GOOGLE FONTS
// ═══════════════════════════════════════════════════════════════════════════
// CSS-файл может меняться (varied weights / subsets) — SWR.
// Сами woff2-файлы версионируются в URL — кешируем агрессивно на год.

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 've-google-fonts-css',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 've-google-fonts-files',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60,           // 1 год
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// 6. ИЗОБРАЖЕНИЯ РЕЦЕПТОВ
// ═══════════════════════════════════════════════════════════════════════════
// CDN: images.vremya-est.ru (Cloudflare R2). Пути с расширениями.
// Большие файлы — поэтому quotaError выбрасывает старые автоматически.

registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    (url.hostname === 'images.vremya-est.ru' ||
      url.hostname.endsWith('.r2.cloudflarestorage.com') ||
      url.hostname.endsWith('.cloudflare.com')),
  new CacheFirst({
    cacheName: 've-recipe-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,                              // ~200 рецептов в кеше
        maxAgeSeconds: 30 * 24 * 60 * 60,             // 30 дней
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Локальные изображения из /public (логотипы, иконки приёмов пищи)
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    url.origin === self.location.origin,
  new StaleWhileRevalidate({
    cacheName: 've-static-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// 7. API — РЕЦЕПТЫ
// ═══════════════════════════════════════════════════════════════════════════
// Рецепты редко меняются (CMS-контент). SWR — даём пользователю мгновенный
// ответ из кеша, в фоне обновляем.

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/api/recipes') &&
    request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 've-api-recipes',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,                  // 1 день
      }),
    ],
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// 8. API — ЦЕНЫ
// ═══════════════════════════════════════════════════════════════════════════
// Цены меняются каждые 4 часа. NetworkFirst с таймаутом 4s — даём свежее,
// но если сеть тупит — сразу падаем на последний кеш.

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/api/prices') &&
    request.method === 'GET',
  new NetworkFirst({
    cacheName: 've-api-prices',
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 4 * 60 * 60,                   // 4 часа
      }),
    ],
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// 9. API — ПРОЧИЕ GET (профиль, меню, список покупок и т.д.)
// ═══════════════════════════════════════════════════════════════════════════

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/api/') &&
    request.method === 'GET',
  new NetworkFirst({
    cacheName: 've-api-misc',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60,                       // 1 час
      }),
    ],
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// 10. API — POST/PATCH/DELETE с Background Sync
// ═══════════════════════════════════════════════════════════════════════════
// Если пользователь оффлайн и отметил продукт в списке покупок — POST
// уйдёт в очередь Workbox и автоматически отправится при возврате сети.

const bgSyncPlugin = new BackgroundSyncPlugin('ve-mutation-queue', {
  maxRetentionTime: 24 * 60,                          // удерживать 24 часа
  onSync: async ({ queue }) => {
    let entry
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone())
      } catch (error) {
        // Возвращаем в очередь и прерываемся — попробуем при следующем sync
        await queue.unshiftRequest(entry)
        throw error
      }
    }
    // Уведомляем все вкладки что синхронизация прошла успешно
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((c) =>
      c.postMessage({ type: 'BG_SYNC_COMPLETED', queue: 've-mutation-queue' })
    )
  },
})

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  // Имя метода — Workbox требует явно указать для не-GET
  'POST'
)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'PUT'
)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'PATCH'
)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'DELETE'
)

// ═══════════════════════════════════════════════════════════════════════════
// 11. CATCH HANDLER — OFFLINE FALLBACKS
// ═══════════════════════════════════════════════════════════════════════════
// Когда любая стратегия упала и в кеше ничего нет — отдаём осмысленный ответ.

const OFFLINE_HTML = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Нет связи — Время Есть</title>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#F7FAF7;color:#1A2E22;
         display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px;text-align:center}
    .card{max-width:340px}
    .ico{width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:#EBF8F1;
         display:flex;align-items:center;justify-content:center}
    h1{font-size:22px;font-weight:700;margin:0 0 12px}
    p{font-size:15px;line-height:1.5;color:#3A5445;margin:0 0 24px}
    button{background:linear-gradient(140deg,#45AE6B,#1E6D38);color:#fff;border:0;padding:14px 28px;
           border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;
           box-shadow:0 4px 14px rgba(69,174,107,.35);font-family:inherit}
    button:active{transform:scale(.98)}
  </style>
</head>
<body>
  <div class="card">
    <div class="ico">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E6D38" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39
                 M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11
                 a6 6 0 0 1 6.95 0M12 20h.01"/>
      </svg>
    </div>
    <h1>Нет связи</h1>
    <p>Проверь интернет — мы автоматически подгрузим меню, как только сеть появится.</p>
    <button onclick="location.reload()">Попробовать ещё раз</button>
  </div>
</body>
</html>`

setCatchHandler(async ({ request }) => {
  // Навигация (HTML) → fallback страница
  if (request.destination === 'document') {
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  // API → 503 JSON
  if (request.url.includes('/api/')) {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Нет соединения' }),
      { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
  return Response.error()
})

// ═══════════════════════════════════════════════════════════════════════════
// 12. PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════
// 8 триггеров из ТЗ: ежедневное меню, разморозка, голосование, планирование,
// алерт о цене, win-back и т.д. Push-payload приходит из бэкенда (FCM/Web Push).

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Время Есть', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/android-chrome-192x192.png',
    badge: data.badge || '/icons/badge-72.png',
    image: data.image || undefined,
    data: {
      url: data.url || '/',
      tag: data.tag,
      receivedAt: Date.now(),
      ...data.payload,
    },
    // Тактильная отдача (Android)
    vibrate: data.vibrate || [100, 50, 100],
    // Группировка — новое уведомление с тем же tag заменяет предыдущее
    tag: data.tag || 've-default',
    renotify: data.renotify ?? Boolean(data.tag),
    // Действия (быстрые кнопки в уведомлении)
    actions: data.actions || [],
    // Не закрывается автоматически (для важных алертов)
    requireInteraction: data.requireInteraction || false,
    silent: false,
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Время Есть',
      options
    )
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// 13. NOTIFICATION CLICK → ОТКРЫТЬ ПРИЛОЖЕНИЕ В ПРАВИЛЬНОМ МЕСТЕ
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'
  const action = event.action

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    // Если уже есть открытая вкладка приложения — фокусируем + навигируем
    for (const client of allClients) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus()
        client.postMessage({
          type: 'NAVIGATE',
          url: targetUrl,
          action,
          notificationData: event.notification.data,
        })
        return
      }
    }

    // Нет открытой вкладки — открываем новую
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl)
    }
  })())
})

// Аналитика «уведомление было закрыто без клика»
self.addEventListener('notificationclose', (event) => {
  // Можно отправить beacon на /api/analytics/notification-dismissed
  // — но в SW нет сессионных кук, лучше делать это в клиенте.
})

// ═══════════════════════════════════════════════════════════════════════════
// 14. SHARE TARGET API
// ═══════════════════════════════════════════════════════════════════════════
// Когда пользователь шарит рецепт из другого приложения в «Время Есть»,
// Android делает POST на /share-target — перехватываем здесь и редиректим.

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(event.request))
  }
})

async function handleShareTarget(request) {
  try {
    const formData = await request.formData()
    const shared = {
      title: formData.get('title') || '',
      text: formData.get('text') || '',
      url: formData.get('url') || '',
    }

    // Передаём в клиент через postMessage
    const allClients = await self.clients.matchAll({ type: 'window' })
    for (const client of allClients) {
      client.postMessage({ type: 'SHARED_CONTENT', ...shared })
    }

    // 303 — превращает POST в GET (без повторной отправки формы)
    return Response.redirect(
      `/recipes?shared=1&from=${encodeURIComponent(shared.url || '')}`,
      303
    )
  } catch {
    return Response.redirect('/recipes?shared=error', 303)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 15. PERIODIC BACKGROUND SYNC — ОБНОВЛЕНИЕ ЦЕН РАЗ В 4 ЧАСА
// ═══════════════════════════════════════════════════════════════════════════
// Включается только если пользователь дал permission и установил PWA
// как «trusted» (проводит в приложении регулярно). Поддержка: Android Chrome.
// Регистрация — на стороне клиента (composables/usePWA.js).

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 've-prices-update') {
    event.waitUntil(prefetchPrices())
  }
})

async function prefetchPrices() {
  try {
    const response = await fetch('/api/prices/prefetch', {
      headers: { 'X-Background-Sync': '1' },
    })
    if (response.ok) {
      const cache = await caches.open('ve-api-prices')
      await cache.put('/api/prices/prefetch', response.clone())

      // Опционально: показать локальное уведомление о падении цены
      const data = await response.clone().json().catch(() => null)
      if (data?.priceDrops?.length) {
        await self.registration.showNotification('Цены упали 📉', {
          body: data.priceDrops[0].message,
          icon: '/icons/android-chrome-192x192.png',
          tag: 've-price-drop',
          data: { url: '/prices?source=price-drop' },
        })
      }
    }
  } catch {
    // Не критично — попробуем через 4 часа
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 16. CACHE BUSTING — РУЧНАЯ ОЧИСТКА ИЗ ПРИЛОЖЕНИЯ
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  switch (event.data?.type) {
    case 'CLEAR_API_CACHE':
      caches.delete('ve-api-recipes')
      caches.delete('ve-api-prices')
      caches.delete('ve-api-misc')
      break

    case 'CLEAR_IMAGES_CACHE':
      caches.delete('ve-recipe-images')
      caches.delete('ve-static-images')
      break

    case 'GET_VERSION':
      event.source?.postMessage({ type: 'VERSION', version: SW_VERSION })
      break
  }
})

// При активации шлём всем вкладкам — у нас новый SW
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((c) =>
      c.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION })
    )
  })())
})