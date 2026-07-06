# Гайд по ручному редактированию

Этот документ — для соло-поддержки сайта. Здесь описано **где править контент** и **как защититься от поломок** при правках.

---

## Где лежит что

### Контент в yaml-файлах (правишь чаще всего)

| Что | Где | Когда правишь |
|---|---|---|
| Замены ингредиентов | `seo/content/reference/zameny.yaml` | Новый продукт; уточнение замены |
| Сроки хранения | `seo/content/reference/srok-khraneniya.yaml` | Новый продукт; уточнение признаков порчи |
| Из остатков | `seo/content/iz-ostatkov.yaml` | Новый сценарий «вчерашнего» продукта |
| Меню-лендинги | `seo/content/menyu/dlya-semi.yaml` и т.д. | Меняешь рецепты недели или сезонно |

### Vue-страницы (правишь редко)

| Что | Где |
|---|---|
| Шапка | `seo/components/SiteHeader.vue` |
| Футер | `seo/components/SiteFooter.vue` |
| Sticky CTA | `seo/components/StickyCta.vue` |
| Меню «О проекте» (методология) | `seo/pages/o-proekte.vue` |
| Главные хабы | `seo/pages/{recepty,chto-prigotovit,spravochnik,iz-ostatkov,menyu-na-nedelyu}/index.vue` |

### Дизайн-токены

`packages/design-tokens/tokens.css` + `index.js` — синхронно. Меняешь и пересобираешь и SPA, и Nuxt.

---

## Правила безопасного редактирования yaml

YAML — формат, чувствительный к синтаксису. Чтобы не падал nuxt generate:

### Правило №1: ВСЕГДА оборачивай значения в двойные кавычки

```yaml
# ❌ ПЛОХО
- a: Цельнозерновая мука — это замена обычной? Не совсем.

# ✓ ХОРОШО
- a: "Цельнозерновая мука — это замена обычной? Не совсем."
```

Двоеточие посреди русской фразы ломает yaml без кавычек.

### Правило №2: Двойные кавычки внутри строки экранируй

```yaml
# ❌ ПЛОХО
- name: "Сыр "Российский""

# ✓ ХОРОШО
- name: 'Сыр "Российский"'
# или
- name: "Сыр \"Российский\""
```

### Правило №3: Не используй tab'ы. Только пробелы (4 пробела на уровень)

Большинство редакторов конвертируют автоматически. В `nano` — `Ctrl+G` подскажет настройки.

### Правило №4: После правки — обязательно `pnpm run lint:links`

Если ты переименовал slug или удалил продукт, на который ссылались другие — это сломает перелинковку. Линтер найдёт.

---

## Workflow для добавления нового продукта (пример: «майонез»)

```bash
cd /var/www/time-to-eat-copy/Front/seo

# 1. Добавь запись в zameny.yaml (опционально)
nano content/reference/zameny.yaml
# Добавь блок по образцу yajco/moloko — поле slug:, name:, emoji:, ...

# 2. Добавь запись в srok-khraneniya.yaml (если уместно)
nano content/reference/srok-khraneniya.yaml

# 3. Пересобери и проверь ссылки
rm -rf .nuxt .output
SITE_URL=https://timetoeat.tw1.ru API_BASE=https://timetoeat.tw1.ru/api pnpm run generate
# generate автоматически вызывает check-links после prerender.
# Если упадёт — поправь, повтори.

# 4. Перезапусти Nuxt preview (для sitemap/og)
pkill -f "nuxt preview"
sleep 1
nohup env SITE_URL=https://timetoeat.tw1.ru API_BASE=https://timetoeat.tw1.ru/api pnpm run preview > /var/log/nuxt-preview.log 2>&1 &

# 5. Открой в incognito и проверь:
# https://timetoeat.tw1.ru/spravochnik/zameny/mayonez
# https://timetoeat.tw1.ru/spravochnik/srok-khraneniya/mayonez
```

---

## Workflow для правки существующего рецепта/замены

```bash
nano content/reference/zameny.yaml
# Найди блок с slug: и измени short_answer, cases, faq

# Обнови дату — для свежести в sitemap и в schema:
# updated: "2026-06-20"

rm -rf .nuxt .output
pnpm run generate    # check-links запустится автоматом
```

Поле `updated:` — это не косметика. Оно идёт в `sitemap.xml` как `<lastmod>`, и в schema.org `dateModified` — Google использует свежесть как Q*-сигнал.

---

## Что делает `pnpm run generate`

1. **Nuxt build** — Vite собирает client + server бандлы.
2. **Pre-render** — Nitro обходит все известные маршруты (хардкод + yaml + БД через API_BASE) и пишет HTML-файлы в `.output/public/`.
3. **`scripts/check-links.mjs`** — постпроверка. Проходит по всем сгенеренным HTML, проверяет что каждая локальная ссылка (`href=/...`) ведёт на существующий файл или известный SPA-роут. Если хоть одна битая — exit code 1, скрипт `generate` упадёт.

**Если упало на check-links** — НЕ деплой `.output/public/` в продакшн. Сначала почини. Линтер выводит таблицу:

```
✗ Битые ссылки:

  /spravochnik/zameny/nesuschestvuyushchiy
    ← /spravochnik/srok-khraneniya/yajco-kurinoe/index.html

  /iz/farsh
    ← /iz-ostatkov/farsh-zharenyj/index.html
    ← /iz-ostatkov/spagetti/index.html
```

Что делать:
1. Если ссылка опечатка — поправь yaml.
2. Если страница «должна быть, но не сгенерилась» — проверь yaml-файл соответствующей страницы (опечатка в slug, забыл ингредиент).
3. Если страница не нужна — удали ссылку из источника.

---

## Что НЕ редактировать через nano

1. **`.nuxt/`** — генеренный каталог, удаляется при каждом билде.
2. **`.output/`** — то же самое.
3. **`node_modules/`** — никогда.
4. **`packages/design-tokens/index.js` без синхронизации с `tokens.css`** — два файла, источник правды для CSS-переменных и JS-констант. Меняй парой.

---

## Когда что-то сломалось

```bash
# Полная очистка и пересборка
cd /var/www/time-to-eat-copy/Front/seo
rm -rf .nuxt .output node_modules
cd ..
pnpm install --ignore-scripts
pnpm approve-builds   # если просит — нажми все «yes»

# Снова собрать
cd seo
SITE_URL=https://timetoeat.tw1.ru API_BASE=https://timetoeat.tw1.ru/api pnpm run generate
```

Если упало с непонятной ошибкой — пришли мне последние 50 строк вывода.

---

## Hotkeys в `nano`

- `Ctrl+O`, `Enter` — сохранить
- `Ctrl+X` — выйти
- `Ctrl+W` — поиск
- `Alt+Backspace` — удалить слово
- `Ctrl+K` — вырезать строку
- `Ctrl+U` — вставить вырезанное

Если нужен более удобный редактор:
```bash
sudo apt install micro
# micro — это modern terminal-редактор, как VS Code но в SSH
```

---

## Чеклист «не забыть» при правках

- [ ] Все строки в YAML в двойных кавычках или это безопасные ключи
- [ ] Поле `updated:` обновлено в формате `YYYY-MM-DD`
- [ ] После `pnpm run generate` — нет красных ERROR в логе
- [ ] `check-links` прошёл без exit 1
- [ ] Открыл `https://timetoeat.tw1.ru/<новая страница>` в incognito и убедился что не SPA
- [ ] Если правил кросс-ссылку — проверил источник и цель обе
