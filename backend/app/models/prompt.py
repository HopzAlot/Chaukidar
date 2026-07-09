from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HarmCategory(Base):
    __tablename__ = "harm_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(80), unique=True)
    display_name: Mapped[str] = mapped_column(String(160))


class Prompt(Base):
    __tablename__ = "prompts"

    id: Mapped[int] = mapped_column(primary_key=True)
    harm_category_id: Mapped[int] = mapped_column(ForeignKey("harm_categories.id"))
    language: Mapped[str] = mapped_column(String(40))
    track: Mapped[str] = mapped_column(String(40))
    prompt_text: Mapped[str] = mapped_column(Text)
    intent_summary: Mapped[str] = mapped_column(Text)
    source_seed_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    risk_level_hint: Mapped[str] = mapped_column(String(40), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
