"""Приёмник аналитических событий с фронта.

Фронт буферизует события в localStorage и шлёт батчи каждые 30 секунд через
fetch (или sendBeacon при beforeunload/visibilitychange). Формат батча
строится в composables/useAnalytics.js → flush().

Эндпоинт принимает события и от анонимов (до логина), и от авторизованных
юзеров — поэтому используется get_current_user_optional.

Дедупликация: на (anon_id, event_id) висит UNIQUE-индекс. Если фронт переслал
тот же event_id повторно (например после восстановления из localStorage) —
INSERT упадёт, мы ловим IntegrityError и считаем дубликатом.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.events import EventBatchIn, EventBatchResult
from app.services.auth import get_current_user_optional

router = APIRouter(prefix="/events", tags=["events"])

# Защита от слишком больших батчей: typical batch ≤ 50 событий, ставим запас.
MAX_EVENTS_PER_BATCH = 500


@router.post(
    "/batch",
    response_model=EventBatchResult,
    status_code=status.HTTP_202_ACCEPTED,
)
def ingest_batch(
    data: EventBatchIn,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    if not data.events:
        return EventBatchResult(accepted=0, duplicates=0)

    # Просто отрезаем лишнее, а не возвращаем ошибку — фронт всё равно
    # будет пытаться отправить хвост повторно.
    events = data.events[:MAX_EVENTS_PER_BATCH]

    user_id = current_user.id if current_user else None
    accepted = 0
    duplicates = 0

    # Идём по одному с savepoint'ами вместо bulk_insert: дубликат в одном
    # событии не должен заваливать весь батч. На SQLite SAVEPOINT поддерживается.
    for ev in events:
        try:
            with db.begin_nested():
                db.add(Event(
                    user_id=user_id,
                    anon_id=data.anonId,
                    session_id=data.sessionId,
                    event_id=ev.eventId,
                    event_type=ev.eventType,
                    event_ts=ev.eventTs,
                    properties=ev.properties or {},
                ))
            accepted += 1
        except IntegrityError:
            # Конфликт по UNIQUE(anon_id, event_id) — дубль ретрая, ок.
            duplicates += 1

    db.commit()
    return EventBatchResult(accepted=accepted, duplicates=duplicates)
