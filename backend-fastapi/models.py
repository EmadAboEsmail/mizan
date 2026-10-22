from sqlalchemy import Column, String, Integer, ForeignKey, BigInteger, Boolean, Float,Index, UniqueConstraint
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

# ===========================
# Budget Tables
# ===========================

class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "income" | "expense"
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(BigInteger, nullable=False)

    __table_args__ = (
        Index("ix_budget_categories_type_sort", "type", "sort_order"),
    )


class BudgetTransaction(Base):
    __tablename__ = "budget_transactions"

    id = Column(String, primary_key=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # "income" | "expense"
    category_id = Column(
        String,
        ForeignKey("budget_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    date = Column(String, nullable=False)  # "YYYY-MM-DD"
    details = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(BigInteger, nullable=False)

    __table_args__ = (
        Index("ix_budget_transactions_date", "date"),
        Index("ix_budget_transactions_category", "category_id"),
        Index("ix_budget_transactions_type", "type"),
    )
# ===========================
# Budget Limits (الميزانية الشهرية)
# ===========================

class BudgetLimit(Base):
    __tablename__ = "budget_limits"

    id = Column(String, primary_key=True)
    category_id = Column(
        String,
        ForeignKey("budget_categories.id", ondelete="CASCADE"),
        nullable=False,
    )
    month = Column(String, nullable=False)  # "YYYY-MM"
    amount = Column(Float, nullable=False)
    created_at = Column(BigInteger, nullable=False)
    updated_at = Column(BigInteger, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "category_id", "month",
            name="uq_budget_limit_cat_month",
        ),
        Index("ix_budget_limits_month", "month"),
    )
