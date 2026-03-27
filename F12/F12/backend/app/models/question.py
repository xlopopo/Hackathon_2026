from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.test import Test
    from app.models.option import Option
    from app.models.answer import Answer


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="single_choice"
    )
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    scale_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    branching_rules: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test: Mapped[Test] = relationship("Test", back_populates="questions")
    options: Mapped[List[Option]] = relationship(
        "Option", back_populates="question", cascade="all, delete-orphan",
        order_by="Option.order"
    )
    answers: Mapped[List[Answer]] = relationship(
        "Answer", back_populates="question", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Question(id={self.id}, type='{self.question_type}')>"