# Шрифты для OG-генератора

Положи в эту папку три файла:

```
PlayfairDisplay-Bold.ttf
DMSans-Regular.ttf
DMSans-Bold.ttf
```

## Где скачать

Бесплатные TTF из Google Fonts:

```bash
cd seo/assets/fonts

# Playfair Display (используем weight 800 для заголовков OG)
curl -L -o PlayfairDisplay-Bold.ttf \
  "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf"

# DM Sans (regular + bold для текста)
curl -L -o DMSans-Regular.ttf \
  "https://github.com/google/fonts/raw/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf"
cp DMSans-Regular.ttf DMSans-Bold.ttf
```

(satori умеет вытаскивать нужный вес из variable-font, поэтому одного файла достаточно — но мы загружаем под разными именами для совместимости.)

## Почему не CDN

satori на server-side нужен `Buffer` со шрифтом. Качать с CDN на каждый запрос — медленно и хрупко. Один раз положили в репо — гарантированно работает.

## Лицензия

Оба шрифта под SIL Open Font License — коммерческое использование разрешено.
