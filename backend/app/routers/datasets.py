from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.prompt import HarmCategory, Prompt
from app.schemas.dataset import CustomDatasetImportResult, CustomDatasetPayload

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

ALLOWED_TRACKS = {"english_seed", "translation_baseline", "native_adapted"}
ALLOWED_RISK_HINTS = {"low", "medium", "high"}


def _validate_payload(payload: CustomDatasetPayload, db: Session) -> tuple[list[dict], int]:
    if not payload.records:
        raise HTTPException(status_code=422, detail="Dataset must contain at least one prompt record.")
    if len(payload.records) > 2000:
        raise HTTPException(status_code=422, detail="Dataset is too large. Maximum 2000 records per upload.")

    categories = {category.key: category for category in db.query(HarmCategory).all()}
    normalized: list[dict] = []
    generated = 0
    seen_keys: set[tuple[str, str, str]] = set()

    for index, record in enumerate(payload.records, start=1):
        category = categories.get(record.harm_category)
        if category is None:
            allowed = ", ".join(sorted(categories))
            raise HTTPException(status_code=422, detail=f"Record {index}: unknown harm_category '{record.harm_category}'. Allowed: {allowed}")
        if record.track not in ALLOWED_TRACKS:
            allowed = ", ".join(sorted(ALLOWED_TRACKS))
            raise HTTPException(status_code=422, detail=f"Record {index}: unknown track '{record.track}'. Allowed: {allowed}")
        if record.risk_level_hint not in ALLOWED_RISK_HINTS:
            allowed = ", ".join(sorted(ALLOWED_RISK_HINTS))
            raise HTTPException(status_code=422, detail=f"Record {index}: unknown risk_level_hint '{record.risk_level_hint}'. Allowed: {allowed}")
        language = record.language.strip().lower()
        if not language:
            raise HTTPException(status_code=422, detail=f"Record {index}: language is required.")
        prompt_text = record.prompt_text.strip()
        intent_summary = record.intent_summary.strip()
        if not prompt_text:
            raise HTTPException(status_code=422, detail=f"Record {index}: prompt_text is required.")
        if not intent_summary:
            raise HTTPException(status_code=422, detail=f"Record {index}: intent_summary is required.")
        if len(prompt_text) > 4000:
            raise HTTPException(status_code=422, detail=f"Record {index}: prompt_text is too long. Maximum 4000 characters.")

        seed_id = (record.seed_id or "").strip()
        if not seed_id:
            seed_id = f"custom_{uuid4().hex[:12]}"
            generated += 1

        key = (seed_id, language, record.track)
        if key in seen_keys:
            raise HTTPException(status_code=422, detail=f"Record {index}: duplicate seed_id/language/track in uploaded file: {seed_id}/{language}/{record.track}")
        seen_keys.add(key)

        normalized.append({
            "category": category,
            "language": language,
            "track": record.track,
            "prompt_text": prompt_text,
            "intent_summary": intent_summary,
            "source_seed_id": seed_id,
            "risk_level_hint": record.risk_level_hint,
        })
    return normalized, generated


def _result(records: list[dict], imported: int, updated: int, generated_seed_ids: int) -> CustomDatasetImportResult:
    return CustomDatasetImportResult(
        imported=imported,
        updated=updated,
        generated_seed_ids=generated_seed_ids,
        languages=sorted({record["language"] for record in records}),
        harm_categories=sorted({record["category"].key for record in records}),
        tracks=sorted({record["track"] for record in records}),
    )


@router.post("/custom/validate", response_model=CustomDatasetImportResult)
def validate_custom_dataset(payload: CustomDatasetPayload, db: Session = Depends(get_db)):
    records, generated = _validate_payload(payload, db)
    return _result(records, imported=len(records), updated=0, generated_seed_ids=generated)


@router.post("/custom/import", response_model=CustomDatasetImportResult)
def import_custom_dataset(payload: CustomDatasetPayload, db: Session = Depends(get_db)):
    records, generated = _validate_payload(payload, db)
    imported = 0
    updated = 0
    seed_ids = {record["source_seed_id"] for record in records}
    existing_prompts = {
        (prompt.source_seed_id, prompt.language, prompt.track): prompt
        for prompt in db.query(Prompt).filter(Prompt.source_seed_id.in_(seed_ids)).all()
    }

    for record in records:
        key = (record["source_seed_id"], record["language"], record["track"])
        existing = existing_prompts.get(key)
        if existing:
            existing.harm_category_id = record["category"].id
            existing.prompt_text = record["prompt_text"]
            existing.intent_summary = record["intent_summary"]
            existing.risk_level_hint = record["risk_level_hint"]
            updated += 1
            continue
        prompt = Prompt(
            harm_category_id=record["category"].id,
            language=record["language"],
            track=record["track"],
            prompt_text=record["prompt_text"],
            intent_summary=record["intent_summary"],
            source_seed_id=record["source_seed_id"],
            risk_level_hint=record["risk_level_hint"],
        )
        db.add(prompt)
        existing_prompts[key] = prompt
        imported += 1
    db.commit()
    return _result(records, imported=imported, updated=updated, generated_seed_ids=generated)
