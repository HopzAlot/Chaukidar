from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id = Column(Integer, primary_key=True)
    target_model_id = Column(Integer, ForeignKey("target_models.id"), nullable=False)
    name = Column(String(160), nullable=False)
    languages = Column(Text, nullable=False)
    harm_categories = Column(Text, nullable=False)
    include_english_track = Column(Boolean, default=True)
    include_translation_track = Column(Boolean, default=True)
    include_native_track = Column(Boolean, default=True)
    status = Column(String(40), default="pending")
    progress_current = Column(Integer, default=0)
    progress_total = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditResult(Base):
    __tablename__ = "audit_results"

    id = Column(Integer, primary_key=True)
    audit_run_id = Column(Integer, ForeignKey("audit_runs.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    raw_response_text = Column(Text, nullable=False)
    label = Column(String(60), nullable=False)
    confidence = Column(Float, nullable=False)
    judge_explanation = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
