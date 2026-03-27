from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime, timezone


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "psychologist"
    access_until: Optional[datetime] = None

    @field_validator('access_until')
    @classmethod
    def validate_access_until(cls, v):
        if v is not None:
            # Приводим обе даты к одному типу
            if v.tzinfo is not None:
                now = datetime.now(timezone.utc)
            else:
                now = datetime.utcnow()
            if v < now:
                raise ValueError('Дата окончания доступа должна быть в будущем')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    access_until: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    education_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    access_until: Optional[datetime] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    education_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @property
    def has_active_access(self) -> bool:
        if not self.is_active:
            return False
        if self.role == "admin":
            return True
        if self.access_until is None:
            return True
        now = datetime.now(timezone.utc)
        if self.access_until.tzinfo is None:
            return self.access_until > datetime.utcnow()
        return self.access_until > now


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


class ExtendAccessRequest(BaseModel):
    days: int = Field(..., ge=1, le=3650)


class ExtendAccessResponse(BaseModel):
    user_id: int
    email: str
    old_access_until: Optional[datetime]
    new_access_until: datetime
    extended_days: int
    message: str


TokenResponse.model_rebuild()