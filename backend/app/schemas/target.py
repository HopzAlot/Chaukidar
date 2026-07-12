from datetime import datetime

from pydantic import BaseModel


class TargetModelCreate(BaseModel):
    name: str
    endpoint_type: str = "mock"
    endpoint_url: str = "mock://local"
    api_key_ref: str | None = None


class TargetModelRead(TargetModelCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
