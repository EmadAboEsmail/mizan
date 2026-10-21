import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import {
  getCategories,
  getTransactions,
  getSummary,
  createTransaction as apiCreateTxn,
  updateTransaction as apiUpdateTxn,
  deleteTransaction as apiDeleteTxn,
  createCategory as apiCreateCat,
  updateCategory as apiUpdateCat,
  deleteCategory as apiDeleteCat,
} from '@/api/budgetClient.js'
import { useToast } from './ToastContext'

const BudgetContext = createContext(null)

function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ✅ ترتيب موحد: الأحدث أولاً (تاريخ ثم created_at)
function sortTxns(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (b.created_at || 0) - (a.created_at || 0)
  })
}

export function BudgetProvider({ children }) {
  const { showToast } = useToast()

  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [currentMonth, _setCurrentMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const setCurrentMonth = useCallback((month) => {
    _setCurrentMonth(month === 'all' ? null : month)
  }, [])

  // ✅ دالة مساعدة: تحويل transaction → response مع category data
  const enrichTxn = useCallback(
    (txn, cats = categories) => {
      const cat = cats.find((c) => c.id === txn.category_id)
      return {
        ...txn,
        category_name: cat?.name ?? txn.category_name ?? null,
        category_icon: cat?.icon ?? txn.category_icon ?? null,
        category_color: cat?.color ?? txn.category_color ?? null,
      }
    },
    [categories]
  )

  // ✅ تحديث summary محليًا (بدون reload)
  const adjustSummary = useCallback((delta) => {
    setSummary((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        total_income: Math.max(0, prev.total_income + (delta.income || 0)),
        total_expense: Math.max(0, prev.total_expense + (delta.expense || 0)),
        net: prev.net + (delta.income || 0) - (delta.expense || 0),
        transaction_count: Math.max(0, prev.transaction_count + (delta.count || 0)),
      }
    })
  }, [])

  // ===========================
  // تحميل البيانات
  // ===========================
  const loadCategories = useCallback(async () => {
    const data = await getCategories()
    setCategories(data)
    return data
  }, [])

  const loadMonthData = useCallback(async (month, cats = null) => {
    const filters = { limit: 2000 }
    if (month) filters.month = month

    const [txns, summ] = await Promise.all([
      getTransactions(filters),
      getSummary(month),
    ])

    const catList = cats || categories
    setTransactions(txns.map((t) => enrichTxn(t, catList)))
    setSummary(summ)
  }, [categories, enrichTxn])

  // تحميل أولي (categories + بيانات الشهر)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

      ; (async () => {
        try {
          const cats = await loadCategories()
          if (cancelled) return

          const filters = { limit: 2000 }
          if (currentMonth) filters.month = currentMonth

          const [txns, summ] = await Promise.all([
            getTransactions(filters),
            getSummary(currentMonth),
          ])
          if (cancelled) return

          setTransactions(txns.map((t) => enrichTxn(t, cats)))
          setSummary(summ)
          setLoading(false)
        } catch (err) {
          if (cancelled) return
          console.error('فشل تحميل البيانات:', err)
          setError(err.message || 'فشل تحميل البيانات')
          setLoading(false)
        }
      })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // مرة واحدة فقط

  // لما الشهر يتغير (بعد التحميل الأولي)
  const isFirstMonthRef = useRef(true)
  useEffect(() => {
    if (isFirstMonthRef.current) {
      isFirstMonthRef.current = false
      return
    }
    // فقط transactions + summary، مفيش categories
    setLoading(true)
    loadMonthData(currentMonth)
      .catch((err) => {
        console.error(err)
        showToast('فشل تحميل بيانات الشهر')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cats = await loadCategories()
      await loadMonthData(currentMonth, cats)
    } catch (err) {
      setError(err.message || 'فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, loadCategories, loadMonthData])

  // ===========================
  // CRUD — Optimistic
  // ===========================
  const createTransaction = useCallback(
    async (data) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const optimistic = enrichTxn({
        ...data,
        id: tempId,
        created_at: Date.now(),
      })

      // ✅ 1. Optimistic add
      setTransactions((prev) => sortTxns([optimistic, ...prev]))
      adjustSummary({
        income: data.type === 'income' ? data.amount : 0,
        expense: data.type === 'expense' ? data.amount : 0,
        count: 1,
      })

      try {
        const saved = await apiCreateTxn(data)
        const enriched = enrichTxn(saved)
        // ✅ نستبدل الـ temp بالـ real
        setTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? enriched : t))
        )
        showToast('تمت إضافة المعاملة')
        return enriched
      } catch (err) {
        // ❌ rollback
        setTransactions((prev) => prev.filter((t) => t.id !== tempId))
        adjustSummary({
          income: data.type === 'income' ? -data.amount : 0,
          expense: data.type === 'expense' ? -data.amount : 0,
          count: -1,
        })
        showToast(err.message || 'فشل إضافة المعاملة')
        throw err
      }
    },
    [enrichTxn, adjustSummary, showToast]
  )

  const updateTransaction = useCallback(
    async (id, data) => {
      const old = transactions.find((t) => t.id === id)
      if (!old) throw new Error('المعاملة غير موجودة')

      const optimistic = enrichTxn({ ...old, ...data })

      // ✅ 1. Optimistic update
      setTransactions((prev) =>
        sortTxns(prev.map((t) => (t.id === id ? optimistic : t)))
      )
      // حساب الفرق في الملخص
      adjustSummary({
        income:
          (data.type === 'income' ? data.amount : 0) -
          (old.type === 'income' ? old.amount : 0),
        expense:
          (data.type === 'expense' ? data.amount : 0) -
          (old.type === 'expense' ? old.amount : 0),
        count: 0,
      })

      try {
        const saved = await apiUpdateTxn(id, data)
        const enriched = enrichTxn(saved)
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? enriched : t))
        )
        showToast('تم تحديث المعاملة')
        return enriched
      } catch (err) {
        // ❌ rollback
        setTransactions((prev) =>
          sortTxns(prev.map((t) => (t.id === id ? old : t)))
        )
        adjustSummary({
          income:
            (old.type === 'income' ? old.amount : 0) -
            (data.type === 'income' ? data.amount : 0),
          expense:
            (old.type === 'expense' ? old.amount : 0) -
            (data.type === 'expense' ? data.amount : 0),
          count: 0,
        })
        showToast(err.message || 'فشل تحديث المعاملة')
        throw err
      }
    },
    [transactions, enrichTxn, adjustSummary, showToast]
  )

  const deleteTransaction = useCallback(
    async (id) => {
      const old = transactions.find((t) => t.id === id)
      if (!old) return

      // ✅ 1. Optimistic delete
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      adjustSummary({
        income: old.type === 'income' ? -old.amount : 0,
        expense: old.type === 'expense' ? -old.amount : 0,
        count: -1,
      })

      try {
        await apiDeleteTxn(id)
        showToast('تم حذف المعاملة')
      } catch (err) {
        // ❌ rollback
        setTransactions((prev) => sortTxns([...prev, old]))
        adjustSummary({
          income: old.type === 'income' ? old.amount : 0,
          expense: old.type === 'expense' ? old.amount : 0,
          count: 1,
        })
        showToast(err.message || 'فشل حذف المعاملة')
        throw err
      }
    },
    [transactions, adjustSummary, showToast]
  )

  // ===========================
  // CRUD — Categories
  // ===========================
  const createCategory = useCallback(
    async (data) => {
      const newCat = await apiCreateCat(data)
      setCategories((prev) => [...prev, newCat])
      showToast('تمت إضافة التصنيف')
      return newCat
    },
    [showToast]
  )

  const updateCategory = useCallback(
    async (id, data) => {
      const updated = await apiUpdateCat(id, data)
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
      // نحدّث الـ transactions المحلية كمان
      setTransactions((prev) =>
        prev.map((t) =>
          t.category_id === id
            ? {
              ...t,
              category_name: updated.name,
              category_icon: updated.icon,
              category_color: updated.color,
            }
            : t
        )
      )
      showToast('تم تحديث التصنيف')
      return updated
    },
    [showToast]
  )

  const deleteCategory = useCallback(
    async (id) => {
      await apiDeleteCat(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      showToast('تم حذف التصنيف')
    },
    [showToast]
  )

  // ===========================
  // Value
  // ===========================
  const value = useMemo(
    () => ({
      categories,
      transactions,
      summary,
      currentMonth,
      loading,
      error,
      setCurrentMonth,
      reload,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      createCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      categories,
      transactions,
      summary,
      currentMonth,
      loading,
      error,
      setCurrentMonth,
      reload,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      createCategory,
      updateCategory,
      deleteCategory,
    ]
  )

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be inside BudgetProvider')
  return ctx
}
