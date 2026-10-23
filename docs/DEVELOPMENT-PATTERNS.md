📚 DEVELOPMENT-PATTERNS.md — دليل شامل من Zekr و Budget

احفظ الملف في docs/DEVELOPMENT-PATTERNS.md.

---

```markdown
# 📚 Development Patterns — Zekr & Budget

> **مرجع عملي** — كل اللي اتعلمناه من بناء تطبيقين كاملين
> **الهدف:** تسريع بناء التطبيقات القادمة (الزراعة، إلخ)
> **آخر تحديث:** 2026-10-23

---

## 📋 فهرس

1. [المعمارية العامة](#1-المعمارية-العامة)
2. [Backend Patterns](#2-backend-patterns)
3. [Frontend Context Pattern](#3-frontend-context-pattern)
4. [Data Management](#4-data-management)
5. [Performance Patterns](#5-performance-patterns)
6. [UI Component Patterns](#6-ui-component-patterns)
7. [Routing & Navigation](#7-routing--navigation)
8. [Forms & Validation](#8-forms--validation)
9. [Modals & Back Button](#9-modals--back-button)
10. [Toast Notifications](#10-toast-notifications)
11. [PWA Setup](#11-pwa-setup)
12. [GitHub Actions (APK)](#12-github-actions-apk)
13. [الأخطاء الشائعة وحلولها](#13-الأخطاء-الشائعة-وحلولها)
14. [Checklist لتطبيق جديد](#14-checklist-لتطبيق-جديد)

---

## 1. المعمارية العامة

### هيكل Monorepo

```

my_app/
├── backend-fastapi/        # Backend (Python)
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── dependencies.py
│   └── routers/
│       ├── budget.py
│       └── (farm.py لاحقاً)
│
├── frontend-react/         # Frontend (React)
│   ├── src/
│   │   ├── api/            # API clients
│   │   ├── components/     # React components
│   │   ├── context/        # Global state
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Route pages
│   │   ├── styles/         # Global styles
│   │   ├── utils/          # Helpers
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── .github/workflows/      # CI/CD
└── README.md

```

### القواعد الذهبية

| # | القاعدة | السبب |
|---|---------|-------|
| 1 | **Backend routes في `routers/` منفصلة** | ملف `main.py` صغير |
| 2 | **Frontend contexts لكل تطبيق** | `ZekrDataContext`, `BudgetContext` |
| 3 | **Shared UI in `components/ui/`** | Modal, Toast, ThemeToggle |
| 4 | **App-specific in `components/<app>/`** | `zekr_app/`, `budget/` |
| 5 | **`@/` alias دايماً** | مش `../../` |

---

## 2. Backend Patterns

### 2.1 نمط الـ Router

```python
# backend-fastapi/routers/budget.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from dependencies import get_db

router = APIRouter(prefix="/api/budget", tags=["budget"])

