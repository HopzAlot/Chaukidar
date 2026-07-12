import asyncio
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from app.agents.execution_agent import execute_prompt_text
from app.agents.judge_agent import judge_response
from app.agents.prompt_builder import build_prompt_set
from app.agents.reporting_agent import generate_report
from app.config import settings
from app.models.audit import AuditResult, AuditRun
from app.models.target import TargetModel


@dataclass(frozen=True)
class PromptWorkItem:
    prompt_id: int
    prompt_text: str


@dataclass(frozen=True)
class TargetConfig:
    endpoint_type: str
    model_name: str
    endpoint_url: str | None


@dataclass(frozen=True)
class CompletedPrompt:
    prompt_id: int
    raw_response_text: str
    label: str
    confidence: float
    judge_explanation: str
    risk_score: float
    latency_ms: int


def _snapshot_prompts(audit_run: AuditRun, db: Session) -> list[PromptWorkItem]:
    return [
        PromptWorkItem(prompt_id=prompt.id, prompt_text=prompt.prompt_text)
        for prompt in build_prompt_set(db, audit_run)
    ]


def _snapshot_target(target: TargetModel) -> TargetConfig:
    return TargetConfig(
        endpoint_type=target.endpoint_type,
        model_name=target.name,
        endpoint_url=target.endpoint_url,
    )


async def _run_prompt(item: PromptWorkItem, target: TargetConfig, semaphore: asyncio.Semaphore) -> CompletedPrompt:
    async with semaphore:
        inference = await execute_prompt_text(
            item.prompt_text,
            endpoint_type=target.endpoint_type,
            model_name=target.model_name,
            endpoint_url=target.endpoint_url,
        )
        verdict = await judge_response(item.prompt_text, inference.text)
        return CompletedPrompt(
            prompt_id=item.prompt_id,
            raw_response_text=inference.text,
            label=verdict.label,
            confidence=verdict.confidence,
            judge_explanation=verdict.explanation,
            risk_score=verdict.risk_score,
            latency_ms=inference.latency_ms,
        )


def _persist_completed_prompt(db: Session, audit_run: AuditRun, completed: CompletedPrompt) -> None:
    db.add(
        AuditResult(
            audit_run_id=audit_run.id,
            prompt_id=completed.prompt_id,
            raw_response_text=completed.raw_response_text,
            label=completed.label,
            confidence=completed.confidence,
            judge_explanation=completed.judge_explanation,
            risk_score=completed.risk_score,
            latency_ms=completed.latency_ms,
        )
    )
    audit_run.progress_current += 1


async def run_audit(db: Session, audit_run_id: int) -> None:
    audit_run = db.get(AuditRun, audit_run_id)
    if audit_run is None:
        raise ValueError(f"Audit run not found: {audit_run_id}")

    target = db.get(TargetModel, audit_run.target_model_id)
    if target is None:
        raise ValueError(f"Target model not found: {audit_run.target_model_id}")

    tasks: list[asyncio.Task[CompletedPrompt]] = []

    try:
        prompts = _snapshot_prompts(audit_run, db)
        target_config = _snapshot_target(target)
        audit_run.status = "running"
        audit_run.started_at = datetime.utcnow()
        audit_run.progress_current = 0
        audit_run.progress_total = len(prompts)
        db.commit()

        concurrency = max(1, settings.audit_concurrency)
        commit_interval = max(1, settings.audit_progress_commit_interval)
        semaphore = asyncio.Semaphore(concurrency)
        tasks = [asyncio.create_task(_run_prompt(prompt, target_config, semaphore)) for prompt in prompts]

        for task in asyncio.as_completed(tasks):
            completed = await task
            _persist_completed_prompt(db, audit_run, completed)
            if audit_run.progress_current % commit_interval == 0 or audit_run.progress_current == audit_run.progress_total:
                db.commit()

        audit_run.status = "completed"
        audit_run.completed_at = datetime.utcnow()
        db.commit()
        generate_report(db, audit_run.id)
    except Exception:
        for task in tasks:
            if not task.done():
                task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        db.rollback()
        audit_run = db.get(AuditRun, audit_run_id)
        if audit_run is not None:
            audit_run.status = "failed"
            audit_run.completed_at = datetime.utcnow()
            db.commit()
        raise
