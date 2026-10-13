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
