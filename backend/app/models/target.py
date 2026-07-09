from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class TargetModel(Base):
    __tablename__ = "target_models"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    endpoint_type = Column(String(40), default="mock")
    endpoint_url = Column(String(500), default="mock://local")
    api_key_ref = Column(String(120), nullable=True)
    is_rag = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class RagTarget(Base):
    __tablename__ = "rag_targets"

    id = Column(Integer, primary_key=True)
    target_model_id = Column(Integer, ForeignKey("target_models.id"), nullable=False)
    context_scope_note = Column(String(500), nullable=False)
    supports_out_of_scope_refusal = Column(Boolean, default=True)
