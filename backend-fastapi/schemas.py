from pydantic import BaseModel, Field
from typing import Optional, List

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
# ===========================
# Budget Schemas
# ===========================

class BudgetCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., pattern="^(income|expense)$")
    icon: Optional[str] = Field(None, max_length=8)
    color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    sort_order: int = Field(0, ge=0)


class BudgetCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=8)
    color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    sort_order: Optional[int] = Field(None, ge=0)


class BudgetCategoryResponse(BaseModel):
    id: str
    name: str
    type: str
    icon: Optional[str]
    color: Optional[str]
    sort_order: int
    created_at: int

    class Config:
        from_attributes = True


class BudgetTransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    type: str = Field(..., pattern="^(income|expense)$")
    category_id: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    details: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)


class BudgetTransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    category_id: Optional[str] = None
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    details: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)


class BudgetTransactionResponse(BaseModel):
    id: str
    amount: float
    type: str
    category_id: str
    category_name: Optional[str] = None       # ← للعرض
    category_icon: Optional[str] = None       # ← للعرض
    category_color: Optional[str] = None      # ← للعرض
    date: str
    details: Optional[str]
    description: Optional[str]
    created_at: int


class BudgetSummaryCategory(BaseModel):
    category_id: str
    category_name: str
    category_icon: Optional[str]
    category_color: Optional[str]
    total: float
    count: int


class BudgetSummaryResponse(BaseModel):
    month: str
    total_income: float
    total_expense: float
    net: float
    transaction_count: int
    by_category: list[BudgetSummaryCategory] = []


class BudgetImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str] = []
