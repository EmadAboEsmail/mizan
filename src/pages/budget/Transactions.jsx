import { useState, useMemo, useCallback, useDeferredValue } from 'react'
import { Plus } from 'lucide-react'
import { useBudgetUI, getCurrentMonth } from '@/contexts/BudgetContext'
import {
  useCategoriesQuery,
  useTransactionsQuery,
  useSummaryQuery,
  useInsightsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from '@/queries/budget'
import TransactionFormModal from '@/components/budget/TransactionFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import LimitsOverview from '@/components/budget/limits/LimitsOverview.jsx'
import TransactionsTopBar from '@/components/budget/transactions/TransactionsTopBar.jsx'
import TransactionsSummary from '@/components/budget/transactions/TransactionsSummary.jsx'
import TransactionsFilters from '@/components/budget/transactions/TransactionsFilters.jsx'
import TransactionsList from '@/components/budget/transactions/TransactionsList.jsx'
import { formatAmount } from '@/components/budget/transactions/lib/transactionsHelpers.js'
import styles from './Transactions.module.scss'

const EMPTY_LIST = []

function BudgetTransactions() {
  const { currentMonth, compareMonth, setCurrentMonth } = useBudgetUI()

  // ─── Queries ───
  const { data: categories = EMPTY_LIST } = useCategoriesQuery()
  const { data: transactions = EMPTY_LIST } = useTransactionsQuery(currentMonth)
  const { data: summary = null } = useSummaryQuery(currentMonth)
  const { data: insights = null } = useInsightsQuery(currentMonth, compareMonth)

  // ─── Mutations ───
  const { mutateAsync: createTransaction } =
    useCreateTransactionMutation(currentMonth)
  const { mutateAsync: updateTransaction } =
    useUpdateTransactionMutation(currentMonth)
  const { mutateAsync: deleteTransaction, isPending: isDeleting } =
    useDeleteTransactionMutation(currentMonth)

  // ─── UI state ───
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTxn, setEditingTxn] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ─── Filters ───
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  // ─── Expanded row ───
  const [expandedId, setExpandedId] = useState(null)

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  const filteredTxns = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory && t.category_id !== filterCategory) return false
      if (deferredSearch.trim()) {
        const q = deferredSearch.trim().toLowerCase()
        const catName = catMap[t.category_id]?.name || ''
        const haystack =
          `${t.details || ''} ${t.description || ''} ${catName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (b.created_at || 0) - (a.created_at || 0)
    })
  }, [transactions, filterType, filterCategory, deferredSearch, catMap])

  const effectiveExpandedId =
    expandedId && filteredTxns.some((t) => t.id === expandedId)
      ? expandedId
      : null

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
        await updateTransaction({ id: editingTxn.id, data: payload })
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
      await deleteTransaction(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // التراجع ورسالة الخطأ يتمان داخل useDeleteTransactionMutation
    }
  }, [deleteTarget, deleteTransaction])

  const handleToggleMonthMode = useCallback(() => {
    if (currentMonth === null) {
      setCurrentMonth(getCurrentMonth())
    } else {
      setCurrentMonth('all')
    }
  }, [currentMonth, setCurrentMonth])

  const handleToggleExpanded = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

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
        transactions={filteredTxns}
        catMap={catMap}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteClick}
        expandedId={effectiveExpandedId}
        onToggle={handleToggleExpanded}
        totalTransactions={transactions.length}
        currentMonth={currentMonth}
      />

      {filteredTxns.length > 0 &&
        filteredTxns.length !== transactions.length && (
          <p className={styles.resultCount}>
            يُعرض {filteredTxns.length.toLocaleString('en')} من{' '}
            {transactions.length.toLocaleString('en')} معاملة
          </p>
        )}

      {/* زر إضافة عائم في منطقة الإبهام لشاشات الهاتف/APK */}
      <button
        type="button"
        className={styles.fab}
        onClick={handleOpenAdd}
        aria-label="إضافة معاملة جديدة"
        title="إضافة معاملة جديدة"
      >
        <Plus size={25} strokeWidth={2.5} aria-hidden="true" />
      </button>

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
        )} ج.م. لا يمكن التراجع.`}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
        cancelLabel="إلغاء"
        danger
      />
    </div>
  )
}

export default BudgetTransactions
