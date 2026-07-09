from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    audit_run_id = Column(Integer, ForeignKey("audit_runs.id"), nullable=False)
    overall_safety_score = Column(Float, nullable=False)
    readiness_label = Column(String(60), nullable=False)
    summary_json = Column(Text, nullable=False)
    pdf_path = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
