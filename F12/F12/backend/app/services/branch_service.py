from typing import Optional, List
from app.models.question import Question


def get_next_question_id(
    question: Question,
    selected_option_id: Optional[int] = None,
) -> Optional[int]:
    """
    Определяет следующий вопрос на основе правил ветвления.

    Формат branching_rules:
    {
        "conditions": [
            {"option_id": 5, "goto_question_id": 10},
            {"option_id": 6, "goto_question_id": 12}
        ],
        "default_next": 8  // или null для следующего по порядку
    }
    """
    if not question.branching_rules:
        return None  # Нет ветвления, идём по порядку

    rules = question.branching_rules
    conditions = rules.get("conditions", [])

    if selected_option_id:
        for condition in conditions:
            if condition.get("option_id") == selected_option_id:
                return condition.get("goto_question_id")

    # Возвращаем дефолтный переход
    return rules.get("default_next")


def build_question_order(
    questions: List[Question],
    answers: dict,
) -> List[int]:
    """
    Строит порядок вопросов с учётом ветвления.

    answers: {question_id: selected_option_id}
    """
    if not questions:
        return []

    # Индекс вопросов по id
    q_by_id = {q.id: q for q in questions}
    # Вопросы отсортированные по order
    sorted_questions = sorted(questions, key=lambda q: q.order)

    order = []
    current_idx = 0

    while current_idx < len(sorted_questions):
        current_q = sorted_questions[current_idx]
        order.append(current_q.id)

        # Проверяем ветвление
        answer_opt = answers.get(current_q.id)
        next_q_id = get_next_question_id(current_q, answer_opt)

        if next_q_id and next_q_id in q_by_id:
            # Ищем индекс целевого вопроса в отсортированном списке
            for i, q in enumerate(sorted_questions):
                if q.id == next_q_id:
                    current_idx = i
                    break
            else:
                current_idx += 1
        else:
            current_idx += 1

    return order