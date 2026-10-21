"""
استيراد ملف special (backup.csv) - نسخة مرنة
- يدعم نوع income أو expense (من الـ CLI)
- mapping مخصص للتصنيفات (1=زراعي، 2=بناء حجر)
- ملء تلقائي للخلايا الفاضية

Usage:
    python import_special.py <file.csv> --type income
    python import_special.py <file.csv> --type expense
"""

import sys
import csv
import uuid
import time
import argparse
from datetime import datetime
from database import SessionLocal, engine, Base
from models import BudgetCategory, BudgetTransaction


# ✅ mapping التصنيفات في هذا الملف
KEY_TO_NAME = {
    "1": "زراعي",
    "2": "بناء حجر",
}

# أيقونات للتصنيفات
CATEGORY_META = {
    "زراعي":        {"icon": "🌾", "color": "#84cc16"},
    "بناء حجر":     {"icon": "🪨", "color": "#a16207"},
    "غير محدد":     {"icon": "❓", "color": "#94a3b8"},
}

UNCATEGORIZED_NAME = "غير محدد"


def clean(s) -> str:
    """تنظيف شامل لأي قيمة"""
    if s is None:
        return ""
    return str(s).replace('\r', '').replace('\n', '').strip()


def parse_number(s: str) -> float:
    s = clean(s)
    s = s.replace("٫", ".").replace("٬", "").replace(",", "")
    s = s.replace(" ", "").replace("\u00a0", "")
    return float(s)


def parse_date(s: str) -> str:
    s = clean(s)
    s = s.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789'))
    
    if len(s) >= 10 and s[4] == '-' and s[7] == '-':
        try:
            return datetime.strptime(s[:10], "%Y-%m-%d").strftime("%Y-%m-%d")
        except ValueError:
            pass
    
    formats = [
        "%d/%m/%y %H:%M",
        "%d/%m/%Y %H:%M",
        "%Y/%m/%d",
        "%Y-%m-%d",
        "%d/%m/%y",
        "%d/%m/%Y",
        "%m/%d/%y",
        "%m/%d/%Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    raise ValueError(f"invalid date: {s!r}")


def get_or_create_category(db, name: str, txn_type: str) -> BudgetCategory:
    """يجيب أو ينشئ تصنيف حسب النوع"""
    cat = (
        db.query(BudgetCategory)
        .filter_by(name=name, type=txn_type)
        .first()
    )
    if cat:
        return cat
    
    meta = CATEGORY_META.get(name, {"icon": "📦", "color": "#64748b"})
    
    cat = BudgetCategory(
        id=f"cat_{uuid.uuid4().hex[:12]}",
        name=name,
        type=txn_type,
        icon=meta["icon"],
        color=meta["color"],
        sort_order=0,
        created_at=int(time.time() * 1000),
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    print(f"  ✨ أُنشئ تصنيف {txn_type}: '{name}' ({cat.id})")
    return cat


def main(csv_path: str, txn_type: str):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1) إنشاء التصنيفات (مرة واحدة لكل نوع)
        print(f"\n  🔧 تجهيز تصنيفات {txn_type}...")
        name_to_cat = {}
        for key, name in KEY_TO_NAME.items():
            name_to_cat[key] = get_or_create_category(db, name, txn_type)
        
        # تصنيف "غير محدد"
        uncategorized = get_or_create_category(db, UNCATEGORIZED_NAME, txn_type)
        
        print(f"  ✅ جاهزة\n")
        
        # 2) معالجة الـ CSV
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            
            # تنظيف أسماء الأعمدة
            if reader.fieldnames:
                cleaned = []
                for name in reader.fieldnames:
                    n = clean(name).replace('\ufeff', '')
                    cleaned.append(n)
                reader.fieldnames = cleaned
            
            print(f"  📋 الأعمدة: {reader.fieldnames}\n")
            
            imported = 0
            uncategorized_count = 0
            filled_details = 0
            filled_description = 0
            skipped_invalid_amount = 0
            skipped_invalid_date = 0
            skipped_other = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # ============ parse amount ============
                    try:
                        amount = parse_number(row.get("amount"))
                    except (ValueError, TypeError):
                        skipped_invalid_amount += 1
                        errors.append(
                            f"row {row_num}: amount غير صالح ({row.get('amount')!r})"
                        )
                        continue
                    
                    if amount <= 0:
                        skipped_invalid_amount += 1
                        errors.append(f"row {row_num}: amount غير موجب ({amount})")
                        continue
                    
                    # ============ parse date ============
                    try:
                        date_str = parse_date(row.get("date"))
                    except ValueError as e:
                        skipped_invalid_date += 1
                        errors.append(f"row {row_num}: {e}")
                        continue
                    
                    # ============ تحديد التصنيف ============
                    key = clean(row.get("category_id"))
                    cat = name_to_cat.get(key)
                    is_uncategorized = False
                    
                    if cat is None:
                        cat = uncategorized
                        is_uncategorized = True
                    
                    # ============ details / description (مع ملء الفراغات) ============
                    details_val = clean(row.get("details"))
                    description_val = clean(row.get("description"))
                    
                    # لو details فاضي، نحط description
                    if not details_val:
                        if description_val:
                            details_val = description_val
                            filled_details += 1
                        else:
                            details_val = None  # الاتنين فاضيين
                    
                    # لو description فاضي، نحط details
                    if not description_val:
                        if details_val:
                            description_val = details_val
                            filled_description += 1
                        else:
                            description_val = None
                    
                    # ============ إنشاء المعاملة ============
                    txn = BudgetTransaction(
                        id=f"txn_{uuid.uuid4().hex[:12]}",
                        amount=round(amount, 2),
                        type=txn_type,
                        category_id=cat.id,
                        date=date_str,
                        details=details_val,
                        description=description_val,
                        created_at=int(time.time() * 1000),
                    )
                    db.add(txn)
                    imported += 1
                    
                    if is_uncategorized:
                        uncategorized_count += 1
                    
                    if imported % 200 == 0:
                        db.commit()
                        print(f"  ... {imported} committed")
                
                except Exception as e:
                    skipped_other += 1
                    errors.append(f"row {row_num}: {e}")
            
            db.commit()
            
            # ============ تقرير نهائي ============
            print(f"\n{'=' * 60}")
            print(f"  ✅ تم الاستيراد:              {imported}")
            print(f"  📊 النوع:                     {txn_type}")
            print(f"  📂 منهم في 'غير محدد':       {uncategorized_count}")
            print(f"  🔄 details مملوء من description: {filled_details}")
            print(f"  🔄 description مملوء من details: {filled_description}")
            print(f"  ⏭️  تخطي - مبلغ غير صالح:     {skipped_invalid_amount}")
            print(f"  ⏭️  تخطي - تاريخ غير صالح:    {skipped_invalid_date}")
            print(f"  ⏭️  تخطي - أخطاء أخرى:        {skipped_other}")
            print(f"{'=' * 60}\n")
            
            if errors:
                print(f"  أول 10 أخطاء:")
                for err in errors[:10]:
                    print(f"    - {err}")
    
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_file", help="مسار الـ CSV")
    parser.add_argument(
        "--type",
        choices=["income", "expense"],
        required=True,
        help="نوع المعاملات (دخل أو مصروف)",
    )
    args = parser.parse_args()
    
    main(args.csv_file, args.type)
