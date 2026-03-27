from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    tests,
    questions,
    sessions,
    results,
    reports,
    report_templates,
    upload,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Аутентификация"])
api_router.include_router(users.router, prefix="/users", tags=["Пользователи"])
api_router.include_router(tests.router, prefix="/tests", tags=["Тесты"])
api_router.include_router(questions.router, prefix="/tests", tags=["Вопросы"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Сессии"])
api_router.include_router(results.router, prefix="/results", tags=["Результаты"])
api_router.include_router(reports.router, prefix="/reports", tags=["Отчёты"])
api_router.include_router(report_templates.router, prefix="/report-templates", tags=["Шаблоны отчётов"])
api_router.include_router(upload.router, prefix="/upload", tags=["Загрузка файлов"])