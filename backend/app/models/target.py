from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class TargetModel(Base):
    __tablename__ = "target_models"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    endpoint_type = Column(String(40), default="mock")
    endpoint_url = Column(String(500), default="mock://local")
    api_key_ref = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
