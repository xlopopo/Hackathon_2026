from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Dict, Any, Optional

from app.models.session import Session
from app.models.answer import Answer
from app.models.question import Question
from app.models.option import Option
from app.models.test import Test


async def calculate_results(
    db_session: AsyncSession, session: Session
) -> Dict[str, Any]:
    """
    Подсчёт баллов и метрик для завершённой сессии.

    Алгоритм:
    1. Собираем все ответы сессии
    2. Для каждого ответа определяем баллы по метрикам
    3. Суммируем баллы по каждой метрике
    4. Применяем формулы из scoring_config теста (если есть)
    """
    # Загружаем тест с конфигурацией
    test_result = await db_session.execute(
        select(Test).where(Test.id == session.test_id)
    )
    test = test_result.scalar_one_or_none()
    if not test:
        return {}

    # Загружаем ответы с вопросами и опциями
    answers_result = await db_session.execute(
        select(Answer)
        .where(Answer.session_id == session.id)
        .options(
            selectinload(Answer.question).selectinload(Question.options)
        )
    )
    answers = answers_result.scalars().all()

    # Словарь метрик: metric_key -> total_score
    metrics: Dict[str, float] = {}
    total_score = 0.0

    for answer in answers:
        question = answer.question
        if not question:
            continue

        if answer.selected_option_id:
            # Одиночный выбор
            option = next(
                (o for o in question.options if o.id == answer.selected_option_id),
                None,
            )
            if option:
                total_score += option.score
                if option.metric_key:
                    metrics[option.metric_key] = (
                        metrics.get(option.metric_key, 0) + option.score
                    )

        elif answer.selected_option_ids:
            # Множественный выбор
            for opt_id in answer.selected_option_ids:
                option = next(
                    (o for o in question.options if o.id == opt_id), None
                )
                if option:
                    total_score += option.score
                    if option.metric_key:
                        metrics[option.metric_key] = (
                            metrics.get(option.metric_key, 0) + option.score
                        )

        elif answer.scale_value is not None:
            # Шкала — добавляем как "общий балл" или к метрике вопроса
            total_score += answer.scale_value
            # Если у вопроса есть scale_config с metric_key
            if question.scale_config and question.scale_config.get("metric_key"):
                mk = question.scale_config["metric_key"]
                metrics[mk] = metrics.get(mk, 0) + answer.scale_value

    # Применяем формулы из scoring_config (если есть)
    computed = {}
    if test.scoring_config and "formulas" in test.scoring_config:
        for formula_name, formula in test.scoring_config["formulas"].items():
            try:
                # Простой eval с контекстом метрик (для MVP)
                result = eval(formula, {"__builtins__": {}}, metrics)
                computed[formula_name] = round(result, 2)
            except Exception:
                computed[formula_name] = None

    results = {
        "total_score": round(total_score, 2),
        "metrics": metrics,
        "computed": computed,
        "answers_count": len(answers),
    }

    return results