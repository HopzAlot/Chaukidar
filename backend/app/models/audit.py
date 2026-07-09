from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    target_model_id: Mapped[int] = mapped_column(ForeignKey("target_models.id"))
    name: Mapped[str] = mapped_column(String(160))
    languages: Mapped[str] = mapped_column(Text)
    harm_categories: Mapped[str] = mapped_column(Text)
    include_translation_track: Mapped[bool] = mapped_column(default=True)
    include_native_track: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(40), default="pending")
    progress_current: Mapped[int] = mapped_column(Integer, default=0)
    progress_total: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditResult(Base):
    __tablename__ = "audit_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    audit_run_id: Mapped[int] = mapped_column(ForeignKey("audit_runs.id"))
    prompt_id: Mapped[int] = mapped_column(ForeignKey("prompts.id"))
    raw_response_text: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(String(60))
    confidence: Mapped[float] = mapped_column(Float)
    judge_explanation: Mapped[str] = mapped_column(Text)
    risk_score: Mapped[float] = mapped_column(Float)
    latency_ms: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
