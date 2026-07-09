from fastapi import FastAPI

from app.database import Base, engine
from app.routers import audits, reports, targets

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DesiGuard API",
    description="Multilingual AI safety audit backend for South Asian languages.",
    version="0.1.0",
)

app.include_router(targets.router)
app.include_router(audits.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "desiguard"}
