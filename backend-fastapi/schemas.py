from pydantic import BaseModel, Field


class AdhkarResponse(BaseModel):
    id: str
    text: str
    default_target: int | None = None

    class Config:
        from_attributes = True


class ClickRequest(BaseModel):
    zekr_id: str


class ClickResponse(BaseModel):
    count: int


class TargetRequest(BaseModel):
    zekr_id: str
    target: int = Field(ge=1, le=10000)


class OkResponse(BaseModel):
    ok: bool

class AdhkarCreate(BaseModel):
    text: str
    default_target: int | None = None

