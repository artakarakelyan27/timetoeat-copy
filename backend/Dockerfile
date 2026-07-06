FROM python:3.10-slim

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Запускаем бэкенд
# ВАЖНО: если твой файл запуска называется не main.py, а по-другому, замени ниже
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

