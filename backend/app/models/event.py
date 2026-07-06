from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, BigInteger, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Event(Base):
    """Аналитическое событие, прилетает с фронта через POST /events/batch.

    Может быть как от авторизованного юзера, так и от анонима — у фронта
    есть anon_id (UUID в localStorage) который шлётся в каждом батче.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    # NULL = аноним (юзер ещё не залогинился). Если потом залогинится —
    # связку anon_id → user_id можно восстановить аналитически.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    anon_id = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=True, index=True)

    # event_id присылается фронтом (UUID). Уникален внутри (anon_id, event_id),
    # чтобы при ретрае sendBeacon одно и то же событие не дублировалось.
    event_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False, index=True)
    # event_ts — клиентское время в миллисекундах (Date.now()). Серверного времени
    # для аналитики недостаточно (события буферизуются на клиенте до 30 секунд).
    event_ts = Column(BigInteger, nullable=False)

    properties = Column(JSON, nullable=True, default=dict)
    received_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User")

    __table_args__ = (
        # Дедупликация ретраев. Если фронт пошлёт тот же event_id повторно
        # (например после перезахода и restore из localStorage) — INSERT упадёт,
        # роутер это поймает и проглотит.
        Index("uq_events_anon_event", "anon_id", "event_id", unique=True),
    )
