"""
Budget API — نظام إدارة الدخل والمصروف

Endpoints:
  Categories:
    GET    /api/budget/categories
    POST   /api/budget/categories
    PUT    /api/budget/categories/{id}
    DELETE /api/budget/categories/{id}
  
  Transactions:
    GET    /api/budget/transactions
    POST   /api/budget/transactions
    PUT    /api/budget/transactions/{id}
    DELETE /api/budget/transactions/{id}
  
  Summary:
    GET    /api/budget/summary?month=YYYY-MM
  
  Import:
    POST   /api/budget/import
"""
import calendar
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
import io
import csv
import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import BudgetCategory, BudgetTransaction,BudgetLimit
from schemas import (
    BudgetCategoryCreate,
    BudgetCategoryUpdate,
    BudgetCategoryResponse,
    BudgetTransactionCreate,
    BudgetTransactionUpdate,
    BudgetTransactionResponse,
    BudgetSummaryResponse,
    BudgetSummaryCategory,
    BudgetImportResult,
    BudgetLimitCreate,    
    BudgetLimitUpdate,    
    BudgetLimitItem,      
    BudgetLimitsResponse, 
    BudgetInsightsResponse,
    BudgetInsightTopDay,
    BudgetInsightTopCategory,
    BudgetInsightComparison,
)
from dependencies import get_db
router = APIRouter(prefix="/api/budget", tags=["budget"])

# ===========================
# Helpers
# ===========================

def _now_ms() -> int:
    return int(time.time() * 1000)


def _category_or_404(db: Session, category_id: str) -> BudgetCategory:
    cat = db.get(BudgetCategory, category_id)
    if not cat:
        raise HTTPException(404, "التصنيف غير موجود")
    return cat


def _transaction_or_404(db: Session, txn_id: str) -> BudgetTransaction:
    txn = db.get(BudgetTransaction, txn_id)
    if not txn:
        raise HTTPException(404, "المعاملة غير موجودة")
    return txn


def _to_txn_response(txn: BudgetTransaction, cat: BudgetCategory) -> BudgetTransactionResponse:
    return BudgetTransactionResponse(
        id=txn.id,
        amount=txn.amount,
        type=txn.type,
        category_id=txn.category_id,
        category_name=cat.name if cat else None,
        category_icon=cat.icon if cat else None,
        category_color=cat.color if cat else None,
        date=txn.date,
        details=txn.details,
        description=txn.description,
        created_at=txn.created_at,
    )


def _validate_category_type_match(cat: BudgetCategory, txn_type: str) -> None:
    if cat.type != txn_type:
        raise HTTPException(
            400,
            f"نوع التصنيف ({cat.type}) لا يطابق نوع المعاملة ({txn_type})",
        )


# ===========================
# CATEGORIES
# ===========================

@router.get("/categories", response_model=list[BudgetCategoryResponse])
def list_categories(
    type: str | None = Query(None, pattern="^(income|expense)$"),
    db: Session = Depends(get_db),
):
    """قائمة كل التصنيفات (مرتبة حسب النوع ثم sort_order)"""
    q = db.query(BudgetCategory)
    if type:
        q = q.filter(BudgetCategory.type == type)
    return q.order_by(BudgetCategory.type, BudgetCategory.sort_order, BudgetCategory.name).all()


