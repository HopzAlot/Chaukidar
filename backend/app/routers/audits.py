import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.audit_runner import run_audit
from app.database import SessionLocal, get_db
from app.models.audit import AuditResult, AuditRun
from app.models.prompt import HarmCategory, Prompt
from app.schemas.audit import AuditResultRead, AuditRunCreate, AuditRunRead

router = APIRouter(prefix="/api/audits", tags=["audits"])


def serialize_audit(audit: AuditRun) -> dict:
    return {
        "id": audit.id,
        "target_model_id": audit.target_model_id,
        "name": audit.name,
        "languages": json.loads(audit.languages),
        "harm_categories": json.loads(audit.harm_categories),
        "include_translation_track": audit.include_translation_track,
        "include_native_track": audit.include_native_track,
        "status": audit.status,
        "progress_current": audit.progress_current,
        "progress_total": audit.progress_total,
        "started_at": audit.started_at,
        "completed_at": audit.completed_at,
        "created_at": audit.created_at,
    }


def serialize_result(result: AuditResult, prompt: Prompt | None, category: HarmCategory | None) -> dict:
    return {
        "id": result.id,
        "audit_run_id": result.audit_run_id,
        "prompt_id": result.prompt_id,
        "seed_id": prompt.source_seed_id if prompt else None,
        "harm_category": category.key if category else None,
        "harm_category_display": category.display_name if category else None,
        "language": prompt.language if prompt else None,
        "track": prompt.track if prompt else None,
        "intent_summary": prompt.intent_summary if prompt else None,
        "raw_response_text": result.raw_response_text,
        "label": result.label,
        "confidence": result.confidence,
        "judge_explanation": result.judge_explanation,
        "risk_score": result.risk_score,
        "latency_ms": result.latency_ms,
        "created_at": result.created_at,
    }


async def run_audit_task(audit_id: int) -> None:
    db = SessionLocal()
    try:
        await run_audit(db, audit_id)
    finally:
        db.close()


@router.post("/create", response_model=AuditRunRead)
def create_audit(payload: AuditRunCreate, db: Session = Depends(get_db)):
    audit = AuditRun(
        target_model_id=payload.target_model_id,
        name=payload.name,
        languages=json.dumps(payload.languages),
        harm_categories=json.dumps(payload.harm_categories),
        include_translation_track=payload.include_translation_track,
        include_native_track=payload.include_native_track,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return serialize_audit(audit)


@router.get("", response_model=list[AuditRunRead])
def list_audits(db: Session = Depends(get_db)):
    audits = db.query(AuditRun).order_by(AuditRun.created_at.desc()).all()
    return [serialize_audit(audit) for audit in audits]


@router.post("/{audit_id}/run")
def start_audit(audit_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    audit = db.get(AuditRun, audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.status != "pending":
        raise HTTPException(status_code=409, detail=f"Audit is already {audit.status}")
    background_tasks.add_task(run_audit_task, audit_id)
    return {"status": "started", "audit_id": audit_id}


@router.get("/{audit_id}", response_model=AuditRunRead)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.get(AuditRun, audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    return serialize_audit(audit)


@router.get("/{audit_id}/results", response_model=list[AuditResultRead])
def get_results(
    audit_id: int,
    language: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(AuditResult, Prompt, HarmCategory)
        .join(Prompt, AuditResult.prompt_id == Prompt.id)
        .join(HarmCategory, Prompt.harm_category_id == HarmCategory.id)
        .filter(AuditResult.audit_run_id == audit_id)
    )
    if language:
        query = query.filter(Prompt.language == language)
    if category:
        query = query.filter(HarmCategory.key == category)
    rows = query.order_by(AuditResult.id).all()
    return [serialize_result(result, prompt, category) for result, prompt, category in rows]
