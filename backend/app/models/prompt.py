from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class HarmCategory(Base):
    __tablename__ = "harm_categories"

    id = Column(Integer, primary_key=True)
    key = Column(String(80), unique=True, nullable=False)
    display_name = Column(String(160), nullable=False)


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True)
    harm_category_id = Column(Integer, ForeignKey("harm_categories.id"), nullable=False)
    language = Column(String(40), nullable=False)
    track = Column(String(40), nullable=False)
    prompt_text = Column(Text, nullable=False)
    intent_summary = Column(Text, nullable=False)
    source_seed_id = Column(String(120), nullable=True)
    risk_level_hint = Column(String(40), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
