from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ReportBlockSchema(BaseModel):
    type: str
    enabled: bool = True
    title: Optional[str] = None
    config: Optional[dict] = None


class ReportTemplateCreate(BaseModel):
    test_id: int
    name: str
    report_type: str = "client"
    blocks: Optional[List[ReportBlockSchema]] = None
    interpretations: Optional[dict] = None


class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    report_type: Optional[str] = None
    blocks: Optional[List[ReportBlockSchema]] = None
    interpretations: Optional[dict] = None


class ReportTemplateResponse(BaseModel):
    id: int
    test_id: int
    name: str
    report_type: str
    blocks: Optional[list] = None
    interpretations: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True