@router.post("/categories", response_model=BudgetCategoryResponse)
def create_category(data: BudgetCategoryCreate, db: Session = Depends(get_db)):
    """إضافة تصنيف جديد"""
    # منع التكرار (نفس الاسم + نفس النوع)
    existing = (
        db.query(BudgetCategory)
        .filter(
            BudgetCategory.name == data.name.strip(),
            BudgetCategory.type == data.type,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "يوجد تصنيف بنفس الاسم بالفعل")

    cat = BudgetCategory(
        id=f"cat_{uuid.uuid4().hex[:12]}",
        name=data.name.strip(),
        type=data.type,
        icon=data.icon,
        color=data.color,
        sort_order=data.sort_order,
        created_at=_now_ms(),
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{cat_id}", response_model=BudgetCategoryResponse)
def update_category(
    cat_id: str,
    data: BudgetCategoryUpdate,
    db: Session = Depends(get_db),
):
    """تعديل تصنيف"""
    cat = _category_or_404(db, cat_id)

    if data.name is not None:
        new_name = data.name.strip()
        # تحقق من التكرار لو غيّر الاسم
        if new_name != cat.name:
            dup = (
                db.query(BudgetCategory)
                .filter(
                    BudgetCategory.name == new_name,
                    BudgetCategory.type == cat.type,
                    BudgetCategory.id != cat_id,
                )
                .first()
            )
            if dup:
                raise HTTPException(400, "يوجد تصنيف بنفس الاسم بالفعل")
        cat.name = new_name

    if data.icon is not None:
        cat.icon = data.icon
    if data.color is not None:
        cat.color = data.color
    if data.sort_order is not None:
        cat.sort_order = data.sort_order

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}")
def delete_category(cat_id: str, db: Session = Depends(get_db)):
    """حذف تصنيف (يفشل لو فيه معاملات مرتبطة)"""
    cat = _category_or_404(db, cat_id)

    txn_count = (
        db.query(BudgetTransaction)
        .filter(BudgetTransaction.category_id == cat_id)
        .count()
    )
    if txn_count > 0:
        raise HTTPException(
            400,
            f"يوجد {txn_count} معاملة مرتبطة بهذا التصنيف. احذفها أو انقلها أولاً",
        )

    db.delete(cat)
    db.commit()
    return {"ok": True}


# ===========================
# TRANSACTIONS
# ===========================

@router.get("/transactions", response_model=list[BudgetTransactionResponse])
def list_transactions(
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    from_date: str | None = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    to_date: str | None = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    type: str | None = Query(None, pattern="^(income|expense)$"),
    category_id: str | None = None,
    search: str | None = None,
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """قائمة المعاملات مع فلاتر متقدمة"""
    q = db.query(BudgetTransaction)

    if month:
        q = q.filter(BudgetTransaction.date.like(f"{month}-%"))
    if from_date:
        q = q.filter(BudgetTransaction.date >= from_date)
    if to_date:
        q = q.filter(BudgetTransaction.date <= to_date)
    if type:
        q = q.filter(BudgetTransaction.type == type)
    if category_id:
        q = q.filter(BudgetTransaction.category_id == category_id)
    if search:
        pattern = f"%{search.strip()}%"
        q = q.filter(
            (BudgetTransaction.details.ilike(pattern))
            | (BudgetTransaction.description.ilike(pattern))
        )

    rows = (
        q.order_by(BudgetTransaction.date.desc(), BudgetTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # جلب التصنيفات دفعة واحدة (تفادي N+1)
    cat_ids = {r.category_id for r in rows}
    cats = (
        db.query(BudgetCategory)
        .filter(BudgetCategory.id.in_(cat_ids))
        .all()
        if cat_ids else []
    )
    cat_map = {c.id: c for c in cats}

    return [_to_txn_response(r, cat_map.get(r.category_id)) for r in rows]


@router.post("/transactions", response_model=BudgetTransactionResponse)
def create_transaction(data: BudgetTransactionCreate, db: Session = Depends(get_db)):
    """إضافة معاملة جديدة"""
    cat = _category_or_404(db, data.category_id)
    _validate_category_type_match(cat, data.type)

    txn = BudgetTransaction(
        id=f"txn_{uuid.uuid4().hex[:12]}",
        amount=round(data.amount, 2),
        type=data.type,
        category_id=data.category_id,
        date=data.date,
        details=data.details.strip() if data.details else None,
        description=data.description.strip() if data.description else None,
        created_at=_now_ms(),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _to_txn_response(txn, cat)


@router.put("/transactions/{txn_id}", response_model=BudgetTransactionResponse)
def update_transaction(
    txn_id: str,
    data: BudgetTransactionUpdate,
    db: Session = Depends(get_db),
):
    """تعديل معاملة"""
    txn = _transaction_or_404(db, txn_id)

    # حسم الـ type الجديد
    new_type = data.type if data.type is not None else txn.type
    new_cat_id = data.category_id if data.category_id is not None else txn.category_id

    # التحقق من التصنيف الجديد
    new_cat = _category_or_404(db, new_cat_id)
    _validate_category_type_match(new_cat, new_type)

    if data.amount is not None:
        txn.amount = round(data.amount, 2)
    if data.type is not None:
        txn.type = data.type
    if data.category_id is not None:
        txn.category_id = data.category_id
    if data.date is not None:
        txn.date = data.date
    if data.details is not None:
        txn.details = data.details.strip() or None
    if data.description is not None:
        txn.description = data.description.strip() or None

    db.commit()
    db.refresh(txn)
    return _to_txn_response(txn, new_cat)


@router.delete("/transactions/{txn_id}")
def delete_transaction(txn_id: str, db: Session = Depends(get_db)):
    """حذف معاملة"""
    txn = _transaction_or_404(db, txn_id)
    db.delete(txn)
    db.commit()
    return {"ok": True}


# ===========================
# SUMMARY
# ===========================

@router.get("/summary", response_model=BudgetSummaryResponse)
def get_summary(
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    """ملخص شهري + توزيع حسب التصنيف. لو month فاضي، يجمع كل الفترات."""
    base_q = db.query(BudgetTransaction)
    if month:
        base_q = base_q.filter(BudgetTransaction.date.like(f"{month}-%"))

    # إجماليات عامة (استعلام واحد)
    totals = (
        base_q.with_entities(
            BudgetTransaction.type,
            func.count(BudgetTransaction.id),
            func.coalesce(func.sum(BudgetTransaction.amount), 0.0),
        )
        .group_by(BudgetTransaction.type)
        .all()
    )

    total_income = 0.0
    total_expense = 0.0
    total_count = 0
    for t, count, total in totals:
        if t == "income":
            total_income = float(total)
        elif t == "expense":
            total_expense = float(total)
        total_count += count

    # توزيع حسب التصنيف
    by_cat_q = db.query(
        BudgetTransaction.category_id,
        func.count(BudgetTransaction.id),
        func.sum(BudgetTransaction.amount),
    )
    if month:
        by_cat_q = by_cat_q.filter(BudgetTransaction.date.like(f"{month}-%"))

    by_cat_rows = (
        by_cat_q
        .group_by(BudgetTransaction.category_id)
        .order_by(func.sum(BudgetTransaction.amount).desc())
        .all()
    )

    cat_ids = [r[0] for r in by_cat_rows]
    cats = (
        db.query(BudgetCategory)
        .filter(BudgetCategory.id.in_(cat_ids))
        .all()
        if cat_ids else []
    )
    cat_map = {c.id: c for c in cats}

    by_category = []
    for cat_id, count, total in by_cat_rows:
        cat = cat_map.get(cat_id)
        by_category.append(
            BudgetSummaryCategory(
                category_id=cat_id,
                category_name=cat.name if cat else "غير محدد",
                category_icon=cat.icon if cat else None,
                category_color=cat.color if cat else None,
                total=round(float(total), 2),
                count=count,
            )
        )

    return BudgetSummaryResponse(
        month=month or "all",
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        net=round(total_income - total_expense, 2),
        transaction_count=total_count,
        by_category=by_category,
    )
# ===========================
# IMPORT CSV (اختياري — للمرونة)
# ===========================

@router.post("/import", response_model=BudgetImportResult)
async def import_csv(
    file: UploadFile = File(...),
    default_type: str = Query("expense", pattern="^(income|expense)$"),
    db: Session = Depends(get_db),
):
    """
    استيراد معاملات من CSV.
    
    **الـ CSV المتوقع:**
    - `date`: YYYY/MM/DD أو YYYY-MM-DD
    - `amount`: رقم موجب
    - `category_id`: معرّف أو اسم التصنيف (سيتم المطابقة بالاسم أو id)
    - `details`, `description`: نصوص اختيارية
    
    **ملاحظات:**
    - التصنيفات لازم تكون موجودة مسبقاً (تُضاف من `/categories`)
    - الصفوف بدون تصنيف مطابق يتم تخطيها
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "الملف يجب أن يكون بصيغة CSV")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # BOM-safe
    except UnicodeDecodeError:
        raise HTTPException(400, "الملف ليس UTF-8. احفظه UTF-8 من Excel")

    reader = csv.DictReader(io.StringIO(text))
    expected = {"date", "amount", "category_id"}
    if not expected.issubset(set(reader.fieldnames or [])):
        raise HTTPException(400, f"الأعمدة المطلوبة: {expected}")

    # بناء خريطة التصنيفات (id + name → object)
    all_cats = db.query(BudgetCategory).all()
    cat_by_key = {}
    for c in all_cats:
        cat_by_key[c.id] = c
        cat_by_key[c.name.strip()] = c

    imported = 0
    skipped = 0
    errors: list[str] = []

    def parse_date(s: str) -> str:
        s = s.strip()
        for sep in ("/", "-"):
            if sep in s:
                parts = s.split(sep)
                if len(parts) == 3:
                    y, m, d = parts
                    return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
        raise ValueError(f"invalid date: {s}")

    # جمع كل الصفوف ثم commit دفعة واحدة
    new_txns = []
    for row_num, row in enumerate(reader, start=2):
        try:
            cat_key = (row.get("category_id") or "").strip()
            cat = cat_by_key.get(cat_key)
            if not cat:
                errors.append(f"row {row_num}: تصنيف غير معروف '{cat_key}'")
                skipped += 1
                continue

            amount_str = (row.get("amount") or "").strip().replace(",", "")
            amount = float(amount_str)
            if amount <= 0:
                errors.append(f"row {row_num}: المبلغ يجب أن يكون موجباً")
                skipped += 1
                continue

            txn_type = cat.type  # نأخذ نوع التصنيف
            date_str = parse_date(row.get("date") or "")

            new_txns.append(BudgetTransaction(
                id=f"txn_{uuid.uuid4().hex[:12]}",
                amount=round(amount, 2),
                type=txn_type,
                category_id=cat.id,
                date=date_str,
                details=(row.get("details") or "").strip() or None,
                description=(row.get("description") or "").strip() or None,
                created_at=_now_ms(),
            ))
            imported += 1

        except Exception as e:
            errors.append(f"row {row_num}: {e}")
            skipped += 1

    if new_txns:
        db.bulk_save_objects(new_txns)
        db.commit()

    return BudgetImportResult(
        imported=imported,
        skipped=skipped,
        errors=errors[:50],  # أول 50 خطأ فقط
    )
# ===========================
# MONTHLY TREND (للرسوم البيانية)
# ===========================

@router.get("/monthly-trend")
def get_monthly_trend(
    months: int = Query(6, ge=1, le=24),
    end_month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    """
    آخر N شهر — إجمالي دخل ومصروف لكل شهر.
    
    - لو end_month متبعت: ينتهي عنده (مثلاً "2023-02" → 2022-09..2023-02)
    - لو مش متبعت: ينتهي عند الشهر الحالي
    """
    # نحدد نقطة النهاية
    if end_month:
        y_end = int(end_month[:4])
        m_end = int(end_month[5:7])
    else:
        now = datetime.now()
        y_end = now.year
        m_end = now.month

    # نبني الـ buckets من الأقدم للأحدث
    buckets = []
    for i in range(months - 1, -1, -1):
        y = y_end
        m = m_end - i
        while m <= 0:
            m += 12
            y -= 1
        buckets.append(f"{y}-{m:02d}")

    # تجميع البيانات
    results = []
    for bucket in buckets:
        rows = (
            db.query(
                BudgetTransaction.type,
                func.coalesce(func.sum(BudgetTransaction.amount), 0),
            )
            .filter(BudgetTransaction.date.like(f"{bucket}-%"))
            .group_by(BudgetTransaction.type)
            .all()
        )

        income = 0.0
        expense = 0.0
        for t, total in rows:
            if t == "income":
                income = float(total)
            elif t == "expense":
                expense = float(total)

        results.append({
            "month": bucket,
            "income": round(income, 2),
            "expense": round(expense, 2),
            "net": round(income - expense, 2),
        })

    return results

# ===========================
# BACKUP / RESTORE / DELETE ALL
# ===========================

@router.get("/backup")
def export_budget_backup(db: Session = Depends(get_db)):
    """تصدير كل بيانات الميزانية كـ JSON"""
    cats = db.query(BudgetCategory).all()
    txns = db.query(BudgetTransaction).all()

    return {
        "version": "1.0",
        "exported_at": int(time.time() * 1000),
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "type": c.type,
                "icon": c.icon,
                "color": c.color,
                "sort_order": c.sort_order,
                "created_at": c.created_at,
            }
            for c in cats
        ],
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "category_id": t.category_id,
                "date": t.date,
                "details": t.details,
                "description": t.description,
                "created_at": t.created_at,
            }
            for t in txns
        ],
    }


@router.post("/restore")
def import_budget_backup(data: dict, db: Session = Depends(get_db)):
    """استيراد نسخة احتياطية (يحذف الموجود ويستبدل)"""
    try:
        # مسح الموجود
        db.query(BudgetTransaction).delete()
        db.query(BudgetCategory).delete()
        db.flush()

        # استرجاع التصنيفات
        cat_id_map = {}  # old_id → new_id
        for cat in data.get("categories", []):
            new_id = cat.get("id") or f"cat_{uuid.uuid4().hex[:12]}"
            db.add(BudgetCategory(
                id=new_id,
                name=cat["name"],
                type=cat["type"],
                icon=cat.get("icon"),
                color=cat.get("color"),
                sort_order=cat.get("sort_order", 0),
                created_at=cat.get("created_at", int(time.time() * 1000)),
            ))
            cat_id_map[cat.get("id")] = new_id
        db.flush()

        # استرجاع المعاملات
        imported_txns = 0
        for txn in data.get("transactions", []):
            old_cat_id = txn.get("category_id")
            new_cat_id = cat_id_map.get(old_cat_id, old_cat_id)

            # تحقق من وجود التصنيف
            if not db.get(BudgetCategory, new_cat_id):
                continue

            db.add(BudgetTransaction(
                id=txn.get("id") or f"txn_{uuid.uuid4().hex[:12]}",
                amount=float(txn["amount"]),
                type=txn["type"],
                category_id=new_cat_id,
                date=txn["date"],
                details=txn.get("details"),
                description=txn.get("description"),
                created_at=txn.get("created_at", int(time.time() * 1000)),
            ))
            imported_txns += 1

        db.commit()
        return {
            "ok": True,
            "categories": len(data.get("categories", [])),
            "transactions": imported_txns,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"فشل الاستيراد: {str(e)}")


@router.delete("/data/all")
def delete_all_budget_data(
    keep_categories: bool = Query(False),
    db: Session = Depends(get_db),
):
    """حذف شامل — أو مسح المعاملات فقط مع إبقاء التصنيفات"""
    try:
        db.query(BudgetTransaction).delete()
        if not keep_categories:
            db.query(BudgetCategory).delete()
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"فشل المسح: {str(e)}")

# ===========================
# CSV EXPORT / IMPORT
# ===========================

@router.get("/export-csv")
def export_budget_csv(db: Session = Depends(get_db)):
    """تصدير كل المعاملات كـ CSV (مع بيانات التصنيف)"""
    rows = (
        db.query(BudgetTransaction, BudgetCategory)
        .join(BudgetCategory, BudgetTransaction.category_id == BudgetCategory.id)
        .order_by(
            BudgetTransaction.date.desc(),
            BudgetTransaction.created_at.desc(),
        )
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    # Header
    writer.writerow([
        "date",
        "type",
        "amount",
        "category",
        "category_icon",
        "category_color",
        "details",
        "description",
    ])

    for txn, cat in rows:
        writer.writerow([
            txn.date,
            txn.type,
            txn.amount,
            cat.name,
            cat.icon or "",
            cat.color or "",
            txn.details or "",
            txn.description or "",
        ])

    buffer.seek(0)
    # utf-8-sig عشان Excel يقرأ العربي صح
    content = buffer.getvalue().encode("utf-8-sig")

    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"budget-backup-{date_str}.csv"

    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import-csv")
async def import_budget_csv(
    file: UploadFile = File(...),
    clear_existing: bool = Query(False),
    db: Session = Depends(get_db),
):
    """
    استيراد معاملات من CSV.
    
    - `clear_existing=true`: مسح كل المعاملات أولاً (استبدال)
    - `clear_existing=false`: إضافة (merge) — قد يسبب تكرار
    
    يبني التصنيفات تلقائيًا لو مش موجودة (بالاسم + النوع).
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "الملف يجب أن يكون بصيغة CSV")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(400, "الملف ليس UTF-8")

    reader = csv.DictReader(io.StringIO(text))

    required = {"date", "type", "amount", "category"}
    missing = required - set(reader.fieldnames or [])
    if missing:
        raise HTTPException(400, f"أعمدة مفقودة: {missing}")

    # مسح اختياري
    if clear_existing:
        db.query(BudgetTransaction).delete()
        db.flush()

    # خريطة التصنيفات الموجودة: (name, type) → object
    existing_cats = db.query(BudgetCategory).all()
    cat_map = {(c.name, c.type): c for c in existing_cats}

    imported = 0
    created_cats = 0
    skipped = 0
    errors: list[str] = []

    def clean(v):
        return (v or "").replace("\r", "").strip()

    for row_num, row in enumerate(reader, start=2):
        try:
            txn_type = clean(row.get("type"))
            if txn_type not in ("income", "expense"):
                skipped += 1
                errors.append(f"row {row_num}: type غير صالح ({txn_type!r})")
                continue

            amount_str = clean(row.get("amount")).replace(",", "")
            amount = float(amount_str)
            if amount <= 0:
                skipped += 1
                errors.append(f"row {row_num}: amount يجب أن يكون موجباً")
                continue

            date_str = clean(row.get("date"))
            if (
                len(date_str) != 10
                or date_str[4] != "-"
                or date_str[7] != "-"
            ):
                skipped += 1
                errors.append(f"row {row_num}: date غير صالح ({date_str!r})")
                continue

            cat_name = clean(row.get("category")) or "غير محدد"
            cat_icon = clean(row.get("category_icon")) or None
            cat_color = clean(row.get("category_color")) or None

            # البحث/إنشاء التصنيف
            key = (cat_name, txn_type)
            cat = cat_map.get(key)
            if not cat:
                cat = BudgetCategory(
                    id=f"cat_{uuid.uuid4().hex[:12]}",
                    name=cat_name,
                    type=txn_type,
                    icon=cat_icon or "📦",
                    color=cat_color or "#64748b",
                    sort_order=0,
                    created_at=int(time.time() * 1000),
                )
                db.add(cat)
                db.flush()
                cat_map[key] = cat
                created_cats += 1

            txn = BudgetTransaction(
                id=f"txn_{uuid.uuid4().hex[:12]}",
                amount=round(amount, 2),
                type=txn_type,
                category_id=cat.id,
                date=date_str,
                details=clean(row.get("details")) or None,
                description=clean(row.get("description")) or None,
                created_at=int(time.time() * 1000),
            )
            db.add(txn)
            imported += 1

            if imported % 500 == 0:
                db.commit()

        except Exception as e:
            skipped += 1
            errors.append(f"row {row_num}: {e}")

    db.commit()

    return {
        "ok": True,
        "imported": imported,
        "created_categories": created_cats,
        "skipped": skipped,
        "errors": errors[:20],
    }
# ===========================
# MONTHLY LIMITS (الميزانية الشهرية)
# ===========================

def _limit_status(percent: float) -> str:
    """حالة الميزانية حسب نسبة الاستهلاك"""
    if percent >= 100:
        return "over"
    if percent >= 75:
        return "warning"
    return "safe"


@router.get("/limits", response_model=BudgetLimitsResponse)
def list_limits(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    """قائمة الميزانيات الشهرية + التقدم لكل تصنيف"""
    limits = (
        db.query(BudgetLimit)
        .filter(BudgetLimit.month == month)
        .all()
    )

    # جلب التصنيفات دفعة واحدة
    cat_ids = [l.category_id for l in limits]
    cats = (
        db.query(BudgetCategory)
        .filter(BudgetCategory.id.in_(cat_ids))
        .all()
        if cat_ids else []
    )
    cat_map = {c.id: c for c in cats}

    # حساب المصروف لكل تصنيف في الشهر
    spent_rows = (
        db.query(
            BudgetTransaction.category_id,
            func.coalesce(func.sum(BudgetTransaction.amount), 0),
        )
        .filter(
            BudgetTransaction.date.like(f"{month}-%"),
            BudgetTransaction.type == "expense",
        )
        .group_by(BudgetTransaction.category_id)
        .all()
    )
    spent_map = {cid: float(total) for cid, total in spent_rows}

    items: list[BudgetLimitItem] = []
    total_limit = 0.0
    total_spent = 0.0

    for lim in limits:
        cat = cat_map.get(lim.category_id)
        spent = round(spent_map.get(lim.category_id, 0.0), 2)
        remaining = round(lim.amount - spent, 2)
        percent = (
            round((spent / lim.amount) * 100, 1)
            if lim.amount > 0 else 0
        )

        items.append(
            BudgetLimitItem(
                id=lim.id,
                category_id=lim.category_id,
                category_name=cat.name if cat else "غير محدد",
                category_icon=cat.icon if cat else None,
                category_color=cat.color if cat else None,
                amount=round(lim.amount, 2),
                spent=spent,
                remaining=remaining,
                percent=percent,
                status=_limit_status(percent),
            )
        )

        total_limit += lim.amount
        total_spent += spent

    total_remaining = total_limit - total_spent
    total_percent = (
        round((total_spent / total_limit) * 100, 1)
        if total_limit > 0 else 0
    )

    return BudgetLimitsResponse(
        month=month,
        limits=items,
        total_limit=round(total_limit, 2),
        total_spent=round(total_spent, 2),
        total_remaining=round(total_remaining, 2),
        total_percent=total_percent,
    )


@router.post("/limits", response_model=BudgetLimitItem)
def create_or_update_limit(
    data: BudgetLimitCreate,
    db: Session = Depends(get_db),
):
    """إنشاء أو تحديث ميزانية (UPSERT)"""
    cat = db.get(BudgetCategory, data.category_id)
    if not cat:
        raise HTTPException(404, "التصنيف غير موجود")
    if cat.type != "expense":
        raise HTTPException(400, "الميزانية للتصنيفات المصروفات فقط")

    existing = (
        db.query(BudgetLimit)
        .filter(
            BudgetLimit.category_id == data.category_id,
            BudgetLimit.month == data.month,
        )
        .first()
    )

    now = _now_ms()

    if existing:
        existing.amount = round(data.amount, 2)
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        lim = existing
    else:
        lim = BudgetLimit(
            id=f"lim_{uuid.uuid4().hex[:12]}",
            category_id=data.category_id,
            month=data.month,
            amount=round(data.amount, 2),
            created_at=now,
            updated_at=now,
        )
        db.add(lim)
        db.commit()
        db.refresh(lim)

    # حساب المصروف
    spent = (
        db.query(func.coalesce(func.sum(BudgetTransaction.amount), 0))
        .filter(
            BudgetTransaction.category_id == lim.category_id,
            BudgetTransaction.date.like(f"{lim.month}-%"),
            BudgetTransaction.type == "expense",
        )
        .scalar()
    ) or 0.0
    spent = float(spent)

    percent = (
        round((spent / lim.amount) * 100, 1)
        if lim.amount > 0 else 0
    )

    return BudgetLimitItem(
        id=lim.id,
        category_id=lim.category_id,
        category_name=cat.name,
        category_icon=cat.icon,
        category_color=cat.color,
        amount=round(lim.amount, 2),
        spent=round(spent, 2),
        remaining=round(lim.amount - spent, 2),
        percent=percent,
        status=_limit_status(percent),
    )


@router.put("/limits/{limit_id}", response_model=BudgetLimitItem)
def update_limit(
    limit_id: str,
    data: BudgetLimitUpdate,
    db: Session = Depends(get_db),
):
    """تعديل مبلغ ميزانية موجودة"""
    lim = db.get(BudgetLimit, limit_id)
    if not lim:
        raise HTTPException(404, "الميزانية غير موجودة")

    lim.amount = round(data.amount, 2)
    lim.updated_at = _now_ms()
    db.commit()
    db.refresh(lim)

    cat = db.get(BudgetCategory, lim.category_id)

    spent = (
        db.query(func.coalesce(func.sum(BudgetTransaction.amount), 0))
        .filter(
            BudgetTransaction.category_id == lim.category_id,
            BudgetTransaction.date.like(f"{lim.month}-%"),
            BudgetTransaction.type == "expense",
        )
        .scalar()
    ) or 0.0
    spent = float(spent)

    percent = (
        round((spent / lim.amount) * 100, 1)
        if lim.amount > 0 else 0
    )

    return BudgetLimitItem(
        id=lim.id,
        category_id=lim.category_id,
        category_name=cat.name if cat else "غير محدد",
        category_icon=cat.icon if cat else None,
        category_color=cat.color if cat else None,
        amount=round(lim.amount, 2),
        spent=round(spent, 2),
        remaining=round(lim.amount - spent, 2),
        percent=percent,
        status=_limit_status(percent),
    )


@router.delete("/limits/{limit_id}")
def delete_limit(limit_id: str, db: Session = Depends(get_db)):
    """حذف ميزانية"""
    lim = db.get(BudgetLimit, limit_id)
    if not lim:
        raise HTTPException(404, "الميزانية غير موجودة")
    db.delete(lim)
    db.commit()
    return {"ok": True}


# ===========================
# INSIGHTS HELPERS
# ===========================

def _pct_change(curr: float, prev: float) -> float:
    """نسبة التغير % — إذا كان prev = 0 → 100% أو 0%"""
    if prev == 0:
        return 0.0 if curr == 0 else 100.0
    return round(((curr - prev) / prev) * 100, 1)



@router.get("/insights", response_model=BudgetInsightsResponse)
def get_insights(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    compare_month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    """
    إحصائيات متقدمة للشهر.
    
    - `compare_month`: الشهر للمقارنة (YYYY-MM)
    - لو مش محدد: يستخدم الشهر السابق تلقائيًا
    """
    year = int(month[:4])
    mon = int(month[5:7])
    days_in_month = calendar.monthrange(year, mon)[1]

    # عدد الأيام المنقضية
    today = datetime.now()
    current_ym = (today.year, today.month)
    target_ym = (year, mon)

    if target_ym == current_ym:
        days_elapsed = today.day
    elif target_ym < current_ym:
        days_elapsed = days_in_month
    else:
        days_elapsed = 0

    # إجماليات الشهر
    totals = (
        db.query(
            BudgetTransaction.type,
            func.count(BudgetTransaction.id),
            func.coalesce(func.sum(BudgetTransaction.amount), 0.0),
        )
        .filter(BudgetTransaction.date.like(f"{month}-%"))
        .group_by(BudgetTransaction.type)
        .all()
    )

    total_income = 0.0
    total_expense = 0.0
    txn_count = 0
    for t, count, total in totals:
        if t == "income":
            total_income = float(total)
        elif t == "expense":
            total_expense = float(total)
        txn_count += count

    # متوسطات يومية
    avg_daily_expense = (
        round(total_expense / days_elapsed, 2) if days_elapsed > 0 else 0.0
    )
    avg_daily_income = (
        round(total_income / days_elapsed, 2) if days_elapsed > 0 else 0.0
    )

    # أعلى يوم صرف
    top_day_row = (
        db.query(
            BudgetTransaction.date,
            func.sum(BudgetTransaction.amount),
        )
        .filter(
            BudgetTransaction.date.like(f"{month}-%"),
            BudgetTransaction.type == "expense",
        )
        .group_by(BudgetTransaction.date)
        .order_by(func.sum(BudgetTransaction.amount).desc())
        .first()
    )
    top_expense_day = None
    if top_day_row:
        top_expense_day = BudgetInsightTopDay(
            date=top_day_row[0],
            amount=round(float(top_day_row[1]), 2),
        )

    # أعلى تصنيف إنفاقاً
    top_cat_row = (
        db.query(
            BudgetTransaction.category_id,
            func.sum(BudgetTransaction.amount),
        )
        .filter(
            BudgetTransaction.date.like(f"{month}-%"),
            BudgetTransaction.type == "expense",
        )
        .group_by(BudgetTransaction.category_id)
        .order_by(func.sum(BudgetTransaction.amount).desc())
        .first()
    )

    top_expense_category = None
    if top_cat_row and total_expense > 0:
        cat = db.get(BudgetCategory, top_cat_row[0])
        amount = round(float(top_cat_row[1]), 2)
        top_expense_category = BudgetInsightTopCategory(
            category_id=top_cat_row[0],
            category_name=cat.name if cat else "غير محدد",
            category_icon=cat.icon if cat else None,
            category_color=cat.color if cat else None,
            amount=amount,
            percent=round((amount / total_expense) * 100, 1),
        )

    # نسبة التوفير
    savings_rate = 0.0
    if total_income > 0:
        savings_rate = round(
            ((total_income - total_expense) / total_income) * 100, 1
        )

    # متوسط آخر 7 أيام
    last_7_days_avg = 0.0
    if days_elapsed > 0:
        if target_ym == current_ym:
            end_date = today.strftime("%Y-%m-%d")
            start_date = (today - timedelta(days=6)).strftime("%Y-%m-%d")
        else:
            start_day = max(1, days_in_month - 6)
            start_date = f"{month}-{start_day:02d}"
            end_date = f"{month}-{days_in_month:02d}"

        last_7_total = (
            db.query(func.coalesce(func.sum(BudgetTransaction.amount), 0))
            .filter(
                BudgetTransaction.date >= start_date,
                BudgetTransaction.date <= end_date,
                BudgetTransaction.date.like(f"{month}-%"),
                BudgetTransaction.type == "expense",
            )
            .scalar()
        ) or 0.0

        last_7_days_avg = round(float(last_7_total) / 7, 2)

    # ===========================
    # المقارنة (مرنة)
    # ===========================
    if compare_month:
        # الشهر المحدد من المستخدم
        prev_year = int(compare_month[:4])
        prev_mon = int(compare_month[5:7])
        prev_month_str = compare_month
    else:
        # الشهر السابق (default)
        prev_year = year
        prev_mon = mon - 1
        if prev_mon <= 0:
            prev_mon = 12
            prev_year -= 1
        prev_month_str = f"{prev_year}-{prev_mon:02d}"

    prev_totals = (
        db.query(
            BudgetTransaction.type,
            func.coalesce(func.sum(BudgetTransaction.amount), 0.0),
        )
        .filter(BudgetTransaction.date.like(f"{prev_month_str}-%"))
        .group_by(BudgetTransaction.type)
        .all()
    )

    prev_income = 0.0
    prev_expense = 0.0
    for t, total in prev_totals:
        if t == "income":
            prev_income = float(total)
        elif t == "expense":
            prev_expense = float(total)

    prev_net = prev_income - prev_expense
    current_net = total_income - total_expense

    comparison = None
    if prev_income > 0 or prev_expense > 0:
        comparison = BudgetInsightComparison(
            prev_month=prev_month_str,
            prev_income=round(prev_income, 2),
            prev_expense=round(prev_expense, 2),
            prev_net=round(prev_net, 2),
            income_change_percent=_pct_change(total_income, prev_income),
            expense_change_percent=_pct_change(total_expense, prev_expense),
            net_change_percent=_pct_change(current_net, prev_net),
        )

    return BudgetInsightsResponse(
        month=month,
        days_elapsed=days_elapsed,
        days_in_month=days_in_month,
        avg_daily_expense=avg_daily_expense,
        avg_daily_income=avg_daily_income,
        top_expense_day=top_expense_day,
        top_expense_category=top_expense_category,
        transaction_count=txn_count,
        savings_rate=savings_rate,
        last_7_days_avg=last_7_days_avg,
        comparison=comparison,
    )
