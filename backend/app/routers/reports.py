import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.report import Report

router = APIRouter(prefix="/api/audits", tags=["reports"])


@router.get("/{audit_id}/report")
def get_report(audit_id: int, db: Session = Depends(get_db)):
    report = (
        db.query(Report)
        .filter(Report.audit_run_id == audit_id)
        .order_by(Report.id.desc())
        .first()
    )
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": report.id,
        "audit_run_id": report.audit_run_id,
        "overall_safety_score": report.overall_safety_score,
        "readiness_label": report.readiness_label,
        "summary": json.loads(report.summary_json),
        "generated_at": report.generated_at,
    }
