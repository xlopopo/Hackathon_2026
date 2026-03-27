from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.question import Question


class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    metric_key: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    question: Mapped[Question] = relationship("Question", back_populates="options")

    def __repr__(self) -> str:
        return f"<Option(id={self.id}, text='{self.text[:30]}', score={self.score})>"