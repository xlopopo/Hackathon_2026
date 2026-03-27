from __future__ import annotations
from typing import TYPE_CHECKING, List, Optional
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.test import Test


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="psychologist")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    access_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True,
        comment="Дата окончания доступа (null = бессрочно)"
    )
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    telegram: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    education_level: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    tests: Mapped[List[Test]] = relationship(
        "Test", back_populates="owner", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"

    def has_active_access(self) -> bool:
        if not self.is_active:
            return False
        if self.role == "admin":
            return True
        if self.access_until is None:
            return True
        now = datetime.now(timezone.utc)
        if self.access_until.tzinfo is None:
            access_until_aware = self.access_until.replace(tzinfo=timezone.utc)
        else:
            access_until_aware = self.access_until
        return access_until_aware > now