import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.agents.audit_runner import run_audit
from app.models.audit import AuditResult, AuditRun
from app.models.prompt import HarmCategory, Prompt
from app.models.target import TargetModel
from app.routers import audits, datasets, reports, targets
from app.routers.targets import sync_fireworks_models_from_env

Base.metadata.create_all(bind=engine)


def ensure_runtime_schema() -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    columns = {column["name"] for column in inspect(engine).get_columns("audit_runs")}
    if "include_english_track" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE audit_runs ADD COLUMN include_english_track BOOLEAN DEFAULT 1"))


ensure_runtime_schema()


def seed_database_if_empty() -> int:
    db = SessionLocal()
    try:
        if db.query(Prompt).count() > 0:
            return 0
        from scripts.seed_db import seed_database

        seeded = seed_database(db, only_if_empty=True)
        print(f"Seeded Chaukidar database on startup. Added {seeded} prompts.", flush=True)
        return seeded
    finally:
        db.close()


def create_startup_demo_audits() -> list[int]:
    db = SessionLocal()
    try:
        existing_resume_ids = [
            audit_id
            for (audit_id,) in db.query(AuditRun.id)
            .filter(AuditRun.status.in_(["pending", "running"]))
            .order_by(AuditRun.id)
            .all()
        ]
        if existing_resume_ids:
            db.query(AuditResult).filter(AuditResult.audit_run_id.in_(existing_resume_ids)).delete(synchronize_session=False)
            db.query(AuditRun).filter(AuditRun.id.in_(existing_resume_ids)).update(
                {
                    AuditRun.status: "pending",
                    AuditRun.progress_current: 0,
                    AuditRun.progress_total: 0,
                    AuditRun.started_at: None,
                    AuditRun.completed_at: None,
                },
                synchronize_session=False,
            )
            db.commit()
            return existing_resume_ids

        if db.query(AuditRun).count() > 0:
            return []
        sync_fireworks_models_from_env(db)
        fireworks_targets = (
            db.query(TargetModel)
            .filter(TargetModel.endpoint_type == "fireworks")
            .order_by(TargetModel.id)
            .all()
        )
        if not fireworks_targets or db.query(Prompt).count() == 0:
            return []

        languages = sorted({language for (language,) in db.query(Prompt.language).distinct().all()})
        categories = sorted({key for (key,) in db.query(HarmCategory.key).distinct().all()})
        audit_ids: list[int] = []
        for target in fireworks_targets:
            audit = AuditRun(
                target_model_id=target.id,
                name=target.name,
                languages=json.dumps(languages),
                harm_categories=json.dumps(categories),
                include_english_track=True,
                include_translation_track=True,
                include_native_track=True,
                status="pending",
            )
            db.add(audit)
            db.flush()
            audit_ids.append(audit.id)
        db.commit()
        return audit_ids
    finally:
        db.close()


async def run_startup_demo_audits(audit_ids: list[int]) -> None:
    for audit_id in audit_ids:
        db = SessionLocal()
        try:
            await run_audit(db, audit_id)
        except Exception as exc:
            print(f"Startup demo audit {audit_id} failed: {type(exc).__name__}: {exc}", flush=True)
        finally:
            db.close()


seed_database_if_empty()

app = FastAPI(
    title="Chaukidar API",
    description="Multilingual AI safety audit backend for South Asian languages.",
    version="0.1.0",
)

allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(targets.router)
app.include_router(audits.router)
app.include_router(datasets.router)
app.include_router(reports.router)


@app.on_event("startup")
async def bootstrap_demo_audits() -> None:
    if not settings.enable_startup_demo_audits:
        return
    audit_ids = create_startup_demo_audits()
    if audit_ids:
        print(f"Created startup demo audits: {audit_ids}", flush=True)
        asyncio.create_task(run_startup_demo_audits(audit_ids))


@app.get("/health")
def health():
    return {"status": "ok", "service": "chaukidar"}
