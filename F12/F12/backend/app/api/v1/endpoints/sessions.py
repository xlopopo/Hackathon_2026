from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import Optional

from app.core.database import get_session
from app.core.dependencies import get_current_user, get_current_psychologist
from app.models.session import Session
from app.models.answer import Answer
from app.models.test import Test
from app.services.scoring_service import calculate_results
from app.schemas.session import (
    SubmitAnswersRequest,
    SessionResponse,
    SessionDetailResponse,
    SessionListResponse,
    AnswerResponse,
)
from app.models.user import User

router = APIRouter()


@router.post("/start/{unique_link}", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    unique_link: str,
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Test).where(Test.unique_link == unique_link, Test.is_published == True)
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден или не опубликован")

    new_session = Session(test_id=test.id, status="in_progress")
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return SessionResponse.model_validate(new_session)


@router.post("/{session_id}/submit", response_model=SessionResponse)
async def submit_answers(
    session_id: int,
    data: SubmitAnswersRequest,
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    if sess.status == "completed":
        raise HTTPException(status_code=400, detail="Сессия уже завершена")

    if data.client_name:
        sess.client_name = data.client_name
    if data.client_email:
        sess.client_email = data.client_email

    for ans_data in data.answers:
        answer = Answer(
            session_id=session_id,
            question_id=ans_data.question_id,
            selected_option_id=ans_data.selected_option_id,
            selected_option_ids=ans_data.selected_option_ids,
            text_value=ans_data.text_value,
            scale_value=ans_data.scale_value,
        )
        db.add(answer)

    sess.status = "completed"
    sess.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(sess)

    results = await calculate_results(db, sess)
    sess.results = results
    await db.commit()
    await db.refresh(sess)
    return SessionResponse.model_validate(sess)


@router.get("/", response_model=SessionListResponse)
async def list_sessions(
    test_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    query = select(Session)
    count_query = select(func.count(Session.id))

    if test_id:
        query = query.where(Session.test_id == test_id)
        count_query = count_query.where(Session.test_id == test_id)
    if status_filter:
        query = query.where(Session.status == status_filter)
        count_query = count_query.where(Session.status == status_filter)
    if current_user.role != "admin":
        query = query.join(Test).where(Test.owner_id == current_user.id)
        count_query = count_query.join(Test).where(Test.owner_id == current_user.id)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset(skip).limit(limit).order_by(Session.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()

    return SessionListResponse(
        sessions=[SessionResponse.model_validate(s) for s in sessions],
        total=total,
    )


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
    session_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id)
        .options(selectinload(Session.answers), selectinload(Session.test))
    )
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    if current_user.role != "admin" and sess.test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    return SessionDetailResponse(
        id=sess.id, test_id=sess.test_id, client_name=sess.client_name,
        client_email=sess.client_email, status=sess.status, results=sess.results,
        created_at=sess.created_at, completed_at=sess.completed_at,
        test_title=sess.test.title,
        answers=[AnswerResponse.model_validate(a) for a in sess.answers],
    )


@router.get("/public/{session_id}/result", response_model=SessionResponse)
async def get_public_result(
    session_id: int,
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id)
        .options(selectinload(Session.test))
    )
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    if not sess.test.show_result_to_client:
        raise HTTPException(status_code=403, detail="Результаты недоступны")
    return SessionResponse.model_validate(sess)