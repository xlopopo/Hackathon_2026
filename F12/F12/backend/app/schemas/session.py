from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SessionCreate(BaseModel):
    test_id: int
    client_name: Optional[str] = None
    client_email: Optional[str] = None


class AnswerCreate(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    selected_option_ids: Optional[List[int]] = None
    text_value: Optional[str] = None
    scale_value: Optional[int] = None


class SubmitAnswersRequest(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    answers: List[AnswerCreate]


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    selected_option_id: Optional[int]
    selected_option_ids: Optional[list]
    text_value: Optional[str]
    scale_value: Optional[int]

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: int
    test_id: int
    client_name: Optional[str]
    client_email: Optional[str]
    status: str
    results: Optional[dict]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class SessionDetailResponse(SessionResponse):
    answers: List[AnswerResponse] = []
    test_title: Optional[str] = None


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]
    total: int