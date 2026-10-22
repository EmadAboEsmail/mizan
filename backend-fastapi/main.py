
import uuid
import time
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import Base, engine
import models
from models import Adhkar, Click, Count, Target, Group, GroupItem
from schemas import (
    AdhkarResponse, ClickRequest, ClickResponse,
    TargetRequest, OkResponse,
    GroupCreate, GroupUpdate,
    GroupItemCreate, GroupItemUpdate,
    GroupItemResponse, GroupResponse,AdhkarCreate
)
from dependencies import get_db
from fastapi.middleware.cors import CORSMiddleware
from routers import budget
app = FastAPI()
app.include_router(budget.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",   # Vite default (احتياطي)
        "http://127.0.0.1:5173",
        "http://localhost:4173",   # Vite preview
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Hello from Zekr backend!"}


@app.get("/api/adhkar", response_model=list[AdhkarResponse])
def get_adhkar(db: Session = Depends(get_db)):
    return db.query(Adhkar).all()


@app.get("/api/counts")
def get_counts(db: Session = Depends(get_db)):
    rows = db.query(Count).all()
    return {row.zekr_id: row.count for row in rows}


@app.post("/api/clicks", response_model=ClickResponse)
def add_click(req: ClickRequest, db: Session = Depends(get_db)):
    zekr = db.get(Adhkar, req.zekr_id)
    if not zekr:
        raise HTTPException(status_code=404, detail="الذكر غير موجود")
    
    click = Click(zekr_id=req.zekr_id, timestamp=int(time.time() * 1000))
    db.add(click)
    
    count_row = db.get(Count, req.zekr_id)
    if count_row:
        count_row.count += 1
    else:
        count_row = Count(zekr_id=req.zekr_id, count=1)
        db.add(count_row)
    
    db.commit()
    db.refresh(count_row)
    return ClickResponse(count=count_row.count)

@app.get("/api/targets")
def get_targets(db: Session = Depends(get_db)):
    rows = db.query(Target).all()
    return {row.zekr_id: row.target for row in rows}

@app.post("/api/targets", response_model=OkResponse)
def set_target(req: TargetRequest, db: Session = Depends(get_db)):
    zekr = db.get(Adhkar, req.zekr_id)
    if not zekr:
        raise HTTPException(status_code=404, detail="الذكر غير موجود")
    
    target_row = db.get(Target, req.zekr_id)
    if target_row:
        target_row.target = req.target
    else:
        target_row = Target(zekr_id=req.zekr_id, target=req.target)
        db.add(target_row)
    
    db.commit()
    return OkResponse(ok=True)


@app.delete("/api/clicks/{zekr_id}", response_model=OkResponse)
def reset_click(zekr_id: str, db: Session = Depends(get_db)):
    zekr = db.get(Adhkar, zekr_id)
    if not zekr:
        raise HTTPException(status_code=404, detail="الذكر غير موجود")
    
    count_row = db.get(Count, zekr_id)
    if count_row:
        count_row.count = 0
    else:
        db.add(Count(zekr_id=zekr_id, count=0))
    
    db.commit()
    return OkResponse(ok=True)


def get_bucket(dt: datetime, period: str) -> str:
    """يحوّل datetime لمفتاح الـ bucket حسب الفترة"""
    if period == "day":
        return dt.strftime("%Y-%m-%d")
    elif period == "week":
        y, w, _ = dt.isocalendar()
        return f"{y}-W{w:02d}"
    elif period == "month":
        return dt.strftime("%Y-%m")
    elif period == "year":
        return str(dt.year)
    raise ValueError("period غير صالح")


def generate_buckets(now: datetime, period: str):
    """يولّد قائمة buckets من الأقدم للأحدث + تاريخ البداية"""
    buckets = []

    if period == "day":
        for i in range(6, -1, -1):
            buckets.append((now - timedelta(days=i)).strftime("%Y-%m-%d"))
        start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

    elif period == "week":
        for i in range(3, -1, -1):
            d = now - timedelta(weeks=i)
            y, w, _ = d.isocalendar()
            buckets.append(f"{y}-W{w:02d}")
        start = (now - timedelta(weeks=3)).replace(hour=0, minute=0, second=0, microsecond=0)

    elif period == "month":
        for i in range(11, -1, -1):
            m = now.month - i
            y = now.year
            while m <= 0:
                m += 12
                y -= 1
            buckets.append(f"{y}-{m:02d}")

        start_month = now.month - 11
        start_year = now.year
        while start_month <= 0:
            start_month += 12
            start_year -= 1
        start = datetime(start_year, start_month, 1)

    elif period == "year":
        for i in range(4, -1, -1):
            buckets.append(str(now.year - i))
        start = datetime(now.year - 4, 1, 1)

    else:
        raise ValueError("period غير صالح")

    return buckets, start


@app.get("/api/stats")
def get_stats(
    period: str = "day",
    zekr_id: str | None = None,
    compare: bool = False,
    db: Session = Depends(get_db),
):
    if period not in ("day", "week", "month", "year"):
        raise HTTPException(status_code=400, detail="period يجب أن يكون day/week/month/year")

    now = datetime.now()
    try:
        buckets, start = generate_buckets(now, period)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    start_ms = int(start.timestamp() * 1000)

    query = db.query(Click).filter(Click.timestamp >= start_ms)
    if zekr_id:
        zekr = db.get(Adhkar, zekr_id)
        if not zekr:
            raise HTTPException(status_code=404, detail="الذكر غير موجود")
        query = query.filter(Click.zekr_id == zekr_id)

    clicks = query.all()

    counts_by_bucket: dict[str, int] = {}
    for c in clicks:
        label = get_bucket(datetime.fromtimestamp(c.timestamp / 1000), period)
        counts_by_bucket[label] = counts_by_bucket.get(label, 0) + 1

    values = [counts_by_bucket.get(b, 0) for b in buckets]

    breakdown = []
    if not zekr_id:
        counts_by_zekr: dict[str, int] = {}
        for c in clicks:
            counts_by_zekr[c.zekr_id] = counts_by_zekr.get(c.zekr_id, 0) + 1

        all_adhkar = db.query(Adhkar).all()
        text_map = {a.id: a.text for a in all_adhkar}

        breakdown = [
            {
                "zekr_id": zid,
                "text": text_map.get(zid, zid),
                "count": count,
            }
            for zid, count in sorted(
                counts_by_zekr.items(), key=lambda x: -x[1]
            )
        ]

    total = sum(values)

    result = {
        "labels": buckets,
        "values": values,
        "total": total,
        "breakdown": breakdown,
    }

    # ✅ مقارنة بالفترة السابقة (اختياري)
    if compare:
        now_ms = int(now.timestamp() * 1000)
        duration_ms = now_ms - start_ms
        prev_start_ms = start_ms - duration_ms
        prev_end_ms = start_ms

        prev_query = db.query(Click).filter(
            Click.timestamp >= prev_start_ms,
            Click.timestamp < prev_end_ms,
        )
        if zekr_id:
            prev_query = prev_query.filter(Click.zekr_id == zekr_id)

        prev_total = prev_query.count()

        change_percent = 0
        if prev_total > 0:
            change_percent = round(((total - prev_total) / prev_total) * 100, 1)
        elif total > 0:
            change_percent = 100.0  # من صفر لرقم = زيادة 100%

        result["comparison"] = {
            "previous_total": prev_total,
            "current_total": total,
            "change_percent": change_percent,
        }

    return result
# ===========================
# مسح كل البيانات
# ===========================

@app.delete("/api/counts")
def delete_all_counts(db: Session = Depends(get_db)):
    db.query(Count).delete()
    db.commit()
    return {"ok": True}


@app.delete("/api/targets")
def delete_all_targets(db: Session = Depends(get_db)):
    db.query(Target).delete()
    db.commit()
    return {"ok": True}


@app.delete("/api/clicks")
def delete_all_clicks(db: Session = Depends(get_db)):
    db.query(Click).delete()
    db.query(Count).delete()  # نصفّر الأعداد كمان
    db.commit()
    return {"ok": True}

@app.delete("/api/data/all")
def delete_all_data(db: Session = Depends(get_db)):
    db.query(Click).delete()
    db.query(Count).delete()
    db.query(Target).delete()
    db.commit()
    return {"ok": True}



# ...

# ===========================
# إدارة الأذكار
# ===========================



@app.post("/api/adhkar", response_model=AdhkarResponse)
def create_adhkar(data: AdhkarCreate, db: Session = Depends(get_db)):
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="النص مطلوب")
    
    zekr_id = f"zekr_{uuid.uuid4().hex[:12]}"
    
    zekr = Adhkar(
        id=zekr_id,
        text=text,
        default_target=data.default_target,
    )
    db.add(zekr)
    db.commit()
    db.refresh(zekr)
    return zekr


