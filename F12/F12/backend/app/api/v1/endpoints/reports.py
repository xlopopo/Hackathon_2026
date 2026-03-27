from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_session
from app.core.dependencies import get_current_psychologist
from app.models.session import Session
from app.models.user import User
from app.services.report_service import generate_html_report, generate_docx_report
from app.services.email_service import send_report_to_client
from app.utils.file_helpers import create_docx_response, create_html_response

router = APIRouter()


class SendReportRequest(BaseModel):
    report_type: str = "client"
    custom_message: Optional[str] = None


@router.get("/{session_id}")
async def get_report(
    session_id: int,
    type: str = Query("client", description="Тип: client или psychologist"),
    format: str = Query("html", description="Формат: html или docx"),
    session: AsyncSession = Depends(get_session),
):
    if type not in ("client", "psychologist"):
        raise HTTPException(status_code=400, detail="Тип: client или psychologist")
    if format not in ("html", "docx"):
        raise HTTPException(status_code=400, detail="Формат: html или docx")

    if format == "html":
        html = await generate_html_report(session, session_id, report_type=type)
        if not html:
            raise HTTPException(status_code=404, detail="Данные не найдены")
        return create_html_response(html)
    else:
        docx_buffer = await generate_docx_report(session, session_id, report_type=type)
        if not docx_buffer:
            raise HTTPException(status_code=404, detail="Данные не найдены")
        return create_docx_response(docx_buffer, f"report_{session_id}_{type}.docx")


@router.post("/{session_id}/send")
async def send_report_email(
    session_id: int,
    data: SendReportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    """Отправить отчёт клиенту на email."""

    # Загружаем сессию
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.test))
    )
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Сессия не найдена")

    # Проверяем доступ
    if current_user.role != "admin" and sess.test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    # Проверяем что сессия завершена
    if sess.status != "completed":
        raise HTTPException(status_code=400, detail="Сессия ещё не завершена")

    # Проверяем что есть email клиента
    if not sess.client_email:
        raise HTTPException(
            status_code=400,
            detail="У клиента не указан email. Невозможно отправить отчёт."
        )

    # Генерируем HTML отчёт
    report_html = await generate_html_report(db, session_id, report_type=data.report_type)
    if not report_html:
        raise HTTPException(status_code=500, detail="Не удалось сгенерировать отчёт")

    # Отправляем в фоне
    background_tasks.add_task(
        send_report_to_client,
        client_email=sess.client_email,
        client_name=sess.client_name or "Клиент",
        psychologist_name=current_user.full_name,
        test_title=sess.test.title,
        report_html=report_html,
    )

    return {
        "success": True,
        "message": f"Отчёт отправлен на {sess.client_email}",
        "client_email": sess.client_email,
    }