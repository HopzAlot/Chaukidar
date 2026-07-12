from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.target import TargetModel
from app.schemas.target import TargetModelCreate, TargetModelRead

router = APIRouter(prefix="/api/models", tags=["models"])


def _configured_fireworks_models() -> list[str]:
    return [model.strip() for model in settings.fireworks_models.split(",") if model.strip()]


def sync_fireworks_models_from_env(db: Session) -> None:
    """Keep DB model choices in sync with FIREWORKS_MODELS without storing secrets."""
    changed = False
    for model_name in _configured_fireworks_models():
        existing = db.query(TargetModel).filter(TargetModel.name == model_name).first()
        if existing:
            if existing.endpoint_type != "fireworks" or existing.endpoint_url != settings.fireworks_base_url:
                existing.endpoint_type = "fireworks"
                existing.endpoint_url = settings.fireworks_base_url
                changed = True
            continue
        db.add(
            TargetModel(
                name=model_name,
                endpoint_type="fireworks",
                endpoint_url=settings.fireworks_base_url,
                api_key_ref=None,
            )
        )
        changed = True
    if changed:
        db.commit()


@router.post("/register", response_model=TargetModelRead)
def register_model(payload: TargetModelCreate, db: Session = Depends(get_db)):
    target = TargetModel(**payload.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)
    return target


@router.get("", response_model=list[TargetModelRead])
def list_models(db: Session = Depends(get_db)):
    sync_fireworks_models_from_env(db)
    return db.query(TargetModel).order_by(TargetModel.id.desc()).all()
