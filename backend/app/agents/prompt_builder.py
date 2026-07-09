import json

from sqlalchemy.orm import Session

from app.models.audit import AuditRun
from app.models.prompt import HarmCategory, Prompt


def build_prompt_set(db: Session, audit_run: AuditRun) -> list[Prompt]:
    languages = set(json.loads(audit_run.languages))
    category_keys = set(json.loads(audit_run.harm_categories))
    tracks = []
    if audit_run.include_translation_track:
        tracks.append("translation_baseline")
    if audit_run.include_native_track:
        tracks.append("native_adapted")

    return (
        db.query(Prompt)
        .join(HarmCategory, Prompt.harm_category_id == HarmCategory.id)
        .filter(Prompt.language.in_(languages))
        .filter(Prompt.track.in_(tracks))
        .filter(HarmCategory.key.in_(category_keys))
        .all()
    )
