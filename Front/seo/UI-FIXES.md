# UI-фиксы для тестового деплоя

## 1. Логотип в шапке Nuxt — синхронизирован с SPA

`seo/components/SiteHeader.vue` теперь использует точно тот же SVG, что и `topbar__logo` в SPA:
- круг с двумя стрелками (часы / циферблат)
- внутри скруглённого квадрата с brand-градиентом
- такой же `Время Есть` текст рядом

Просто обнови файл на сервере и пересобери Nuxt.

## 2. Фавикон — берём из SPA `public/`

Сейчас у Nuxt свой `/seo/public/favicon.svg`. Чтобы фавикон **везде на домене был один и тот же** (что и в основном приложении), достаточно скопировать из SPA:

```bash
# С сервера, из основной dist'ы SPA в Nuxt:
cp /var/www/time-to-eat-copy/Front/public/favicon.svg /var/www/time-to-eat-copy/Front/seo/public/favicon.svg

# Если в /public/icons/ есть PNG-варианты — забрать их тоже:
mkdir -p /var/www/time-to-eat-copy/Front/seo/public/icons
cp /var/www/time-to-eat-copy/Front/public/icons/favicon-*.png /var/www/time-to-eat-copy/Front/seo/public/icons/ 2>/dev/null || true
cp /var/www/time-to-eat-copy/Front/public/icons/apple-touch-icon*.png /var/www/time-to-eat-copy/Front/seo/public/icons/ 2>/dev/null || true
```

Альтернатива (наиболее правильная архитектурно): сделать так, чтобы **nginx отдаёт `/favicon.svg` и `/icons/*` всегда из SPA dist**, без копирования. Это уже почти настроено — в `timetoeat.tw1.ru.nginx.conf` блок `location = /favicon.svg` сейчас отдаёт из Nuxt. Если хочешь отдавать из SPA — поменяй:

```nginx
location = /favicon.svg {
    root /var/www/time-to-eat-copy/Front/dist;   # было: seo/.output/public
    try_files /favicon.svg =404;
}

location ^~ /icons/ {
    root /var/www/time-to-eat-copy/Front/dist;
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

Рекомендую — это убирает дублирование и гарантирует одинаковый фавикон в SPA-зоне и SEO-зоне.

## 3. Sticky CTA — не залезает на футер

`seo/components/StickyCta.vue` обновлён. Использует `IntersectionObserver` на `footer.footer`:
- Когда футер появляется в viewport — плашка плавно уезжает вниз (`translateY(150%)`) и становится `opacity: 0`.
- При скролле обратно вверх — возвращается.
- При `prefers-reduced-motion` — без анимации.

Никаких CSS-хаков типа «дать `main` margin-bottom: 80px». Просто observer.

## 4. Применить всё

```bash
cd /var/www/time-to-eat-copy/Front/seo
rm -rf .nuxt .output
SITE_URL=https://timetoeat.tw1.ru API_BASE=https://timetoeat.tw1.ru/api pnpm run generate

pkill -f "nuxt preview" 2>/dev/null
sleep 1
nohup env SITE_URL=https://timetoeat.tw1.ru API_BASE=https://timetoeat.tw1.ru/api pnpm run preview > /var/log/nuxt-preview.log 2>&1 &
sleep 3

# nginx — если меняли блок favicon:
sudo systemctl reload nginx

# В браузере в incognito проверить:
# https://timetoeat.tw1.ru/o-proekte    — логотип-часы в шапке как в SPA
# Скролл до низа — sticky CTA уезжает
# Адресная строка — фавикон тот же, что в SPA
```
