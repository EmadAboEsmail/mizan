from sqlalchemy import Column, String, Integer, ForeignKey, BigInteger
from database import Base



class Adhkar(Base):
    __tablename__ = "adhkar"
    
    id = Column(String, primary_key=True)
    text = Column(String, nullable=False)
    default_target = Column(Integer)


class Click(Base):
    __tablename__ = "clicks"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    zekr_id = Column(String, ForeignKey("adhkar.id"), nullable=False)
    timestamp = Column(BigInteger, nullable=False)


class Target(Base):
    __tablename__ = "targets"
    
    zekr_id = Column(String, ForeignKey("adhkar.id"), primary_key=True)
    target = Column(Integer, nullable=False)


class Count(Base):
    __tablename__ = "counts"
    
    zekr_id = Column(String, ForeignKey("adhkar.id"), primary_key=True)
    count = Column(Integer, nullable=False, default=0)

class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(BigInteger, nullable=False)


class GroupItem(Base):
    __tablename__ = "group_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(
        String,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    zekr_id = Column(String, ForeignKey("adhkar.id"), nullable=False)
    position = Column(Integer, nullable=False)
    target = Column(Integer, nullable=True)
