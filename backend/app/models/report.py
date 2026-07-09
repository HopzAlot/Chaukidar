from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    audit_run_id: Mapped[int] = mapped_column(ForeignKey("audit_runs.id"))
    overall_safety_score: Mapped[float] = mapped_column(Float)
    readiness_label: Mapped[str] = mapped_column(String(60))
    summary_json: Mapped[str] = mapped_column(Text)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
