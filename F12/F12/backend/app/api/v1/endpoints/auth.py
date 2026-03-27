from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta

from app.core.database import get_session
from app.core.security import create_access_token
from app.core.dependencies import get_current_user, get_current_admin
from app.services.user_service import authenticate_user, create_user, get_user_by_email
from app.services.email_service import send_access_expiring_notification
from app.schemas.user import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    ProfileUpdate,
)
from app.models.user import User
from app.core.config import settings

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: LoginRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    user = await authenticate_user(session, form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Проверяем истечение подписки в фоне
    if user.role == "psychologist" and user.access_until:
        now = datetime.now(timezone.utc)
        access_until = user.access_until
        if access_until.tzinfo is None:
            access_until = access_until.replace(tzinfo=timezone.utc)

        days_left = (access_until - now).days

        # Уведомляем если осталось 7 дней или меньше (но доступ ещё есть)
        if 0 < days_left <= 7:
            background_tasks.add_task(
                send_access_expiring_notification,
                psychologist_email=user.email,
                psychologist_name=user.full_name,
                admin_email=settings.ADMIN_EMAIL,
                access_until=access_until,
                days_left=days_left,
            )

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    existing = await get_user_by_email(session, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует",
        )
    if data.role not in ("psychologist", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимая роль",
        )
    user = await create_user(session, data)
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: ProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await session.commit()
    await session.refresh(current_user)
    return UserResponse.model_validate(current_user)