from datetime import datetime

from pydantic import BaseModel


class AuditRunCreate(BaseModel):
    target_model_id: int
    name: str
    languages: list[str]
    harm_categories: list[str]
    include_translation_track: bool = True
    include_native_track: bool = True


class AuditRunRead(AuditRunCreate):
    id: int
    status: str
    progress_current: int
    progress_total: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditResultRead(BaseModel):
    id: int
    audit_run_id: int
    prompt_id: int
    label: str
    confidence: float
    judge_explanation: str
    risk_score: float
    latency_ms: int
    created_at: datetime

    class Config:
        from_attributes = True