@app.put("/api/adhkar/{zekr_id}", response_model=AdhkarResponse)
def update_adhkar(
    zekr_id: str,
    data: AdhkarCreate,
    db: Session = Depends(get_db),
):
    zekr = db.get(Adhkar, zekr_id)
    if not zekr:
        raise HTTPException(status_code=404, detail="الذكر غير موجود")
    
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="النص مطلوب")
    
    zekr.text = text
    zekr.default_target = data.default_target
    db.commit()
    db.refresh(zekr)
    return zekr


@app.delete("/api/adhkar/{zekr_id}")
def delete_adhkar(zekr_id: str, db: Session = Depends(get_db)):
    zekr = db.get(Adhkar, zekr_id)
    if not zekr:
        raise HTTPException(status_code=404, detail="الذكر غير موجود")
    
    # حذف البيانات المرتبطة
    db.query(Click).filter(Click.zekr_id == zekr_id).delete()
    db.query(Count).filter(Count.zekr_id == zekr_id).delete()
    db.query(Target).filter(Target.zekr_id == zekr_id).delete()
    
    # حذف الذكر
    db.delete(zekr)
    db.commit()
    return {"ok": True}


# ===========================
# المجموعات
# ===========================

def build_group_response(group: Group, db: Session) -> dict:
    """يبني الرد الكامل للمجموعة"""
    items = (
        db.query(GroupItem)
        .filter(GroupItem.group_id == group.id)
        .order_by(GroupItem.position)
        .all()
    )

    items_response = []
    for item in items:
        zekr = db.get(Adhkar, item.zekr_id)
        items_response.append({
            "id": item.id,
            "zekr_id": item.zekr_id,
            "text": zekr.text if zekr else item.zekr_id,
            "position": item.position,
            "target": item.target,
            "default_target": zekr.default_target if zekr else None,
        })

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "created_at": group.created_at,
        "items": items_response,
    }


