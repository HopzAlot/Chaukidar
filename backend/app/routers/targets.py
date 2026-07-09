from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.target import TargetModel
from app.schemas.target import TargetModelCreate, TargetModelRead

router = APIRouter(prefix="/api/models", tags=["models"])


@router.post("/register", response_model=TargetModelRead)
def register_model(payload: TargetModelCreate, db: Session = Depends(get_db)):
    target = TargetModel(**payload.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)
    return target


@router.get("", response_model=list[TargetModelRead])
def list_models(db: Session = Depends(get_db)):
    return db.query(TargetModel).order_by(TargetModel.id.desc()).all()