@router.get("/summary")
def get_summary(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    ...
```

التسجيل في main.py:

```python
from routers import budget

app.include_router(budget.router)
```

2.2 نمط الـ Model

```python
# backend-fastapi/models.py
from sqlalchemy import (
    Column, String, Float, Integer, BigInteger, Boolean,
    ForeignKey, Index, UniqueConstraint,
)

class BudgetLimit(Base):
    __tablename__ = "budget_limits"

    id = Column(String, primary_key=True)
    category_id = Column(
        String,
        ForeignKey("budget_categories.id", ondelete="CASCADE"),
        nullable=False,
    )
    month = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(BigInteger, nullable=False)

    __table_args__ = (
        UniqueConstraint("category_id", "month", name="uq_budget_limit"),
        Index("ix_budget_limits_month", "month"),
    )
```

قواعد:

· ✅ id = String بادئة (cat_, txn_, lim_)
· ✅ created_at = BigInteger (ms)
· ✅ ondelete="CASCADE" للـ child tables
· ✅ Index على الأعمدة اللي بتتفلتر كتير
· ✅ UniqueConstraint للحقول المركبة

2.3 نمط الـ Schema

```python
# backend-fastapi/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List

class BudgetLimitCreate(BaseModel):
    category_id: str
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    amount: float = Field(..., gt=0)

class BudgetLimitItem(BaseModel):
    id: str
    amount: float
    spent: float
    status: str  # "safe" | "warning" | "over"

class BudgetLimitsResponse(BaseModel):
    month: str
    limits: list[BudgetLimitItem]
    total_limit: float
```

قواعد:

· ✅ Field(..., pattern=...) للتحقق
· ✅ Field(..., gt=0) للأرقام الموجبة
· ✅ Optional[str] للحقول الاختيارية
· ✅ Enrichment في الـ response (spent, status, category_name)

2.4 نمط الـ Endpoint (مع Enrichment)

```python
@router.get("/limits", response_model=BudgetLimitsResponse)
def list_limits(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    # 1. جلب الأساسيات
    limits = db.query(BudgetLimit).filter(BudgetLimit.month == month).all()
    
    # 2. Batch fetch للـ related data (تفادي N+1)
    cat_ids = [l.category_id for l in limits]
    cats = db.query(BudgetCategory).filter(
        BudgetCategory.id.in_(cat_ids)
    ).all()
    cat_map = {c.id: c for c in cats}
    
    # 3. حساب aggregated data (استعلام واحد)
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
    
    # 4. بناء الـ response (enriched)
    items = []
    for lim in limits:
        cat = cat_map.get(lim.category_id)
        spent = spent_map.get(lim.category_id, 0.0)
        percent = (spent / lim.amount * 100) if lim.amount > 0 else 0
        
        items.append(BudgetLimitItem(
            id=lim.id,
            amount=lim.amount,
            spent=spent,
            status=_status(percent),
            category_name=cat.name if cat else "غير محدد",
            ...
        ))
    
    return BudgetLimitsResponse(month=month, limits=items, ...)
```

الدروس:

· ✅ دفعة واحدة للـ related data (تفادي N+1)
· ✅ Aggregation في SQL (مش في Python)
· ✅ Enrichment في الـ backend (الـ frontend ما يحسبش)

2.5 نمط الـ Upsert (Create or Update)

```python
@router.post("/limits")
def create_or_update_limit(data: BudgetLimitCreate, db: Session = Depends(get_db)):
    existing = db.query(BudgetLimit).filter(
        BudgetLimit.category_id == data.category_id,
        BudgetLimit.month == data.month,
    ).first()
    
    if existing:
        existing.amount = data.amount
        existing.updated_at = now
        db.commit()
        return existing
    else:
        new_lim = BudgetLimit(id=f"lim_{uuid4().hex[:12]}", ...)
        db.add(new_lim)
        db.commit()
        return new_lim
```

الفايدة: endpoint واحد بدل اتنين → UX أفضل.

2.6 نمط الـ Aggregation

```python
# ✅ صح — استعلام واحد
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

total_income = 0
total_expense = 0
for t, count, total in totals:
    if t == "income":
        total_income = float(total)
    elif t == "expense":
        total_expense = float(total)

# ❌ غلط — استعلامين
total_income = db.query(...).filter(type="income").scalar()
total_expense = db.query(...).filter(type="expense").scalar()
```

---

3. Frontend Context Pattern

3.1 هيكل الـ Context

```jsx
// src/context/BudgetContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from './ToastContext'

const BudgetContext = createContext(null)

export function BudgetProvider({ children }) {
  const { showToast } = useToast()
  
  // 1. States
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [currentMonth, _setCurrentMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 2. Refs للـ stable access
  const limitsRef = useRef(limits)
  useEffect(() => { limitsRef.current = limits }, [limits])
  
  // 3. Helpers
  const enrichTxn = useCallback((txn, cats = categories) => { ... }, [categories])
  const adjustSummary = useCallback((delta) => { ... }, [])
  const checkLimitChange = useCallback((...args) => { ... }, [showToast])
  
  // 4. Loaders
  const loadCategories = useCallback(async () => { ... }, [])
  const loadMonthData = useCallback(async (month, cats, cmp) => { ... }, [...])
  
  // 5. Effects (initial + month change + compare change)
  useEffect(() => { /* initial load */ }, [])
  useEffect(() => { /* month change */ }, [currentMonth])
  useEffect(() => { /* compare change */ }, [compareMonth])
  
  // 6. CRUD (Optimistic)
  const createTransaction = useCallback(async (data) => { ... }, [...])
  const updateTransaction = useCallback(async (id, data) => { ... }, [...])
  const deleteTransaction = useCallback(async (id) => { ... }, [...])
  
  // 7. Value object
  const value = { categories, transactions, summary, ... }
  
  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be inside BudgetProvider')
  return ctx
}
```

3.2 قواعد الـ Context

# القاعدة السبب
1 useCallback لكل handler تفادي re-renders
2 useRef للـ "latest value" تفادي stale closures
3 enrichTxn helper بيانات كاملة في كل مكان
4 adjustSummary تحديث محلي بدل reload
5 Effects منفصلة (initial/month/compare) تحكم دقيق
6 isFirstXxxRef تفادي تنفيذ effect أول مرة

3.3 نمط isFirstRef (مهم جداً)

```jsx
// ✅ صح
const isFirstMonthRef = useRef(true)

useEffect(() => {
  if (isFirstMonthRef.current) {
    isFirstMonthRef.current = false
    return  // ← تفادي التكرار مع الـ initial load
  }
  // ...
}, [currentMonth])

// ❌ غلط — بيتنفذ مع الـ mount (تكرار الطلبات)
useEffect(() => {
  if (!currentMonth) return
  loadMonthData(currentMonth)
}, [currentMonth])
```

لماذا؟

· الـ useEffect بيتنفذ مرة أولى لما الـ component يتعمله mount
· لو معندناش isFirstRef → بيطلب البيانات مرتين (مرة من initial، ومرة من effect)

3.4 نمط Optimistic Updates

```jsx
const createTransaction = useCallback(async (data) => {
  // 1. Temp ID
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const optimistic = enrichTxn({ ...data, id: tempId, created_at: Date.now() })
  
  // 2. أضف فوراً (UI شعور بالسرعة)
  setTransactions((prev) => sortTxns([optimistic, ...prev]))
  adjustSummary({ income: ..., expense: ..., count: 1 })
  
  try {
    // 3. API call
    const saved = await apiCreateTxn(data)
    const enriched = enrichTxn(saved)
    
    // 4. استبدال temp بالحقيقي
    setTransactions((prev) =>
      prev.map((t) => (t.id === tempId ? enriched : t))
    )
    showToast('تمت الإضافة')
    return enriched
  } catch (err) {
    // 5. Rollback
    setTransactions((prev) => prev.filter((t) => t.id !== tempId))
    adjustSummary({ income: -..., expense: -..., count: -1 })
    showToast(err.message || 'فشل الإضافة')
    throw err
  }
}, [enrichTxn, adjustSummary, showToast, ...])
```

الفايدة: المستخدم بيشوف النتيجة فوراً (قبل رد السيرفر).

3.5 نمط refreshInsights (Lazy Refresh)

```jsx
// ✅ helper لإعادة تحميل جزء معين فقط
const refreshInsights = useCallback(async (monthOverride, compareOverride) => {
  const m = monthOverride !== undefined ? monthOverride : currentMonth
  const c = compareOverride !== undefined ? compareOverride : compareMonth
  if (!m) { setInsights(null); return }
  try {
    const ins = await getInsights(m, c)
    setInsights(ins)
  } catch (err) {
    console.error('فشل تحميل insights:', err)
  }
}, [currentMonth, compareMonth])

// في createTransaction
await apiCreateTxn(data)
refreshInsights()  // ← تحديث سريع بدون reload كامل
```

---

4. Data Management

4.1 Enrichment في الـ Context

```jsx
// ✅ كل transaction بيجي مع بيانات تصنيفه
const enrichTxn = useCallback((txn, cats = categories) => {
  const cat = cats.find((c) => c.id === txn.category_id)
  return {
    ...txn,
    category_name: cat?.name ?? txn.category_name ?? null,
    category_icon: cat?.icon ?? txn.category_icon ?? null,
    category_color: cat?.color ?? txn.category_color ?? null,
  }
}, [categories])
```

الفايدة: الـ components ما تحتاجش تعمل categories.find() كل مرة.

4.2 catMap بدل array.find

```jsx
// ❌ بطيء (O(n) لكل صف)
{txns.map((t) => {
  const cat = categories.find((c) => c.id === t.category_id)
  // ...
})}

// ✅ سريع (O(1) lookup)
const catMap = useMemo(
  () => Object.fromEntries(categories.map((c) => [c.id, c])),
  [categories]
)

{txns.map((t) => {
  const cat = catMap[t.category_id]
  // ...
})}
```

4.3 Sorting Pattern

```jsx
function sortTxns(list) {
  return [...list].sort((a, b) => {
    // الأحدث أولاً
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    // نفس التاريخ: الأحدث created_at
    return (b.created_at || 0) - (a.created_at || 0)
  })
}
```

4.4 Formatters سريعة (بدون toLocaleString)

```jsx
// ❌ بطيء جداً (2ms × 947 صف = 1.9 ثانية!)
count.toLocaleString('en')

// ✅ سريع (0.1ms)
const AR_MONTHS = ['ينا', 'فبر', 'مار', ...]

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${decPart}`
}

function formatDate(s) {
  if (!s) return '—'
  const parts = s.split('-')
  if (parts.length !== 3) return s
  const y = parts[0]
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return `${d} ${AR_MONTHS[m] || parts[1]} ${y}`
}
```

الدرس: toLocaleString بطيء جداً مع كمية كبيرة. استخدم formatter مخصص.

---

5. Performance Patterns

5.1 Virtual Scrolling

```jsx
import { VariableSizeList as VirtualList } from 'react-window'

// ✅ 947 صف → ~30 في DOM
<VirtualList
  ref={listRef}
  height={listHeight}
  itemCount={filteredTxns.length}
  itemSize={getItemSize}  // ← function للـ variable heights
  width={listWidth}
  itemData={virtualData}
  overscanCount={5}
>
  {VirtualTransactionRow}
</VirtualList>
```

الدروس:

· ✅ VariableSizeList للصفوف اللي بتتوسع
· ✅ getItemSize function (مش رقم ثابت)
· ✅ resetAfterIndex بعد expand
· ✅ ResizeObserver لـ width
· ✅ overscanCount: 5 (10% إضافي)

5.2 React.memo على الـ Rows

```jsx
const TransactionRow = memo(function TransactionRow({
  txn,
  category,
  onEdit,
  onDelete,
  isExpanded,
  onToggle,
}) {
  // ...
})
```

5.3 useCallback على Handlers

```jsx
// ✅ stable reference
const handleOpenEdit = useCallback((txn) => {
  setEditingTxn(txn)
  setIsFormOpen(true)
}, [])

// ❌ جديد كل render
const handleOpenEdit = (txn) => {
  setEditingTxn(txn)
  setIsFormOpen(true)
}
```

5.4 useMemo على Filtered Data

```jsx
const filteredTxns = useMemo(() => {
  const filtered = transactions.filter(...)
  return filtered.sort(...)
}, [transactions, filterType, filterCategory, deferredSearch])
```

5.5 useDeferredValue للبحث

```jsx
const [search, setSearch] = useState('')
const deferredSearch = useDeferredValue(search)

// في filter:
if (deferredSearch.trim()) {
  // ...
}
```

الفايدة: الكتابة في البحث سلسة جداً (الفيلتر يتأخر ~100ms).

5.6 نمط ResizeObserver

```jsx
const listContainerRef = useRef(null)
const [listWidth, setListWidth] = useState(0)

useEffect(() => {
  const el = listContainerRef.current
  if (!el) return
  const update = () => setListWidth(el.clientWidth)
  update()
  const ro = new ResizeObserver(update)
  ro.observe(el)
  return () => ro.disconnect()
}, [])
```

---

6. UI Component Patterns

6.1 Stats Cards Pattern

```jsx
<div className={styles.summaryCards}>
  <div className={`${styles.summaryCard} ${styles.income}`}>
    <span className={styles.summaryLabel}>
      الدخل
      {insights?.comparison?.income_change_percent !== undefined && (
        <span className={`${styles.changeBadge} ${
          insights.comparison.income_change_percent >= 0 ? styles.up : styles.down
        }`}>
          {insights.comparison.income_change_percent >= 0 ? '↑' : '↓'}
          {Math.abs(insights.comparison.income_change_percent).toFixed(0)}%
        </span>
      )}
    </span>
    <span className={styles.summaryValue}>
      {formatAmount(summary.total_income)}
    </span>
  </div>
</div>
```

6.2 Expandable Rows (Variable Heights)

```jsx
const TransactionRow = memo(function TransactionRow({
  txn, category, onEdit, onDelete, isExpanded, onToggle,
}) {
  const hasMore = !!(txn.details || txn.description)
  const showExpanded = isExpanded && hasMore

  const handleRowClick = () => {
    if (hasMore && onToggle) onToggle()
  }

  return (
    <div className={styles.itemWrapper}>
      <div
        className={`${styles.item} ${showExpanded ? styles.itemExpanded : ''}`}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleRowClick()
          }
        }}
        role={hasMore ? 'button' : undefined}
        tabIndex={hasMore ? 0 : undefined}
        aria-expanded={showExpanded}
      >
        {/* Header content */}
        <div
          className={styles.itemActions}
          onClick={(e) => e.stopPropagation()}
        >
          {/* edit/delete */}
        </div>
        {hasMore && <ChevronIcon className={showExpanded ? 'open' : ''} />}
      </div>
      
      {showExpanded && (
        <div className={styles.expandedContent}>
          {txn.details && <DetailRow label="📝 تفاصيل" value={txn.details} />}
          {txn.description && <DetailRow label="📄 وصف" value={txn.description} />}
        </div>
      )}
    </div>
  )
})
```

الدروس:

· ✅ e.stopPropagation() على أزرار actions
· ✅ role="button" + tabIndex للـ accessibility
· ✅ aria-expanded للـ screen readers
· ✅ keyboard support (Enter/Space)
· ✅ showExpanded يعتمد على hasMore كمان

6.3 Empty States ذكية

```jsx
{filteredTxns.length === 0 ? (
  <div className={styles.empty}>
    <div className={styles.emptyIcon}>📭</div>
    <p className={styles.emptyTitle}>
      {transactions.length === 0
        ? currentMonth === null
          ? 'لا توجد معاملات بعد'
          : 'لا توجد معاملات في هذا الشهر'
        : 'لا توجد نتائج تطابق الفلتر'}
    </p>
    {transactions.length === 0 && (
      <button onClick={handleOpenAdd}>إضافة أول معاملة</button>
    )}
  </div>
) : (
  // list
)}
```

الفايدة: رسالة مخصصة لكل حالة (شهر فاضي، فلتر، إلخ).

6.4 Skeleton Loaders

```jsx
{loading && !stats && (
  <div className={styles.skeletonContainer}>
    <div className={styles.skeletonCards}>
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCard} />
    </div>
    <div className={styles.skeletonChart} />
  </div>
)}
```

---

7. Routing & Navigation

7.1 URL State Pattern (مهم جداً)

```jsx
// ❌ state محلي — refresh يضيع
const [period, setPeriod] = useState('week')

// ✅ URL — refresh/back/deep-linking
import { useSearchParams } from 'react-router-dom'

const [searchParams, setSearchParams] = useSearchParams()
const rawPeriod = searchParams.get('period')
const period = ['day', 'week', 'month'].includes(rawPeriod) ? rawPeriod : 'day'

const setPeriod = (newPeriod) => {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev)
    next.set('period', newPeriod)
    return next
  }, { replace: true })
}
```

متى نستخدم replace: true؟

· ✅ period (toggle): replace: true (ما يعملش history entries كتير)
· ✅ zekr (اختيار): بدون replace (back يرجّع الاختيار السابق)

7.2 URL ↔ Context Sync

```jsx
// 1. On first load: if URL has no zekr, mirror context's value
const zekrInitRef = useRef(false)
useEffect(() => {
  if (zekrInitRef.current) return
  if (allAdhkar.length === 0) return
  zekrInitRef.current = true
  if (!urlZekrId && currentZekrId) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('zekr', currentZekrId)
      return next
    }, { replace: true })
  }
}, [allAdhkar.length, urlZekrId, currentZekrId, setSearchParams])

// 2. Sync URL → Context (deep link)
useEffect(() => {
  if (!urlZekrId) return
  if (urlZekrId === currentZekrId) return
  if (!allAdhkar.some((z) => z.id === urlZekrId)) return
  setCurrentZekrId(urlZekrId)
}, [urlZekrId, allAdhkar, currentZekrId, setCurrentZekrId])

// 3. Cleanup: URL zekr was deleted
useEffect(() => {
  if (!urlZekrId) return
  if (allAdhkar.length === 0) return
  if (allAdhkar.some((z) => z.id === urlZekrId)) return
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev)
    next.delete('zekr')
    return next
  }, { replace: true })
}, [urlZekrId, allAdhkar, setSearchParams])
```

7.3 Nested Routes

```jsx
// App.jsx
<Routes>
  <Route path="/" element={<Home />} />
  
  <Route path="/zekr" element={<ZekrLayout />}>
    <Route index element={<Navigate to="/zekr/sabh" replace />} />
    <Route path="sabh" element={<ZekrSabh />} />
    <Route path="stats" element={<ZekrStats />} />
    <Route path="settings" element={<ZekrSettings />} />
    <Route path="*" element={<Navigate to="/zekr/sabh" replace />} />
  </Route>
  
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

في ZekrLayout:

```jsx
<Outlet />  {/* ← يستقبل الصفحات الابنة */}
```

---

8. Forms & Validation

8.1 Form Modal Pattern

```jsx
function TransactionFormModal({ isOpen, onClose, onConfirm, initial, categories }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // إعادة تعبئة عند الفتح
  useEffect(() => {
    if (!isOpen) return
    if (initial) {
      setType(initial.type || 'expense')
      setAmount(String(initial.amount ?? ''))
      setCategoryId(initial.category_id || '')
    } else {
      setType('expense')
      setAmount('')
      setCategoryId('')
    }
    setError('')
    setIsSubmitting(false)
  }, [isOpen, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const numAmount = Number(amount.trim().replace(',', '.'))
    if (!amount.trim()) { setError('الرجاء إدخال المبلغ'); return }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError('المبلغ يجب أن يكون رقماً موجباً'); return
    }
    if (!categoryId) { setError('الرجاء اختيار تصنيف'); return }

    try {
      setIsSubmitting(true)
      await onConfirm({ amount: numAmount, type, category_id: categoryId })
    } catch (err) {
      setError(err?.message || 'حدث خطأ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'تعديل' : 'إضافة'}>
      <form onSubmit={handleSubmit} noValidate>
        {/* fields */}
        {error && <div role="alert">{error}</div>}
        <div className={styles.buttons}>
          <button type="button" onClick={onClose} disabled={isSubmitting}>إلغاء</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : initial ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

8.2 Validation Rules

```jsx
// ✅ قبل الإرسال
if (!trimmedText) { setError('النص مطلوب'); return }

// ✅ تحقق من الرقم
const num = Number(amount.trim().replace(',', '.'))
if (!Number.isFinite(num) || num <= 0) {
  setError('رقم موجب مطلوب')
  return
}

// ✅ تحقق من التاريخ
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  setError('تاريخ غير صالح')
  return
}

// ✅ تحقق من التصنيف
if (filteredCategories.length === 0) {
  setError('لا توجد تصنيفات لهذا النوع')
  return
}
```

8.3 Form Reset on Mount

```jsx
// في نهاية useEffects — reset error + submitting
useEffect(() => {
  if (!isOpen) return
  // ...
  setError('')
  setIsSubmitting(false)
}, [isOpen, initial])
```

---

9. Modals & Back Button

9.1 useModalBackButton Hook

```jsx
// hooks/useModalBackButton.js
import { useEffect, useRef } from 'react'

const stack = []
let isListenerInitialized = false

function handlePopState(e) {
  const top = stack[stack.length - 1]
  if (!top) return
  if (e.state?.__modalId === top.id) return
  top.poppedByBack = true
  top.onClose()
}

export function useModalBackButton(isOpen, onClose) {
  const onCloseRef = useRef(onClose)
  const idRef = useRef(null)
  if (!idRef.current) idRef.current = `modal-${Math.random().toString(36).slice(2, 9)}`

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    initGlobalListener()
    const currentId = idRef.current
    const entry = { id: currentId, onClose: () => onCloseRef.current?.(), poppedByBack: false }
    stack.push(entry)
    window.history.pushState({ ...window.history.state, __modalId: currentId }, '')

    return () => {
      const idx = stack.indexOf(entry)
      if (idx !== -1) stack.splice(idx, 1)
      removeGlobalListenerIfNeeded()
      if (!entry.poppedByBack && window.history.state?.__modalId === currentId) {
        window.history.back()
      }
    }
  }, [isOpen])
}
```

الاستخدام:

```jsx
function Modal({ isOpen, onClose, children }) {
  useModalBackButton(isOpen, onClose)  // ← Back يقفل المودال
  if (!isOpen) return null
  return <div className="modal-overlay">{children}</div>
}
```

9.2 FocusMode / Overlay

```jsx
// في FocusMode
useModalBackButton(isOpen, () => setIsFocusMode(false))
```

الفايدة: المستخدم يضغط Back في Focus Mode → يخرج من الـ mode، مش من الصفحة.

---

10. Toast Notifications

10.1 Setup

```jsx
// context/ToastContext.jsx
const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
```

10.2 في الـ Context

```jsx
const { showToast } = useToast()

// نجاح
showToast('تمت إضافة المعاملة')

// خطأ
showToast(err.message || 'فشل الإضافة')

// تحذير (مع emoji)
showToast(`⚠️ اقتربت من ميزانية "${name}"`)
showToast(`🚨 تجاوزت ميزانية "${name}"!`)
```

10.3 Toast Patterns

```jsx
// ✅ Success بعد كل CRUD
showToast(existed ? 'تم التحديث' : 'تمت الإضافة')

// ✅ Error في catch
showToast(err.message || 'فشل الحفظ')

// ✅ Warning قبل action خطير
showToast('سيتم حذف كل البيانات', 'warning')

// ❌ ما تعملش toast للـ delete rollback (تحسّن مش تنبيه)
```

---

11. PWA Setup

11.1 vite.config.js

```js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'مساحتي الرقمية',
        short_name: 'مساحتي',
        theme_color: '#059669',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  base: '/',  // ← للـ web فقط (لو Capacitor بعدين: './')
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: { host: 'localhost', port: 3000 },
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
```

11.2 .env في frontend-react/

```bash
# .env.development
VITE_API_URL=

# .env.production
VITE_API_URL=

# .env.example (commit)
VITE_API_URL=
```

11.3 src/api/client.js

```js
const API_URL = import.meta.env.VITE_API_URL || ''
// في dev: '' → proxy → localhost:8000
// في prod: '' → same origin
```

---

12. GitHub Actions (APK)

12.1 .github/workflows/build-apk.yml

```yaml
name: Build Android APK

on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"
          cache-dependency-path: frontend-react/package-lock.json
      
      - uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: 21
      
      - name: Install Dependencies
        working-directory: frontend-react
        run: npm ci
      
      - name: Build Web App
        working-directory: frontend-react
        env:
          VITE_TARGET: android  # ← لو Capacitor
        run: npm run build
      
      - name: Capacitor Sync
        working-directory: frontend-react
        run: npx cap sync android
      
      - name: Build APK
        working-directory: frontend-react/android
        run: |
          chmod +x ./gradlew
          ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: masahati-app-debug
          path: frontend-react/android/app/build/outputs/apk/debug/app-debug.apk
```

12.2 Capacitor Setup (للـ APK)

```js
// vite.config.js
base: process.env.VITE_TARGET === 'android' ? './' : '/'

// main.jsx
const Router = import.meta.env.VITE_TARGET === 'android' ? HashRouter : BrowserRouter
```

الدروس:

· ✅ base: './' في APK (مش /)
· ✅ HashRouter بدل BrowserRouter
· ✅ VITE_API_URL كامل (مش localhost)

---

13. الأخطاء الشائعة وحلولها

13.1 toLocaleString بطيء جداً

الأعراض: كل ضغطة زر تاخد 2-3 ثواني.

السبب: toLocaleString('ar-EG') بطيء (2ms × 947 صف).

الحل:

```jsx
// ❌
amount.toLocaleString('ar-EG')

// ✅
function formatAmount(n) {
  const fixed = Number(n || 0).toFixed(2)
  const [int, dec] = fixed.split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`
}
```

13.2 Hooks قبل التعريف

الأعراض: Cannot access 'handleX' before initialization.

السبب: استخدام hook قبل تعريفه.

الحل: ترتيب صحيح:

```jsx
// 1. Helper callbacks
const handleToggle = useCallback(...)
const getItemSize = useCallback(...)

// 2. Derived values
const virtualData = useMemo(...)

// 3. Effects
useEffect(...)
```

13.3 useMemo مع Object

الأعراض: nextCreate is not a function.

السبب: useMemo({...}, []) بدل useMemo(() => ({...}), []).

الحل:

```jsx
// ❌
const value = useMemo({ a, b, c }, [a, b, c])

// ✅
const value = useMemo(() => ({ a, b, c }), [a, b, c])

// أو أبسط
const value = { a, b, c }
```

13.4 Missing Effect for Month Change

الأعراض: تغيير الشهر ما يحدّثش البيانات.

السبب: useEffect لـ currentMonth مش موجود.

الحل:

```jsx
const isFirstMonthRef = useRef(true)
useEffect(() => {
  if (isFirstMonthRef.current) {
    isFirstMonthRef.current = false
    return
  }
  setLoading(true)
  loadMonthData(currentMonth, null, compareMonth)
    .finally(() => setLoading(false))
}, [currentMonth])
```

13.5 props في Layout vs children

الأعراض: Prop drilling عميق.

الحل: استخدم Context بدل props.

13.6 Database Schema Change

الأعراض: no such column.

السبب: create_all() ما بيعملش ALTER.

الحل: امسح الجداول وأعد إنشاءها (أو استخدم Alembic).

13.7 SQLite Locking

الأعراض: database is locked.

الحل: SQLite بتتعامل مع concurrent reads — المشكلة دايماً في writes متزامنة (نادرة في تطبيق شخصي).

13.8 WebSocket HMR مش شغال

الأعراض: WebSocket connection failed.

الحل في vite.config.js:

```js
server: {
  port: 3000,
  host: true,
  strictPort: true,
  hmr: { host: 'localhost', port: 3000 },
},
devOptions: {
  enabled: false,  // في VitePWA
  type: 'module',
},
```

13.9 الـ virtual:pwa-register مش شغال

السبب: مش محتاجها مع autoUpdate.

الحل: احذف السطر من main.jsx.

13.10 ImageMagick SVG مش شغال

الأعراض: unable to read image data.

الحل: استخدم rsvg-convert:

```bash
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
```

---

14. Checklist لتطبيق جديد

🏗️ Backend Setup (يوم 1)

☐ models.py — Models مع FK + Index
☐ schemas.py — Create/Update/Response
☐ routers/<app>.py — APIRouter مع prefix
☐ main.py — app.include_router()
☐ Base.metadata.create_all() في main.py
☐ اختبر في /docs

🎨 Frontend Setup (يوم 2)

☐ api/<app>Client.js — كل الـ endpoints
☐ context/<App>Context.jsx — provider + hook
☐ pages/<App>Layout.jsx — layout
☐ pages/<App>Home.jsx — الصفحة الرئيسية
☐ pages/<App>Settings.jsx — إعدادات
☐ تحديث App.jsx — routes
☐ تحديث main.jsx — provider
☐ تحديث Home.jsx — إضافة بطاقة

🎯 Features (أسبوع 1)

☐ CRUD الأساسي
☐ Filters + Search
☐ Modals (إضافة/تعديل/حذف)
☐ Toast notifications
☐ Empty states
☐ Loading states

📊 Analytics (أسبوع 2)

☐ insights endpoint
☐ KPI cards
☐ Charts (Donut + Bar)
☐ Reports page
☐ CSV export

📱 PWA (أسبوع 2)

☐ vite-plugin-pwa setup
☐ Manifest + icons
☐ Service Worker + caching
☐ Install prompt

🚀 Polish (أسبوع 3)

☐ Optimistic updates
☐ Virtual scrolling (لو 500+)
☐ Keyboard shortcuts
☐ Dark mode
☐ Mobile responsive
☐ APK via Capacitor

---

🎯 أهم 10 دروس

# الدرس المثال
1 toLocaleString بطيء استخدم formatter مخصص
2 URL state للفلاتر ?month=2023-02 بدل useState
3 Optimistic updates UI فوري قبل رد السيرفر
4 Context + useCallback تفادي re-renders
5 isFirstRef للأeffects تفادي double-fetch
6 Enrichment في الـ response category_name في كل transaction
7 Virtual scrolling للـ 500+ react-window
8 ResizeObserver للـ width virtual lists responsive
9 ondelete="CASCADE" تنظيف تلقائي للـ related
10 Toast للـ actions الحساسة تفادي silent failures

---

📎 ملفات مرجعية إضافية

الملف الموضوع
docs/FARM-APP-REQUIREMENTS.md متطلبات تطبيق الزراعة
docs/CSS-VARIABLES-MIGRATION.md خطة نقل CSS Variables
docs/API.md توثيق endpoints (TODO)
README.md نظرة عامة

---

🤍 ملاحظة ختامية

اللي اتعلمناه من Zekr:

· معمارية Routing (Tabs → Pages)
· URL State للفلاتر
· Streak + Comparison + CSV
· PWA Setup
· Focus Mode + Shortcuts

اللي اتعلمناه من Budget:

· Optimistic CRUD كامل
· Virtual Scrolling + Expandable Rows
· Insights + KPIs
· Flexible Comparison
· Monthly Limits + Warnings

التطبيقات القادمة:

· ابدأ بـ Zekr (أبسط)
· خد نفس الأنماط من Budget
· خد الـ Insights pattern
· متكررش الحلول — استخدم الـ checklist

كل تطبيق جديد = فرصة لتحسين الأنماط.

---

آخر تحديث: 2026-10-23
الحالة: مرجع حي — يتحدّث مع كل تطبيق جديد

```

---

## 📌 كيف تستخدم الملف

### 1. احفظه
```bash
cd ~/my_app
mkdir -p docs
# احفظ كـ docs/DEVELOPMENT-PATTERNS.md
```

2. عند بدء تطبيق جديد (الزراعة)

· افتح الملف
· اقرأ قسم Checklist لتطبيق جديد
· اتبع الأنماط خطوة بخطوة

3. عند مواجهة مشكلة

· ابحث في الأخطاء الشائعة
· لو مش موجودة، ضيفها بعد الحل

4. بعد كل تطبيق

· حدّث الملف بجديد
· ده مرجع حي — بيتحسن مع الوقت

---

👈 ملاحظات

الملف ده فيه:

· ✅ 14 قسم أساسي
· ✅ 40+ مثال كود
· ✅ 15+ درس مستفاد
· ✅ Checklist شامل

اللي ناقص (نضيفه لاحقاً):

· أمثلة من تطبيق الزراعة (لما نبدأه)
· Patterns إضافية (Auth, Push Notifications)
· Test patterns

لو حابب إضافات معينة، قولي. 🚀
