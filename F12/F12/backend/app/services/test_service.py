from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
import uuid

from app.models.test import Test
from app.models.question import Question
from app.models.option import Option
from app.models.session import Session
from app.schemas.test import TestCreate, TestUpdate
from app.schemas.question import QuestionCreate, QuestionUpdate


async def create_test(session: AsyncSession, data: TestCreate, owner_id: int) -> Test:
    test = Test(
        title=data.title,
        description=data.description,
        owner_id=owner_id,
        is_published=data.is_published,
        show_result_to_client=data.show_result_to_client,
        scoring_config=data.scoring_config,
        unique_link=str(uuid.uuid4())[:8],
    )
    session.add(test)
    await session.commit()
    await session.refresh(test)
    return test


async def get_test_by_id(
    session: AsyncSession, test_id: int, with_relations: bool = False
) -> Optional[Test]:
    query = select(Test).where(Test.id == test_id)
    if with_relations:
        query = query.options(
            selectinload(Test.questions).selectinload(Question.options),
            selectinload(Test.sessions),
            selectinload(Test.report_templates),
        )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_test_by_link(
    session: AsyncSession, unique_link: str
) -> Optional[Test]:
    query = (
        select(Test)
        .where(Test.unique_link == unique_link, Test.is_published == True)
        .options(
            selectinload(Test.questions).selectinload(Question.options)
        )
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def list_tests_by_owner(
    session: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100
) -> tuple[List[Test], int]:
    count_query = select(func.count(Test.id)).where(Test.owner_id == owner_id)
    total_result = await session.execute(count_query)
    total = total_result.scalar()

    query = (
        select(Test)
        .where(Test.owner_id == owner_id)
        .options(
            selectinload(Test.questions),
            selectinload(Test.sessions),
        )
        .offset(skip)
        .limit(limit)
        .order_by(Test.created_at.desc())
    )
    result = await session.execute(query)
    tests = result.scalars().unique().all()

    return tests, total


async def list_all_tests(
    session: AsyncSession, skip: int = 0, limit: int = 100
) -> tuple[List[Test], int]:
    count_query = select(func.count(Test.id))
    total_result = await session.execute(count_query)
    total = total_result.scalar()

    query = (
        select(Test)
        .options(
            selectinload(Test.questions),
            selectinload(Test.sessions),
        )
        .offset(skip)
        .limit(limit)
        .order_by(Test.created_at.desc())
    )
    result = await session.execute(query)
    tests = result.scalars().unique().all()
    return tests, total


async def update_test(session: AsyncSession, test: Test, data: TestUpdate) -> Test:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test, field, value)
    await session.commit()
    await session.refresh(test)
    return test


async def delete_test(session: AsyncSession, test: Test) -> None:
    await session.delete(test)
    await session.commit()


async def regenerate_link(session: AsyncSession, test: Test) -> Test:
    test.unique_link = str(uuid.uuid4())[:8]
    await session.commit()
    await session.refresh(test)
    return test


# --- Questions ---

async def add_question(
    session: AsyncSession, test_id: int, data: QuestionCreate
) -> Question:
    question = Question(
        test_id=test_id,
        text=data.text,
        question_type=data.question_type,
        order=data.order,
        is_required=data.is_required,
        scale_config=data.scale_config,
        branching_rules=data.branching_rules,
    )
    session.add(question)
    await session.flush()

    # Создаём варианты ответов
    for opt_data in data.options:
        option = Option(
            question_id=question.id,
            text=opt_data.text,
            order=opt_data.order,
            score=opt_data.score,
            metric_key=opt_data.metric_key,
        )
        session.add(option)

    await session.commit()
    await session.refresh(question)

    # Подгрузить options
    query = (
        select(Question)
        .where(Question.id == question.id)
        .options(selectinload(Question.options))
    )
    result = await session.execute(query)
    return result.scalar_one()


async def get_question_by_id(
    session: AsyncSession, question_id: int
) -> Optional[Question]:
    query = (
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.options))
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def update_question(
    session: AsyncSession, question: Question, data: QuestionUpdate
) -> Question:
    update_data = data.model_dump(exclude_unset=True, exclude={"options"})
    for field, value in update_data.items():
        setattr(question, field, value)

    # Обновление вариантов ответов
    if data.options is not None:
        # Удаляем старые options
        for old_opt in question.options:
            await session.delete(old_opt)

        # Создаём новые
        for opt_data in data.options:
            option = Option(
                question_id=question.id,
                text=opt_data.text or "",
                order=opt_data.order or 0,
                score=opt_data.score or 0.0,
                metric_key=opt_data.metric_key,
            )
            session.add(option)

    await session.commit()

    # Перезагрузить
    query = (
        select(Question)
        .where(Question.id == question.id)
        .options(selectinload(Question.options))
    )
    result = await session.execute(query)
    return result.scalar_one()


async def delete_question(session: AsyncSession, question: Question) -> None:
    await session.delete(question)
    await session.commit()


async def list_questions(
    session: AsyncSession, test_id: int
) -> List[Question]:
    query = (
        select(Question)
        .where(Question.test_id == test_id)
        .options(selectinload(Question.options))
        .order_by(Question.order)
    )
    result = await session.execute(query)
    return result.scalars().all()


async def bulk_update_questions(
    session: AsyncSession, test_id: int, questions_data: list[QuestionCreate]
) -> List[Question]:
    """Полная замена всех вопросов теста (для конструктора)."""
    # Удаляем все текущие в��просы
    existing = await list_questions(session, test_id)
    for q in existing:
        await session.delete(q)
    await session.flush()

    # Создаём новые
    result_questions = []
    for q_data in questions_data:
        question = await add_question(session, test_id, q_data)
        result_questions.append(question)

    return result_questions