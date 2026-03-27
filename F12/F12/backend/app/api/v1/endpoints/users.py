from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_session
from app.core.dependencies import get_current_admin
from app.services.user_service import (
    list_users,
    get_user_by_id,
    update_user,
    delete_user,
    extend_user_access,
    set_unlimited_access,
    revoke_access,
    get_users_with_expiring_access,
)
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserListResponse,
    ExtendAccessRequest,
    ExtendAccessResponse,
)
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def get_users(
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    users, total = await list_users(session, role=role, skip=skip, limit=limit)
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
    )


# ← ВАЖНО: этот роут ОБЯЗАТЕЛЬНО выше /{user_id}
@router.get("/expiring-access", response_model=UserListResponse)
async def get_expiring_access_users(
    days: int = Query(7, ge=1, le=90),
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    """Получить пользователей с истекающим доступом."""
    users = await get_users_with_expiring_access(session, days_threshold=days)
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=len(users),
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    user = await get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: int,
    data: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    user = await get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    updated = await update_user(session, user, data)
    return UserResponse.model_validate(updated)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    user = await get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    await delete_user(session, user)


@router.post("/{user_id}/extend-access", response_model=ExtendAccessResponse)
async def extend_access(
    user_id: int,
    data: ExtendAccessRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    """Продлить доступ пользователю."""
    user = await get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Нельзя изменить доступ администратору")

    old_date, new_date = await extend_user_access(session, user, data.days)

    # Отправляем email уведомление в фоне
    from app.services.email_service import send_email
    from app.core.config import settings

    expire_date = new_date.strftime('%d.%m.%Y')

    background_tasks.add_task(
        send_email,
        to=user.email,
        subject=f"✅ Доступ к ПрофДНК продлён до {expire_date}",
        body=f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0369a1, #0d9488); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">ПрофДНК</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                <h2 style="color: #1e293b;">Здравствуйте, {user.full_name}!</h2>
                <p style="color: #64748b; line-height: 1.6;">
                    Ваш доступ к платформе <strong>ПрофДНК</strong> успешно продлён.
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #166534;">
                        ✅ Доступ активен до: <strong>{expire_date}</strong><br>
                        📅 Продлён на: <strong>{data.days} дней</strong>
                    </p>
                </div>
                <p style="color: #94a3b8; font-size: 0.85rem;">
                    Это письмо отправлено автоматически платформой ПрофДНК.
                </p>
            </div>
        </body>
        </html>
        """,
    )

    return ExtendAccessResponse(
        user_id=user.id,
        email=user.email,
        old_access_until=old_date,
        new_access_until=new_date,
        extended_days=data.days,
        message=f"Доступ продлён до {new_date.strftime('%d.%m.%Y %H:%M')}",
    )


@router.post("/{user_id}/set-unlimited-access", response_model=UserResponse)
async def set_unlimited_access_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    """Установить бессрочный доступ."""
    user = await get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    await set_unlimited_access(session, user)
    return UserResponse.model_validate(user)


@router.post("/{user_id}/revoke-access", response_model=UserResponse)
async def revoke_access_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
):
    """Немедленно отозвать доступ."""
    user = await get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Нельзя отозвать доступ администратору")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Нельзя отозвать доступ самому себе")
    await revoke_access(session, user)
    return UserResponse.model_validate(user)