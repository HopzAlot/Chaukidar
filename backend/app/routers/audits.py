import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.audit_runner import run_audit
from app.database import SessionLocal, get_db
from app.models.audit import AuditResult, AuditRun
from app.schemas.audit import AuditResultRead, AuditRunCreate, AuditRunRead

router = APIRouter(prefix="/api/audits", tags=["audits"])


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
    return audit


@router.post("/{audit_id}/run")
def start_audit(audit_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    audit = db.get(AuditRun, audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    background_tasks.add_task(run_audit_task, audit_id)
    return {"status": "started", "audit_id": audit_id}


@router.get("/{audit_id}", response_model=AuditRunRead)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.get(AuditRun, audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@router.get("/{audit_id}/results", response_model=list[AuditResultRead])
def get_results(audit_id: int, db: Session = Depends(get_db)):
    return db.query(AuditResult).filter(AuditResult.audit_run_id == audit_id).all()
