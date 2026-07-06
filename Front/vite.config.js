/**
 * vite.config.js — «Время Есть»
 * v3.0 · 2026 · Production-grade PWA с vite-plugin-pwa (injectManifest)
 *
 * Архитектурное решение:
 *  ─ Используем vite-plugin-pwa (Workbox) в режиме `injectManifest`,
 *    а не `generateSW`. Причина: проект уже имеет кастомные обработчики
 *    push, share-target, background sync — generateSW их вытесняет,
 *    injectManifest даёт Workbox-хелперы (precaching, routing) рядом
 *    с нашим кодом.
 *  ─ Workbox сам подставляет precache-манифест с ревизиями (хешами файлов)
 *    в `self.__WB_MANIFEST` — старый плагин `inject-sw-hash` больше не нужен.
 *  ─ Manifest пишем в коде (Vite собирает manifest.webmanifest), а не как
 *    статический /public/manifest.json — это даёт типизацию и validation.
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      // ── Стратегия ────────────────────────────────────────────────
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',                 // итоговый файл будет /sw.js
      injectRegister: false,             // регистрируем сами в usePWA.js
      // (контролируем updateViaCache, scope)

      // ── Behaviour в dev ──────────────────────────────────────────
      // PWA активно даже на vite dev — удобно тестировать установку
      // и offline без билда.
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: false,
      },

      // ── Precache-манифест ────────────────────────────────────────
      // Что Workbox запихнёт в self.__WB_MANIFEST:
      injectManifest: {
        // Глобы относительно dist/
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,webp,woff2}',
        ],
        globIgnores: [
          // Не precache крупные изображения рецептов — у них своя стратегия
          // (CacheFirst с TTL) внутри sw.js
          '**/recipes-images/**',
          '**/og/**',
        ],
        // Лимит размера одного файла в precache: 3 MB
        // (Workbox по умолчанию 2 MiB, но нам нужно влезть в крупные иконки/чанки)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },

      // ── Manifest (превращается в /manifest.webmanifest) ─────────
      // Дублируем содержимое /public/manifest.json — vite-plugin-pwa
      // сам отдаст его и пропишет <link rel="manifest"> в index.html.
      // Если кастомные поля (share_target) — указываем их здесь.
      registerType: 'prompt',  // не auto-update — пользователь нажимает «Обновить»
      manifest: {
        name: 'Время Есть — меню на неделю и сравнение цен',
        short_name: 'Время Есть',
        description:
          'Персональное меню на неделю за 60 секунд, список покупок ' +
          'и сравнение цен в сервисах доставки',
        lang: 'ru-RU',
        dir: 'ltr',
        id: '/',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'portrait',
        theme_color: '#45AE6B',
        background_color: '#F7FAF7',
        categories: ['food', 'lifestyle', 'health'],
        prefer_related_applications: false,

        icons: [
          // SVG — масштабируется на любой размер (Android, desktop)
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          // Базовые PNG
          {
            src: '/icons/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
          },
          {
            src: '/icons/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
          },
          // Android Chrome (обязательно 192 + 512)
          {
            src: '/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // ⚠️ Maskable иконки нужно сгенерировать отдельно
          // (с safe zone 80% — иначе Android обрежет логомарк).
          // Используйте https://maskable.app/editor.
          // Ниже — placeholder-пути; замените после генерации.
          {
            src: '/icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

        // ── Shortcuts (long-press на иконку → быстрые действия) ───
        shortcuts: [
          {
            name: 'Меню на неделю',
            short_name: 'Меню',
            description: 'Открыть меню на эту неделю',
            url: '/menu?source=shortcut',
            icons: [{
              src: '/icons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            }],
          },
          {
            name: 'Сравнение цен',
            short_name: 'Цены',
            description: 'Сравнить цены в сервисах доставки',
            url: '/prices?source=shortcut',
            icons: [{
              src: '/icons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            }],
          },
          {
            name: 'Создать рецепт',
            short_name: 'Новый',
            description: 'Добавить свой рецепт',
            url: '/recipes/new?source=shortcut',
            icons: [{
              src: '/icons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            }],
          },
        ],

        // ── Share Target (получение «Поделиться» из других приложений) ──
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },

        // ── Screenshots для App Stores / install UI на Android 12+ ──
        // (генерация в задачах подготовки маркетинга — пути placeholder)
        // screenshots: [
        //   {
        //     src: '/screenshots/menu-1080x2340.webp',
        //     sizes: '1080x2340',
        //     type: 'image/webp',
        //     form_factor: 'narrow',
        //     label: 'Меню на неделю с КБЖУ',
        //   },
        // ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'es2020',                    // нативная поддержка во всех современных браузерах
    cssCodeSplit: true,
    sourcemap: false,                    // sourcemaps только при отладке (CI:  --sourcemap)
    minify: 'oxc',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules/vue') ||
            id.includes('node_modules/@vue') ||
            id.includes('node_modules/pinia') ||
            id.includes('node_modules/vue-router')) {
            return 'vue'
          }
          // Workbox в отдельный чанк — он немалый и обновляется редко
          if (id.includes('node_modules/workbox-')) {
            return 'workbox'
          }
        },
      },
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    // Имитируем boundary CORS, как в проде (для тестов SW)
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
})