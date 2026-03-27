"""
Скрипт для ручного создания администратора.
Запуск: python create_admin.py
"""
import asyncio
from sqlalchemy import select
from app.core.database import async_session_factory, engine
from app.core.security import hash_password
from app.core.config import settings
from app.models import Base, User


async def create_admin():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        if result.scalar_one_or_none():
            print("Администратор уже существует")
            return

        admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name="Администратор",
            role="admin",
        )
        session.add(admin)
        await session.commit()
        print(f"Администратор создан: {settings.ADMIN_EMAIL}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_admin())