@app.get("/api/groups", response_model=list[GroupResponse])
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.created_at.desc()).all()
    return [build_group_response(g, db) for g in groups]
@app.get("/api/groups/{group_id}", response_model=GroupResponse)
def get_group(group_id: str, db: Session = Depends(get_db)):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    return build_group_response(group, db)


@app.post("/api/groups", response_model=GroupResponse)
def create_group(data: GroupCreate, db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="اسم المجموعة مطلوب")

    group = Group(
        id=f"grp_{uuid.uuid4().hex[:12]}",
        name=name,
        description=data.description,
        created_at=int(__import__("time").time() * 1000),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return build_group_response(group, db)


@app.put("/api/groups/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: str,
    data: GroupUpdate,
    db: Session = Depends(get_db),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

    if data.name is not None:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="الاسم لا يمكن أن يكون فارغًا")
        group.name = name

    if data.description is not None:
        group.description = data.description

    db.commit()
    db.refresh(group)
    return build_group_response(group, db)


@app.delete("/api/groups/{group_id}")
def delete_group(group_id: str, db: Session = Depends(get_db)):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

    # حذف الأذكار المرتبطة
    db.query(GroupItem).filter(GroupItem.group_id == group_id).delete()
    db.delete(group)
    db.commit()
    return {"ok": True}


# ===========================
# أذكار المجموعة
# ===========================

@app.post("/api/groups/{group_id}/items", response_model=GroupResponse)
def add_group_item(
    group_id: str,
    data: GroupItemCreate,
    db: Session = Depends(get_db),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

    zekr = db.get(Adhkar, data.zekr_id)
    if not zekr:
        raise HTTPException(status_code=404, detail="الذكر غير موجود")

    # آخر position
    last = (
        db.query(GroupItem)
        .filter(GroupItem.group_id == group_id)
        .order_by(GroupItem.position.desc())
        .first()
    )
    next_pos = (last.position + 1) if last else 1

    item = GroupItem(
        group_id=group_id,
        zekr_id=data.zekr_id,
        position=next_pos,
        target=data.target,
    )
    db.add(item)
    db.commit()
    return build_group_response(group, db)


@app.put("/api/groups/{group_id}/items/{item_id}", response_model=GroupResponse)
def update_group_item(
    group_id: str,
    item_id: int,
    data: GroupItemUpdate,
    db: Session = Depends(get_db),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

    item = db.get(GroupItem, item_id)
    if not item or item.group_id != group_id:
        raise HTTPException(status_code=404, detail="الذكر غير موجود في المجموعة")

    if data.target is not None:
        item.target = data.target

    if data.position is not None:
        item.position = data.position

    db.commit()
    return build_group_response(group, db)


@app.delete("/api/groups/{group_id}/items/{item_id}", response_model=GroupResponse)
def delete_group_item(
    group_id: str,
    item_id: int,
    db: Session = Depends(get_db),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

    item = db.get(GroupItem, item_id)
    if not item or item.group_id != group_id:
        raise HTTPException(status_code=404, detail="الذكر غير موجود في المجموعة")

    db.delete(item)

    # إعادة ترقيم الباقي
    remaining = (
        db.query(GroupItem)
        .filter(GroupItem.group_id == group_id)
        .order_by(GroupItem.position)
        .all()
    )
    for i, it in enumerate(remaining, start=1):
        it.position = i

    db.commit()
    return build_group_response(group, db)
# ===========================
# النسخ الاحتياطي الكامل (Backup & Restore)
# ===========================

@app.get("/api/backup")
def export_backup(db: Session = Depends(get_db)):
    adhkar = db.query(Adhkar).all()
    counts = db.query(Count).all()
    targets = db.query(Target).all()
    clicks = db.query(Click).all()
    groups = db.query(Group).all()
    group_items = db.query(GroupItem).all()

    return {
        "version": "1.0",
        "exported_at": int(time.time() * 1000),
        "adhkar": [
            {"id": a.id, "text": a.text, "default_target": a.default_target}
            for a in adhkar
        ],
        "counts": [
            {"zekr_id": c.zekr_id, "count": c.count}
            for c in counts
        ],
        "targets": [
            {"zekr_id": t.zekr_id, "target": t.target}
            for t in targets
        ],
        "clicks": [
            {"zekr_id": cl.zekr_id, "timestamp": cl.timestamp}
            for cl in clicks
        ],
        "groups": [
            {
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "created_at": g.created_at,
            }
            for g in groups
        ],
        "group_items": [
            {
                "group_id": gi.group_id,
                "zekr_id": gi.zekr_id,
                "position": gi.position,
                "target": gi.target,
            }
            for gi in group_items
        ],
    }


@app.post("/api/backup")
def import_backup(data: dict, db: Session = Depends(get_db)):
    try:
        # 1. تفريغ الجداول بالكامل لمنع تكرار أي عنصر عند الاستيراد
        db.query(GroupItem).delete()
        db.query(Group).delete()
        db.query(Click).delete()
        db.query(Count).delete()
        db.query(Target).delete()
        db.query(Adhkar).delete()
        db.flush()

        # 2. استرجاع الأذكار
        adhkar_list = data.get("adhkar", [])
        for a in adhkar_list:
            db.add(Adhkar(
                id=a["id"],
                text=a["text"],
                default_target=a.get("default_target"),
            ))
        db.flush()

        # 3. استرجاع العدادات (يدعم كلاً من Dictionary أو List)
        counts_data = data.get("counts", [])
        counts_dict = {}
        if isinstance(counts_data, dict):
            for zid, cnt in counts_data.items():
                db.add(Count(zekr_id=zid, count=int(cnt)))
                counts_dict[zid] = int(cnt)
        elif isinstance(counts_data, list):
            for c in counts_data:
                db.add(Count(zekr_id=c["zekr_id"], count=int(c["count"])))
                counts_dict[c["zekr_id"]] = int(c["count"])
        db.flush()

        # 4. استرجاع الأهداف
        targets_data = data.get("targets", [])
        if isinstance(targets_data, dict):
            for zid, trg in targets_data.items():
                if trg is not None:
                    db.add(Target(zekr_id=zid, target=int(trg)))
        elif isinstance(targets_data, list):
            for t in targets_data:
                if t.get("target") is not None:
                    db.add(Target(zekr_id=t["zekr_id"], target=int(t["target"])))
        db.flush()

        # 5. استرجاع الضغطات وتواريخ الإحصائيات
        clicks_data = data.get("clicks", [])
        if clicks_data and isinstance(clicks_data, list):
            for cl in clicks_data:
                db.add(Click(
                    zekr_id=cl["zekr_id"],
                    timestamp=int(cl["timestamp"]),
                ))
        else:
            # لو ملف قديم بدون جدول ضغطات، ننشئ ضغطات مطابقة للعداد بتاريخ التصدير
            backup_time = int(time.time() * 1000)
            if "exportedAt" in data:
                try:
                    dt = datetime.fromisoformat(data["exportedAt"].replace("Z", "+00:00"))
                    backup_time = int(dt.timestamp() * 1000)
                except Exception:
                    pass

            for zid, cnt in counts_dict.items():
                for _ in range(cnt):
                    db.add(Click(zekr_id=zid, timestamp=backup_time))
        db.flush()

        # 6. استرجاع المجموعات
        for g in data.get("groups", []):
            db.add(Group(
                id=g["id"],
                name=g["name"],
                description=g.get("description"),
                created_at=g.get("created_at", int(time.time() * 1000)),
            ))
        db.flush()

        # 7. استرجاع عناصر المجموعات
        if "group_items" in data and isinstance(data["group_items"], list):
            for gi in data["group_items"]:
                db.add(GroupItem(
                    group_id=gi["group_id"],
                    zekr_id=gi["zekr_id"],
                    position=gi.get("position", 1),
                    target=gi.get("target"),
                ))
        else:
            for g in data.get("groups", []):
                for idx, item in enumerate(g.get("items", []), start=1):
                    db.add(GroupItem(
                        group_id=g["id"],
                        zekr_id=item.get("zekr_id"),
                        position=item.get("position", idx),
                        target=item.get("target"),
                    ))

        db.commit()
        return {"ok": True, "count": len(adhkar_list)}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"فشل استيراد النسخة: {str(e)}")


# ===========================
# Streak (سلسلة الأيام المتتالية)
# ===========================

@app.get("/api/stats/streak")
def get_streak(db: Session = Depends(get_db)):
    """يحسب سلسلة الأيام المتتالية اللي فيها تسبيح."""
    clicks = db.query(Click).all()
    if not clicks:
        return {
            "current": 0,
            "longest": 0,
            "total_days": 0,
            "last_date": None,
        }

    # تجميع الأيام اللي فيها تسبيح
    days_with_clicks = set()
    for c in clicks:
        dt = datetime.fromtimestamp(c.timestamp / 1000)
        days_with_clicks.add(dt.strftime("%Y-%m-%d"))

    sorted_desc = sorted(days_with_clicks, reverse=True)
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    # ✅ السلسلة الحالية (لازم تبدأ من النهارده أو إمبارح)
    current_streak = 0
    if sorted_desc[0] == today or sorted_desc[0] == yesterday:
        current_streak = 1
        expected = datetime.strptime(sorted_desc[0], "%Y-%m-%d")
        for day in sorted_desc[1:]:
            expected -= timedelta(days=1)
            if day == expected.strftime("%Y-%m-%d"):
                current_streak += 1
            else:
                break

    # ✅ أطول سلسلة في التاريخ
    longest_streak = 0
    if sorted_desc:
        current = 1
        longest_streak = 1
        all_days_asc = sorted(days_with_clicks)
        for i in range(1, len(all_days_asc)):
            prev = datetime.strptime(all_days_asc[i - 1], "%Y-%m-%d")
            curr = datetime.strptime(all_days_asc[i], "%Y-%m-%d")
            if (curr - prev).days == 1:
                current += 1
                longest_streak = max(longest_streak, current)
            else:
                current = 1

    return {
        "current": current_streak,
        "longest": longest_streak,
        "total_days": len(days_with_clicks),
        "last_date": sorted_desc[0],
    }
