from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.test import Test


class ReportTemplate(Base, TimestampMixin):
    __tablename__ = "report_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="client"
    )
    # Блоки отчёта — JSON массив
    blocks: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True,
        comment="Блоки отчёта в формате [{type, enabled, title, config}]"
    )
    html_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    interpretations: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test: Mapped[Test] = relationship("Test", back_populates="report_templates")

    def __repr__(self) -> str:
        return f"<ReportTemplate(id={self.id}, name='{self.name}')>"