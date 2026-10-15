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


class GroupItemCreate(BaseModel):
    zekr_id: str
    target: int | None = None


class GroupItemUpdate(BaseModel):
    target: int | None = None
    position: int | None = None


class GroupCreate(BaseModel):
    name: str
    description: str | None = None


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class GroupItemResponse(BaseModel):
    id: int
    zekr_id: str
    text: str          # ← نرجّع النص كذلك
    position: int
    target: int | None = None
    default_target: int | None = None

    class Config:
        from_attributes = True


class GroupResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    created_at: int
    items: list[GroupItemResponse] = []

    class Config:
        from_attributes = True
