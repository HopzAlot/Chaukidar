from fastapi import FastAPI
from sqlalchemy import inspect, text

from app.database import Base, SessionLocal, engine
from app.models.prompt import Prompt
from app.routers import audits, datasets, reports, targets

Base.metadata.create_all(bind=engine)


def ensure_runtime_schema() -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    columns = {column["name"] for column in inspect(engine).get_columns("audit_runs")}
    if "include_english_track" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE audit_runs ADD COLUMN include_english_track BOOLEAN DEFAULT 1"))


ensure_runtime_schema()


def seed_database_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.query(Prompt).count() > 0:
            return
        from scripts.seed_db import seed_database

        seeded = seed_database(db, only_if_empty=True)
        print(f"Seeded Chaukidar database on startup. Added {seeded} prompts.", flush=True)
    finally:
        db.close()


seed_database_if_empty()

app = FastAPI(
    title="Chaukidar API",
    description="Multilingual AI safety audit backend for South Asian languages.",
    version="0.1.0",
)

app.include_router(targets.router)
app.include_router(audits.router)
app.include_router(datasets.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "chaukidar"}
