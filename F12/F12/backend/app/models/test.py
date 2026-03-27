from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.question import Question
    from app.models.session import Session
    from app.models.report_template import ReportTemplate


class Test(Base, TimestampMixin):
    __tablename__ = "tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    unique_link: Mapped[Optional[str]] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    show_result_to_client: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scoring_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Поля которые психолог хочет собрать с клиента
    # По умолчанию: ФИО (всегда) + email
    client_fields: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        default=lambda: {
            "fields": [
                {"key": "full_name", "label": "ФИО", "required": True, "enabled": True, "removable": False},
                {"key": "email", "label": "Email", "required": False, "enabled": True, "removable": True},
            ]
        },
        comment="Поля для сбора данных клиента"
    )

    owner: Mapped[User] = relationship("User", back_populates="tests")
    questions: Mapped[List[Question]] = relationship(
        "Question", back_populates="test", cascade="all, delete-orphan",
        order_by="Question.order"
    )
    sessions: Mapped[List[Session]] = relationship(
        "Session", back_populates="test", cascade="all, delete-orphan"
    )
    report_templates: Mapped[List[ReportTemplate]] = relationship(
        "ReportTemplate", back_populates="test", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Test(id={self.id}, title='{self.title}')>"