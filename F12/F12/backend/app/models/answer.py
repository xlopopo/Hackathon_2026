from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.question import Question


class Answer(Base, TimestampMixin):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    selected_option_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    text_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scale_value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    session: Mapped[Session] = relationship("Session", back_populates="answers")
    question: Mapped[Question] = relationship("Question", back_populates="answers")

    def __repr__(self) -> str:
        return f"<Answer(id={self.id}, session={self.session_id}, question={self.question_id})>"