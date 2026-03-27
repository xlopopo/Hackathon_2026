from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
import os

from app.core.config import settings
from app.core.database import engine, async_session_factory
from app.core.security import hash_password
from app.models import Base, User
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name="Администратор",
                role="admin",
            )
            session.add(admin)
            await session.commit()
            print(f"✅ Администратор создан: {settings.ADMIN_EMAIL}")
        else:
            print(f"ℹ️ Администратор уже существует: {settings.ADMIN_EMAIL}")

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="API платформы ПрофДНК для профориентологов",
    lifespan=lifespan,
)

# ✅ CORS — разрешаем ВСЁ для разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # False когда allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статика (аватары)
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Роуты
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ПрофДНК API"}