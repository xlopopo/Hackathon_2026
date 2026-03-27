from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_session
from app.core.dependencies import get_current_psychologist
from app.services.test_service import (
    get_test_by_id,
    add_question,
    get_question_by_id,
    update_question,
    delete_question,
    list_questions,
    bulk_update_questions,
)
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from app.models.user import User

router = APIRouter()


@router.get("/{test_id}/questions", response_model=List[QuestionResponse])
async def get_questions(
    test_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await get_test_by_id(session, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    questions = await list_questions(session, test_id)
    return [QuestionResponse.model_validate(q) for q in questions]


@router.post("/{test_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    test_id: int,
    data: QuestionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await get_test_by_id(session, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    question = await add_question(session, test_id, data)
    return QuestionResponse.model_validate(question)


@router.put("/{test_id}/questions/bulk", response_model=List[QuestionResponse])
async def bulk_update_questions_endpoint(
    test_id: int,
    data: List[QuestionCreate],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await get_test_by_id(session, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    questions = await bulk_update_questions(session, test_id, data)
    return [QuestionResponse.model_validate(q) for q in questions]


@router.patch("/{test_id}/questions/{question_id}", response_model=QuestionResponse)
async def update_question_endpoint(
    test_id: int,
    question_id: int,
    data: QuestionUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    question = await get_question_by_id(session, question_id)
    if not question or question.test_id != test_id:
        raise HTTPException(status_code=404, detail="Вопрос не найден")
    test = await get_test_by_id(session, test_id)
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    updated = await update_question(session, question, data)
    return QuestionResponse.model_validate(updated)


@router.delete("/{test_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question_endpoint(
    test_id: int,
    question_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    question = await get_question_by_id(session, question_id)
    if not question or question.test_id != test_id:
        raise HTTPException(status_code=404, detail="Вопрос не найден")
    test = await get_test_by_id(session, test_id)
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    await delete_question(session, question)