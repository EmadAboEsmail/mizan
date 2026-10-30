import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
  useRef,
} from 'react'
import { useBudget } from '@/contexts/BudgetContext'
import TransactionFormModal from '@/components/budget/TransactionFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import LimitsOverview from '@/components/budget/limits/LimitsOverview.jsx'
import TransactionsTopBar from '@/components/budget/transactions/TransactionsTopBar.jsx'
import TransactionsSummary from '@/components/budget/transactions/TransactionsSummary.jsx'
import TransactionsFilters from '@/components/budget/transactions/TransactionsFilters.jsx'
import TransactionsList from '@/components/budget/transactions/TransactionsList.jsx'
import {
  formatAmount,
  ROW_HEIGHT,
  groupTransactionsByDate,
} from '@/components/budget/transactions/transactionsHelpers.js'
import styles from './Transactions.module.scss'

// ✅ برة الـ component (ثابت)
const DATE_HEADER_HEIGHT = 48

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
    insights,
  } = useBudget()

  // ─── UI state ───
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTxn, setEditingTxn] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ─── Filters ───
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  // ─── Expanded row ───
  const [expandedId, setExpandedId] = useState(null)

  // ─── Virtual list refs ───
  const listRef = useRef(null)
  const listContainerRef = useRef(null)
  const [listWidth, setListWidth] = useState(0)

  // ─── Measure container width ───
  useEffect(() => {
    const el = listContainerRef.current
    if (!el) return
    const update = () => setListWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ─── catMap ───
  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  // ─── Filtered txns ───
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

  // ─── Handlers ───
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

  const handleToggleExpanded = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  // ─── Flat items (headers + transactions) ───
  const flatItems = useMemo(
    () => groupTransactionsByDate(filteredTxns),
    [filteredTxns]
  )

  // ─── Row height per item ───
  const getItemSize = useCallback(
    (index) => {
      const item = flatItems[index]
      if (!item) return ROW_HEIGHT

      if (item.type === 'header') return DATE_HEADER_HEIGHT

      const { txn } = item
      if (expandedId !== txn.id) return ROW_HEIGHT

      // ✅ ارتفاع الأزرار + padding الإضافي
      let extra = 70 // padding top + bottom + button row
      if (txn.details) extra += 50
      if (txn.description) extra += 55
      return ROW_HEIGHT + extra
    },
    [flatItems, expandedId]
  )
  // ✅ virtualData — كان ناقص!
  const virtualData = useMemo(
    () => ({
      items: flatItems,
      catMap,
      onEdit: handleOpenEdit,
      onDelete: handleDeleteClick,
      expandedId,
      onToggle: handleToggleExpanded,
    }),
    [
      flatItems,
      catMap,
      handleOpenEdit,
      handleDeleteClick,
      expandedId,
      handleToggleExpanded,
    ]
  )

  // ─── List height (approx) ───
  const listHeight = useMemo(() => {
    let total = 0
    for (let i = 0; i < flatItems.length; i++) {
      total += getItemSize(i)
    }
    return Math.min(600, Math.max(ROW_HEIGHT * 2, total))
  }, [flatItems, getItemSize])

  // ✅ effect واحد بس — بيتعامل مع expand + filter
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true)
    }
  }, [expandedId, flatItems.length])

  // ─── Auto-close expanded row if filtered out ───
  useEffect(() => {
    if (!expandedId) return
    const stillExists = filteredTxns.some((t) => t.id === expandedId)
    if (!stillExists) setExpandedId(null)
  }, [filteredTxns, expandedId])

  // ─── Render ───
  return (
    <div className={styles.container}>
      <TransactionsTopBar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onToggleAll={handleToggleMonthMode}
        onAdd={handleOpenAdd}
      />

      <TransactionsSummary
        summary={summary}
        insights={insights}
        isAllMonths={currentMonth === null}
      />

      <LimitsOverview />

      <TransactionsFilters
        filterType={filterType}
        onTypeChange={setFilterType}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        categories={categories}
        search={search}
        onSearchChange={setSearch}
      />

      <TransactionsList
        items={flatItems}
        catMap={catMap}
        expandedId={expandedId}
        onToggle={handleToggleExpanded}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteClick}
        onAdd={handleOpenAdd}
        listHeight={listHeight}
        listWidth={listWidth}
        listRef={listRef}
        listContainerRef={listContainerRef}
        getItemSize={getItemSize}
        virtualData={virtualData}
        totalTransactions={transactions.length}
        currentMonth={currentMonth}
      />

      {filteredTxns.length > 0 && (
        <p className={styles.resultCount}>
          {filteredTxns.length === transactions.length
            ? `${transactions.length} معاملة`
            : `${filteredTxns.length} من ${transactions.length} معاملة`}
        </p>
      )}

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
