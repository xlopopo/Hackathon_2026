from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_session
from app.core.dependencies import get_current_psychologist
from app.models.report_template import ReportTemplate
from app.models.test import Test
from app.models.question import Question
from app.models.user import User
from app.schemas.report import (
    ReportTemplateUpdate,
    ReportTemplateResponse,
)

router = APIRouter()

DEFAULT_CLIENT_BLOCKS = [
    {"type": "total_score", "enabled": True, "title": "Общий результат", "config": {}},
    {"type": "metrics", "enabled": True, "title": "Метрики", "config": {}},
    {"type": "interpretation", "enabled": True, "title": "Интерпретация", "config": {}},
    {"type": "recommendations", "enabled": False, "title": "Рекомендации", "config": {"text": ""}},
    {"type": "computed", "enabled": False, "title": "Вычисляемые показатели", "config": {}},
]

DEFAULT_PSYCHOLOGIST_BLOCKS = [
    {"type": "total_score", "enabled": True, "title": "Общий балл", "config": {}},
    {"type": "metrics", "enabled": True, "title": "Метрики", "config": {}},
    {"type": "answers_detail", "enabled": True, "title": "Детализация ответов", "config": {}},
    {"type": "raw_data", "enabled": False, "title": "Сырые данные (JSON)", "config": {}},
    {"type": "computed", "enabled": False, "title": "Вычисляемые показатели", "config": {}},
]


@router.get("/test/{test_id}", response_model=List[ReportTemplateResponse])
async def get_templates_for_test(
    test_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    test_result = await db.execute(select(Test).where(Test.id == test_id))
    test = test_result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    result = await db.execute(
        select(ReportTemplate).where(ReportTemplate.test_id == test_id)
    )
    templates = result.scalars().all()

    # Если нет шаблонов — создаём дефолтные
    if not templates:
        client_template = ReportTemplate(
            test_id=test_id,
            name="Отчёт для клиента",
            report_type="client",
            blocks=DEFAULT_CLIENT_BLOCKS,
            interpretations={},
        )
        psych_template = ReportTemplate(
            test_id=test_id,
            name="Отчёт для психолога",
            report_type="psychologist",
            blocks=DEFAULT_PSYCHOLOGIST_BLOCKS,
            interpretations={},
        )
        db.add(client_template)
        db.add(psych_template)
        await db.commit()

        result = await db.execute(
            select(ReportTemplate).where(ReportTemplate.test_id == test_id)
        )
        templates = result.scalars().all()

    return [ReportTemplateResponse.model_validate(t) for t in templates]


@router.get("/test/{test_id}/metrics")
async def get_test_metrics(
    test_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    """
    Автосписок метрик для конструктора интерпретаций.
    Берём:
    - Option.metric_key
    - Question.scale_config.metric_key
    """
    result = await db.execute(
        select(Test)
        .where(Test.id == test_id)
        .options(
            selectinload(Test.questions).selectinload(Question.options),
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    if current_user.role != "admin" and test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    metric_keys = set()

    for q in test.questions:
        # option.metric_key
        for opt in q.options:
            if opt.metric_key:
                metric_keys.add(opt.metric_key)

        # scale_config.metric_key
        if q.scale_config and isinstance(q.scale_config, dict):
            mk = q.scale_config.get("metric_key")
            if mk:
                metric_keys.add(mk)

    return {"metrics": sorted(metric_keys)}


@router.get("/{template_id}", response_model=ReportTemplateResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    result = await db.execute(
        select(ReportTemplate)
        .where(ReportTemplate.id == template_id)
        .options(selectinload(ReportTemplate.test))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    if current_user.role != "admin" and template.test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    return ReportTemplateResponse.model_validate(template)


@router.patch("/{template_id}", response_model=ReportTemplateResponse)
async def update_template(
    template_id: int,
    data: ReportTemplateUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_psychologist),
):
    result = await db.execute(
        select(ReportTemplate)
        .where(ReportTemplate.id == template_id)
        .options(selectinload(ReportTemplate.test))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    if current_user.role != "admin" and template.test.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    update_data = data.model_dump(exclude_unset=True)

    if "blocks" in update_data and update_data["blocks"] is not None:
        update_data["blocks"] = [
            b.model_dump() if hasattr(b, "model_dump") else b
            for b in update_data["blocks"]
        ]

    if "interpretations" in update_data and update_data["interpretations"] is not None:
        if not isinstance(update_data["interpretations"], dict):
            raise HTTPException(status_code=400, detail="interpretations должен быть объектом")

    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return ReportTemplateResponse.model_validate(template)