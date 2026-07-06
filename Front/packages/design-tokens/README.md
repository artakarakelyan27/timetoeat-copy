# @plus-time/design-tokens

Дизайн-токены бренда «Время Есть». Источник правды для CSS-переменных и JS-констант.

## Подключение в Vue SPA

В `src/main.js`:

```js
import '@plus-time/design-tokens/css'
```

(npm/pnpm workspace берёт пакет из `../packages/design-tokens` по symlink.)

## Подключение в Nuxt 3

В `seo/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['@plus-time/design-tokens/css'],
})
```

## Использование JS-экспортов (для satori OG-генератора)

```js
import { colors, brand, meals } from '@plus-time/design-tokens'

const svg = await satori(
  {
    type: 'div',
    props: {
      style: {
        backgroundColor: colors.gp,
        color: colors.t1,
      },
    },
  },
  { width: 1200, height: 630, fonts: [...] },
)
```

## Структура

- `tokens.css` — все CSS custom properties + базовые классы (`.btn-cta`, `.skip-link`, `.sr-only`).
- `index.js` — JS-экспорты тех же значений в hex.
- `meals.js` — цветовая система приёмов пищи (отдельный экспорт, чтобы не тянуть всё в OG-генератор).

## Правила

1. **Не редактируй CSS-переменные в потребительских файлах.** Меняй здесь.
2. **При изменении токена** — обнови оба файла (`tokens.css` + `index.js`) синхронно.
3. **Не добавляй сюда логику** — только данные и базовые классы.

Источник: `brandbook_vremya_est.pdf` v1.0, раздел 13 «CSS-токены».
