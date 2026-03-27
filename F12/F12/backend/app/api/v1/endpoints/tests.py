from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.dependencies import get_current_user, get_current_psychologist
from app.services.test_service import (
    create_test,
    get_test_by_id,
    get_test_by_link,
    list_tests_by_owner,
    list_all_tests,
    update_test,
    delete_test,
    regenerate_link,
)
from app.schemas.test import TestCreate, TestUpdate, TestResponse, TestListResponse, TestPublicResponse
from app.schemas.question import QuestionPublicResponse, OptionPublicResponse
from app.models.test import Test
from app.models.user import User

router = APIRouter()

DEFAULT_CLIENT_FIELDS = {
    "fields": [
        {"key": "full_name", "label": "ФИО", "required": True, "enabled": True, "removable": False},
        {"key": "email", "label": "Email", "required": False, "enabled": True, "removable": True},
    ]
}


async def _load_test_with_relations(session: AsyncSession, test_id: int):
    """Загрузить тест со всеми relations через selectinload."""
    result = await session.execute(
        select(Test)
        .where(Test.id == test_id)
        .options(
            selectinload(Test.questions),
            selectinload(Test.sessions),
        )
    )
    return result.scalar_one_or_none()


@router.post("/", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
async def create_test_endpoint(
    data: TestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await create_test(session, data, current_user.id)
    test = await _load_test_with_relations(session, test.id)
    return _test_to_response(test)


@router.get("/", response_model=TestListResponse)
async def list_tests_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "admin":
        tests, total = await list_all_tests(session, skip=skip, limit=limit)
    else:
        tests, total = await list_tests_by_owner(session, current_user.id, skip=skip, limit=limit)
    return TestListResponse(
        tests=[_test_to_response(t) for t in tests],
        total=total,
    )


@router.get("/by-link/{unique_link}", response_model=TestPublicResponse)
async def get_test_by_link_endpoint(
    unique_link: str,
    session: AsyncSession = Depends(get_session),
):
    test = await get_test_by_link(session, unique_link)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден или не опубликован")

    questions = []
    for q in sorted(test.questions, key=lambda x: x.order):
        options = [
            OptionPublicResponse(id=o.id, text=o.text, order=o.order)
            for o in sorted(q.options, key=lambda x: x.order)
        ]
        questions.append(
            QuestionPublicResponse(
                id=q.id, text=q.text, question_type=q.question_type,
                order=q.order, is_required=q.is_required,
                scale_config=q.scale_config, options=options,
            )
        )

    client_fields = test.client_fields or DEFAULT_CLIENT_FIELDS

    return TestPublicResponse(
        id=test.id,
        title=test.title,
        description=test.description,
        client_fields=client_fields,
        questions=questions,
    )


@router.get("/{test_id}", response_model=TestResponse)
async def get_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    test = await get_test_by_id(session, test_id, with_relations=True)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому тесту")
    return _test_to_response(test)


@router.patch("/{test_id}", response_model=TestResponse)
async def update_test_endpoint(
    test_id: int,
    data: TestUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await _load_test_with_relations(session, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    updated = await update_test(session, test, data)
    updated = await _load_test_with_relations(session, test_id)
    return _test_to_response(updated)


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await get_test_by_id(session, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    await delete_test(session, test)


@router.post("/{test_id}/regenerate-link", response_model=TestResponse)
async def regenerate_link_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test = await get_test_by_id(session, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    await regenerate_link(session, test)
    updated = await _load_test_with_relations(session, test_id)
    return _test_to_response(updated)


def _test_to_response(test) -> TestResponse:
    """Безопасное создание ответа без lazy load."""
    questions_count = 0
    sessions_count = 0

    if 'questions' in test.__dict__ and test.__dict__['questions'] is not None:
        questions_count = len(test.__dict__['questions'])

    if 'sessions' in test.__dict__ and test.__dict__['sessions'] is not None:
        sessions_count = len(test.__dict__['sessions'])

    return TestResponse(
        id=test.id,
        title=test.title,
        description=test.description,
        owner_id=test.owner_id,
        is_published=test.is_published,
        unique_link=test.unique_link,
        show_result_to_client=test.show_result_to_client,
        scoring_config=test.scoring_config,
        client_fields=test.client_fields or DEFAULT_CLIENT_FIELDS,
        created_at=test.created_at,
        updated_at=test.updated_at,
        questions_count=questions_count,
        sessions_count=sessions_count,
    )