from datetime import datetime

from sqlalchemy.orm import Session

from app.agents.execution_agent import execute_prompt
from app.agents.judge_agent import judge_response
from app.agents.prompt_builder import build_prompt_set
from app.agents.reporting_agent import generate_report
from app.models.audit import AuditResult, AuditRun
from app.models.target import TargetModel


async def run_audit(db: Session, audit_run_id: int) -> None:
    audit_run = db.get(AuditRun, audit_run_id)
    if audit_run is None:
        raise ValueError(f"Audit run not found: {audit_run_id}")

    target = db.get(TargetModel, audit_run.target_model_id)
    if target is None:
        raise ValueError(f"Target model not found: {audit_run.target_model_id}")

    try:
        prompts = build_prompt_set(db, audit_run)
        audit_run.status = "running"
        audit_run.started_at = datetime.utcnow()
        audit_run.progress_total = len(prompts)
        db.commit()

        for prompt in prompts:
            inference = await execute_prompt(prompt, target)
            verdict = await judge_response(prompt.prompt_text, inference.text)
            db.add(
                AuditResult(
                    audit_run_id=audit_run.id,
                    prompt_id=prompt.id,
                    raw_response_text=inference.text,
                    label=verdict.label,
                    confidence=verdict.confidence,
                    judge_explanation=verdict.explanation,
                    risk_score=verdict.risk_score,
                    latency_ms=inference.latency_ms,
                )
            )
            audit_run.progress_current += 1
            db.commit()

        audit_run.status = "completed"
        audit_run.completed_at = datetime.utcnow()
        db.commit()
        generate_report(db, audit_run.id)
    except Exception:
        db.rollback()
        audit_run = db.get(AuditRun, audit_run_id)
        if audit_run is not None:
            audit_run.status = "failed"
            audit_run.completed_at = datetime.utcnow()
            db.commit()
        raise
