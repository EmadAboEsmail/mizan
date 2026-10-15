
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
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

    # التجميع للرسم البياني
    counts_by_bucket: dict[str, int] = {}
    for c in clicks:
        label = get_bucket(datetime.fromtimestamp(c.timestamp / 1000), period)
        counts_by_bucket[label] = counts_by_bucket.get(label, 0) + 1

    values = [counts_by_bucket.get(b, 0) for b in buckets]

    # breakdown (بس لما الكل)
    breakdown = []
    if not zekr_id:
        counts_by_zekr: dict[str, int] = {}
        for c in clicks:
            counts_by_zekr[c.zekr_id] = counts_by_zekr.get(c.zekr_id, 0) + 1

        # نجيب نصوص الأذكار
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

    return {
        "labels": buckets,
        "values": values,
        "total": sum(values),
        "breakdown": breakdown,
    }


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
