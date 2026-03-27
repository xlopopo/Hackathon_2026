from pydantic import BaseModel
from typing import Optional, List


class OptionCreate(BaseModel):
    text: str
    order: int = 0
    score: float = 0.0
    metric_key: Optional[str] = None


class OptionUpdate(BaseModel):
    id: Optional[int] = None
    text: Optional[str] = None
    order: Optional[int] = None
    score: Optional[float] = None
    metric_key: Optional[str] = None


class OptionResponse(BaseModel):
    id: int
    text: str
    order: int
    score: float
    metric_key: Optional[str]

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    text: str
    question_type: str = "single_choice"
    order: int = 0
    is_required: bool = True
    scale_config: Optional[dict] = None
    branching_rules: Optional[dict] = None
    options: List[OptionCreate] = []


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    question_type: Optional[str] = None
    order: Optional[int] = None
    is_required: Optional[bool] = None
    scale_config: Optional[dict] = None
    branching_rules: Optional[dict] = None
    options: Optional[List[OptionUpdate]] = None


class QuestionResponse(BaseModel):
    id: int
    test_id: int
    text: str
    question_type: str
    order: int
    is_required: bool
    scale_config: Optional[dict]
    branching_rules: Optional[dict]
    options: List[OptionResponse] = []

    class Config:
        from_attributes = True


class QuestionPublicResponse(BaseModel):
    """Вопрос для клиента (без баллов)."""
    id: int
    text: str
    question_type: str
    order: int
    is_required: bool
    scale_config: Optional[dict]
    options: List["OptionPublicResponse"] = []

    class Config:
        from_attributes = True


class OptionPublicResponse(BaseModel):
    """Вариант ответа для клиента (без баллов)."""
    id: int
    text: str
    order: int

    class Config:
        from_attributes = True


QuestionPublicResponse.model_rebuild()