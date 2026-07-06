from pydantic import BaseModel, Field
from typing import Any


class EventIn(BaseModel):
    """Одно событие в батче. Поля совпадают с тем что строит useAnalytics.flush()."""
    eventId: str
    eventType: str
    eventTs: int
    properties: dict[str, Any] | None = Field(default_factory=dict)


class EventBatchIn(BaseModel):
    """Батч событий, формат с фронта (composables/useAnalytics.js:218–225)."""
    anonId: str
    sessionId: str | None = None
    events: list[EventIn]


class EventBatchResult(BaseModel):
    accepted: int
    duplicates: int
