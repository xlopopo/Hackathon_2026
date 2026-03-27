from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.test import Test
    from app.models.answer import Answer


class Session(Base, TimestampMixin):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    client_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    client_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="in_progress"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    results: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test: Mapped[Test] = relationship("Test", back_populates="sessions")
    answers: Mapped[List[Answer]] = relationship(
        "Answer", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Session(id={self.id}, status='{self.status}')>"