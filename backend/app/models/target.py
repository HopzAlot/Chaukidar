from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TargetModel(Base):
    __tablename__ = "target_models"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    endpoint_type: Mapped[str] = mapped_column(String(40), default="mock")
    endpoint_url: Mapped[str] = mapped_column(String(500), default="mock://local")
    api_key_ref: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_rag: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RagTarget(Base):
    __tablename__ = "rag_targets"

    id: Mapped[int] = mapped_column(primary_key=True)
    target_model_id: Mapped[int] = mapped_column(ForeignKey("target_models.id"))
    context_scope_note: Mapped[str] = mapped_column(String(500))
    supports_out_of_scope_refusal: Mapped[bool] = mapped_column(Boolean, default=True)
