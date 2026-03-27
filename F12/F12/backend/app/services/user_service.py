from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy import select, func, and_
from typing import Optional, List, Tuple
from datetime import datetime, timedelta

from app.models.user import User
from app.core.security import hash_password, verify_password
from app.schemas.user import UserCreate, UserUpdate


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: int) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, data: UserCreate) -> User:
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        access_until=data.access_until,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user(session: AsyncSession, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await session.commit()
    await session.refresh(user)
    return user


async def delete_user(session: AsyncSession, user: User) -> None:
    await session.delete(user)
    await session.commit()


async def list_users(
    session: AsyncSession,
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[List[User], int]:
    query = select(User)
    count_query = select(func.count(User.id))

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    total_result = await session.execute(count_query)
    total = total_result.scalar()

    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await session.execute(query)
    users = result.scalars().all()

    return users, total


async def authenticate_user(
    session: AsyncSession, email: str, password: str
) -> Optional[User]:
    user = await get_user_by_email(session, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def extend_user_access(
    session: AsyncSession,
    user: User,
    days: int,
) -> Tuple[Optional[datetime], datetime]:
    """
    Продлить доступ пользователя на N дней.
    Возвращает (старая_дата, новая_дата).
    """
    old_date = user.access_until

    if user.access_until and user.access_until > datetime.utcnow():
        # Продлеваем от текущей даты окончания
        user.access_until = user.access_until + timedelta(days=days)
    else:
        # Продлеваем от сейчас
        user.access_until = datetime.utcnow() + timedelta(days=days)

    await session.commit()
    await session.refresh(user)
    return old_date, user.access_until


async def set_unlimited_access(session: AsyncSession, user: User) -> User:
    """Установить бессрочный доступ (access_until = None)."""
    user.access_until = None
    user.is_active = True
    await session.commit()
    await session.refresh(user)
    return user


async def revoke_access(session: AsyncSession, user: User) -> User:
    """Немедленно отозвать доступ."""
    user.access_until = datetime.utcnow() - timedelta(seconds=1)
    await session.commit()
    await session.refresh(user)
    return user


async def get_users_with_expiring_access(
    session: AsyncSession,
    days_threshold: int = 7,
) -> List[User]:
    """
    Получить пользователей у которых доступ истекает
    в течение days_threshold дней.
    """
    now = datetime.utcnow()
    threshold = now + timedelta(days=days_threshold)

    result = await session.execute(
        select(User).where(
            and_(
                User.role == "psychologist",
                User.is_active == True,
                User.access_until != None,
                User.access_until >= now,
                User.access_until <= threshold,
            )
        ).order_by(User.access_until.asc())
    )
    return result.scalars().all()