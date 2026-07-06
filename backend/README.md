# Время Есть — Backend (FastAPI)

## Структура

```
backend/
├── app/
│   ├── main.py              # Точка входа, CORS, роутеры
│   ├── database.py          # SQLAlchemy engine + get_db dependency
│   ├── models/              # ORM модели (User, Recipe, WeekMenu, ShoppingItem, Event)
│   ├── schemas/             # Pydantic схемы (валидация + сериализация)
│   ├── routers/             # auth, recipes, menu, shopping, events
│   └── services/
│       └── auth.py          # JWT, bcrypt, get_current_user, get_current_user_optional
├── seed.py                  # Заполнение БД системными рецептами
├── import_recipes.py        # Массовый импорт из JSON-каталога
├── impg.py                  # Импорт ingredients_catalog из CSV
├── requirements.txt
└── .env.example
```

## Быстрый старт

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Обязательно меняем SECRET_KEY и FRONTEND_URL в .env !

python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Продакшн (systemd)

```ini
# /etc/systemd/system/menuday.service
[Unit]
Description=Время Есть FastAPI
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/time-to-eat/backend
ExecStart=/var/www/time-to-eat/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
EnvironmentFile=/var/www/time-to-eat/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable menuday
systemctl start menuday
```

## Nginx (реверс-прокси)

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## API-эндпоинты

### Авторизация
| Метод  | URL              | Auth | Описание                              |
|--------|------------------|------|---------------------------------------|
| POST   | /auth/register   | —    | Регистрация → JWT                     |
| POST   | /auth/login      | —    | Логин → JWT                           |
| GET    | /auth/me         | ✅   | Текущий юзер                          |
| PATCH  | /auth/me         | ✅   | Обновить имя/пароль/family_size/preferences |

### Рецепты
| Метод  | URL                        | Auth | Описание                                      |
|--------|----------------------------|------|-----------------------------------------------|
| GET    | /recipes                   | —    | Список с фильтрами: meal_type, cuisine, category, is_vegetarian, is_fast, is_gluten_free, is_lactose_free, limit, offset |
| GET    | /recipes/search?q=…        | —    | Поиск по name/description (q ≥ 2 символа)     |
| GET    | /recipes/{id}              | —    | Один рецепт                                   |
| POST   | /recipes                   | ✅   | Добавить рецепт (фронт CreateRecipeView пока в TODO) |

### Меню
| Метод  | URL                       | Auth | Описание                                 |
|--------|---------------------------|------|------------------------------------------|
| GET    | /menu/week/{week_start}   | ✅   | План на неделю                           |
| PUT    | /menu/week/{week_start}   | ✅   | Сохранить/обновить план (полная замена)  |
| DELETE | /menu/week/{week_start}   | ✅   | Удалить план                             |

`week_start` — строго ISO-дата понедельника недели (`YYYY-MM-DD`). Берётся
только из path; если фронт продублирует в body — игнорируется.

### Список покупок
| Метод  | URL                | Auth | Описание                                            |
|--------|--------------------|------|-----------------------------------------------------|
| GET    | /shopping          | ✅   | Список покупок                                      |
| POST   | /shopping          | ✅   | Добавить позицию                                    |
| PATCH  | /shopping/{id}     | ✅   | Обновить (в т.ч. is_done)                           |
| DELETE | /shopping/{id}     | ✅   | Удалить позицию                                     |
| PUT    | /shopping/bulk     | ✅   | Заменить весь список                                |
| DELETE | /shopping          | ✅   | Очистить список                                     |
| POST   | /shopping/generate | ✅   | Серверная генерация со ценами (требует ingredients_catalog + products) |

> Сейчас фронт считает список покупок локально и серверный CRUD не использует —
> эндпоинты оставлены для совместимости и будущей синхронизации между устройствами.

### Аналитика
| Метод  | URL              | Auth          | Описание                                        |
|--------|------------------|---------------|-------------------------------------------------|
| POST   | /events/batch    | опционально   | Приём батча событий с фронта (useAnalytics)     |

Эндпоинт принимает события и от анонимов (до логина), и от авторизованных юзеров.
Дедупликация по (anon_id, event_id) — повторная отправка из-за ретрая безопасна.

Интерактивная документация: `http://your-server:8000/docs`

## Изменения с v1.0

- `Recipe`: добавлены поля `tags` (JSON) и `category` (String). `RecipeOut` теперь возвращает их фронту.
- `Recipe.created_by` — для пользовательских рецептов (фронт CreateRecipeView пока в TODO).
- `MenuMeal`: добавлен `UNIQUE(week_menu_id, day_index, meal_type)`. Дубликаты слотов невозможны.
- `PUT /menu/week/{date}`: `week_start` берётся только из path, дубликаты слотов в body дедуплицируются (последний выигрывает).
- `POST /recipes`: теперь требует авторизацию.
- `services/auth.py`: при `ENV=production` и `SECRET_KEY=change-me` приложение падает на старте.
- `services/auth.py`: добавлен `get_current_user_optional` для эндпоинтов где аноним допустим.
- `PATCH /auth/me`: использует `model_dump(exclude_unset=True)` — теперь корректно различает «поле не пришло» и «поле = null».
- `POST /events/batch`: новый эндпоинт-приёмник аналитики, фронт уже шлёт сюда события.
- `seed.py`: автоматически рассчитывает proteins/fats/carbs из kcal по 15/30/55, если они не указаны — иначе скоринг по БЖУ на фронте работает вхолостую.
- `/shopping/generate`: починен баг с `wm.meals.get(...)` (падал с AttributeError); защищён от отсутствия таблиц `ingredients_catalog`/`products`.
- `recipes/search`: экранирование `%` и `_` в пользовательском запросе.

## Миграция на PostgreSQL

В `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/menuday
```
И добавляем драйвер: `pip install psycopg2-binary`.

На Postgres рекомендуется использовать Alembic вместо `Base.metadata.create_all` —
заготовка папки `alembic/` уже в репозитории.
