from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.database import engine, Base
from app.routers import auth, recipes, menu, shopping, events, user_recipes, products
from app.routers.canonical_foods import router as canonical_foods_router
# Загружаем .env ДО создания таблиц и инициализации сервисов —
# чтобы SECRET_KEY и DATABASE_URL подхватились из конфига.
load_dotenv()

# Создаём таблицы при старте. Для SQLite этого достаточно; на Postgres лучше
# использовать Alembic-миграции (заготовка папки уже есть).
import app.models  # noqa: F401 — регистрация моделей в metadata
Base.metadata.create_all(bind=engine)

from app.routers.seo import router as seo_router
app.include_router(seo_router, prefix="/api/seo", tags=["seo"])

app = FastAPI(
    title="Время Есть API",
    description="Бэкенд для приложения планирования питания",
    version="1.1.0",
)

# CORS. По умолчанию разрешён только тот origin, который указан в .env.
# Для удобства локальной разработки добавлены 5173 (vite dev) и 4173 (vite preview).
# Не используем allow_origins=["*"] вместе с allow_credentials=True — браузеры
# такую комбинацию запрещают, и это обнуляет смысл credentials.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = list({
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:4173",
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(recipes.router)
app.include_router(user_recipes.router)
app.include_router(menu.router)
app.include_router(shopping.router)
app.include_router(events.router)
app.include_router(products.router)
app.include_router(canonical_foods_router)

@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "Время Есть API v1.1"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}