import {
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  memo,
} from 'react'
import { useBudget } from '@/context/BudgetContext'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import TransactionFormModal from '@/components/budget/TransactionFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './BudgetTransactions.module.scss'

// ===========================
// Icons
// ===========================
const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

// ===========================
// ✅ Formatters سريعة (بدون toLocaleDateString البطيء)
// ===========================
const AR_MONTHS = [
  'ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون',
  'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس',
]

function formatAmount(n) {
  const num = Number(n || 0)
  // بدون toLocaleString — نستخدم toFixed + تنسيق يدوي
  const fixed = num.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${decPart}`
}

function formatDate(s) {
  if (!s) return '—'
  // s = "YYYY-MM-DD"
  const parts = s.split('-')
  if (parts.length !== 3) return s
  const y = parts[0]
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  const monthName = AR_MONTHS[m] || parts[1]
  return `${d} ${monthName} ${y}`
}

// ===========================
// TransactionRow — memoized
// ===========================
const TransactionRow = memo(function TransactionRow({
  txn,
  category,
  onEdit,
  onDelete,
}) {
  return (
    <li className={styles.item}>
      <CategoryIcon category={category} size={40} />

      <div className={styles.itemInfo}>
        <div className={styles.itemTop}>
          <span className={styles.itemCategory}>
            {category?.name || 'غير محدد'}
          </span>
          <span
            className={`${styles.itemAmount} ${txn.type === 'income'
                ? styles.amountIncome
                : styles.amountExpense
              }`}
          >
            {txn.type === 'income' ? '+' : '−'}
            {formatAmount(txn.amount)}
          </span>
        </div>
        <div className={styles.itemBottom}>
          <span className={styles.itemDesc}>
            {txn.description || txn.details || '—'}
          </span>
          <span className={styles.itemDate}>{formatDate(txn.date)}</span>
        </div>
      </div>

      <div className={styles.itemActions}>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.edit}`}
          onClick={() => onEdit(txn)}
          title="تعديل"
          aria-label="تعديل"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.danger}`}
          onClick={() => onDelete(txn)}
          title="حذف"
          aria-label="حذف"
        >
          <DeleteIcon />
        </button>
      </div>
    </li>
  )
})

// ===========================
// ✅ TransactionList — memoized (نمنع re-render لما الـ modals تتغير)
// ===========================
const TransactionList = memo(function TransactionList({
  txns,
  catMap,
  onEdit,
  onDelete,
}) {
  return (
    <ul className={styles.list}>
      {txns.map((txn) => (
        <TransactionRow
          key={txn.id}
          txn={txn}
          category={catMap[txn.category_id]}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
})

// ===========================
// Main Component
// ===========================
function BudgetTransactions() {
  const {
    transactions,
    summary,
    categories,
    currentMonth,
    setCurrentMonth,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useBudget()

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTxn, setEditingTxn] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

  const deferredSearch = useDeferredValue(search)

  // catMap — stable reference
  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  // filteredTxns — memoized
  const filteredTxns = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory && t.category_id !== filterCategory) return false
      if (deferredSearch.trim()) {
        const q = deferredSearch.trim().toLowerCase()
        const haystack = `${t.details || ''} ${t.description || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (b.created_at || 0) - (a.created_at || 0)
    })
  }, [transactions, filterType, filterCategory, deferredSearch])

  // ===========================
  // ✅ Handlers — كلهم useCallback (المفتاح للسرعة)
  // ===========================
  const handleOpenAdd = useCallback(() => {
    setEditingTxn(null)
    setIsFormOpen(true)
  }, [])

  const handleOpenEdit = useCallback((txn) => {
    setEditingTxn(txn)
    setIsFormOpen(true)
  }, [])

  const handleDeleteClick = useCallback((txn) => {
    setDeleteTarget(txn)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingTxn(null)
  }, [])

  const handleCloseConfirm = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  const handleSubmit = useCallback(
    async (payload) => {
      if (editingTxn) {
        await updateTransaction(editingTxn.id, payload)
      } else {
        await createTransaction(payload)
      }
      setIsFormOpen(false)
      setEditingTxn(null)
    },
    [editingTxn, createTransaction, updateTransaction]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteTransaction(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, deleteTransaction])

  const handleToggleMonthMode = useCallback(() => {
    if (currentMonth === null) {
      const d = new Date()
      setCurrentMonth(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      )
    } else {
      setCurrentMonth('all')
    }
  }, [currentMonth, setCurrentMonth])

  // ===========================
  // Render
  // ===========================
  return (
    <div className={styles.container}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.monthControls}>
          <input
            type="month"
            value={currentMonth || ''}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className={styles.monthInput}
            disabled={currentMonth === null}
            aria-label="اختيار الشهر"
          />
          <button
            type="button"
            className={`${styles.allBtn} ${currentMonth === null ? styles.allActive : ''
              }`}
            onClick={handleToggleMonthMode}
            title={currentMonth === null ? 'العودة للشهر الحالي' : 'عرض كل الفترات'}
          >
            {currentMonth === null ? '📅 شهر' : '🗓️ الكل'}
          </button>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={handleOpenAdd}
          title="إضافة معاملة جديدة"
        >
          <PlusIcon />
          <span>إضافة</span>
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <>
          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.income}`}>
              <span className={styles.summaryLabel}>الدخل</span>
              <span className={styles.summaryValue}>
                {formatAmount(summary.total_income)}
              </span>
            </div>
            <div className={`${styles.summaryCard} ${styles.expense}`}>
              <span className={styles.summaryLabel}>المصروف</span>
              <span className={styles.summaryValue}>
                {formatAmount(summary.total_expense)}
              </span>
            </div>
            <div
              className={`${styles.summaryCard} ${summary.net >= 0 ? styles.income : styles.expense
                }`}
            >
              <span className={styles.summaryLabel}>الصافي</span>
              <span className={styles.summaryValue}>
                {formatAmount(summary.net)}
              </span>
            </div>
          </div>

          {currentMonth === null && (
            <p className={styles.allMonthsNote}>
              📊 إجمالي كل الفترات ({summary.transaction_count} معاملة)
            </p>
          )}
        </>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.typeFilter}>
          <button
            type="button"
            className={filterType === 'all' ? styles.filterActive : ''}
            onClick={() => setFilterType('all')}
          >
            الكل
          </button>
          <button
            type="button"
            className={filterType === 'expense' ? styles.filterActive : ''}
            onClick={() => setFilterType('expense')}
          >
            💸 مصروف
          </button>
          <button
            type="button"
            className={filterType === 'income' ? styles.filterActive : ''}
            onClick={() => setFilterType('income')}
          >
            💰 دخل
          </button>
        </div>

        <div className={styles.filterRow}>
          <select
            className={styles.select}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="فلترة حسب التصنيف"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || '📦'} {c.name}
              </option>
            ))}
          </select>

          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="بحث في التفاصيل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="بحث في المعاملات"
            />
          </div>
        </div>
      </div>

      {/* ✅ قائمة معاملات memoized */}
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
            <button
              type="button"
              className={styles.emptyAddBtn}
              onClick={handleOpenAdd}
            >
              إضافة أول معاملة
            </button>
          )}
        </div>
      ) : (
        <TransactionList
          txns={filteredTxns}
          catMap={catMap}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteClick}
        />
      )}

      {/* عدد النتائج */}
      {filteredTxns.length > 0 && (
        <p className={styles.resultCount}>
          {filteredTxns.length === transactions.length
            ? `${transactions.length} معاملة`
            : `${filteredTxns.length} من ${transactions.length} معاملة`}
        </p>
      )}

      {/* Modals */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onConfirm={handleSubmit}
        initial={editingTxn}
        categories={categories}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={handleCloseConfirm}
        onConfirm={handleDelete}
        title="حذف المعاملة؟"
        message={`سيتم حذف معاملة بقيمة ${formatAmount(
          deleteTarget?.amount || 0
        )}. لا يمكن التراجع.`}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
        cancelLabel="إلغاء"
        danger
      />
    </div>
  )
}

export default BudgetTransactions
