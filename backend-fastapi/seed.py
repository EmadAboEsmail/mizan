import json
from pathlib import Path

from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from database import SessionLocal, engine, Base
import models
from models import Adhkar


def seed():
    # اقرأ الـ JSON
    json_path = Path(__file__).parent.parent / "pages" / "sabh" / "adhkar.json"
    with open(json_path, encoding="utf-8") as f:
        adhkar_data = json.load(f)
    
    # افتح session
    session = SessionLocal()
    try:
        added = 0
        for zekr in adhkar_data:
            stmt = sqlite_insert(Adhkar).values(
                id=zekr["id"],
                text=zekr["text"],
                default_target=zekr.get("target")
            ).on_conflict_do_nothing(index_elements=["id"])
            
            result = session.execute(stmt)
            added += result.rowcount
        
        session.commit()
        print(f"تمت إضافة {added} ذكر جديد من أصل {len(adhkar_data)}")
    except Exception as e:
        session.rollback()
        print(f"خطأ: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
