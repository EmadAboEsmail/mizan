import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import {
  getCategories,
  getTransactions,
  getSummary,
  getLimits,
  getInsights,
  createOrUpdateLimit as apiCreateOrUpdateLimit,
  updateLimit as apiUpdateLimit,
  deleteLimit as apiDeleteLimit,
  createTransaction as apiCreateTxn,
  updateTransaction as apiUpdateTxn,
  deleteTransaction as apiDeleteTxn,
  createCategory as apiCreateCat,
  updateCategory as apiUpdateCat,
  deleteCategory as apiDeleteCat,
  importLegacyBudget as apiImportLegacyBudget,  // ⬅️ تأكد إنها موجودة
} from '@/services/budgetService.js'
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

// ✅ مساعد: إعادة حساب إجماليات limits بعد تغيير محلي
function recomputeLimitTotals(prev) {
  if (!prev) return prev
  const total_limit = prev.limits.reduce((s, l) => s + l.amount, 0)
  const total_spent = prev.limits.reduce((s, l) => s + l.spent, 0)
  const total_remaining = total_limit - total_spent
  const total_percent =
    total_limit > 0 ? Math.round((total_spent / total_limit) * 1000) / 10 : 0

  return {
    ...prev,
    total_limit: Math.round(total_limit * 100) / 100,
    total_spent: Math.round(total_spent * 100) / 100,
    total_remaining: Math.round(total_remaining * 100) / 100,
    total_percent,
  }
}

export function BudgetProvider({ children }) {
  const { showToast } = useToast()

  // ===========================
  // States
  // ===========================
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [limits, setLimits] = useState(null)
  const [insights, setInsights] = useState(null)
  const [currentMonth, _setCurrentMonth] = useState(getCurrentMonth())
  const [compareMonth, setCompareMonth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const limitsRef = useRef(limits)

  useEffect(() => {
    limitsRef.current = limits
  }, [limits])

  const setCurrentMonth = useCallback((month) => {
    _setCurrentMonth(month === 'all' ? null : month)
  }, [])

  // ===========================
  // Helpers
  // ===========================
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

  const adjustSummary = useCallback((delta) => {
    setSummary((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        total_income: Math.max(0, prev.total_income + (delta.income || 0)),
        total_expense: Math.max(0, prev.total_expense + (delta.expense || 0)),
        net: prev.net + (delta.income || 0) - (delta.expense || 0),
        transaction_count: Math.max(
          0,
          prev.transaction_count + (delta.count || 0)
        ),
      }
    })
  }, [])

  const checkLimitChange = useCallback(
    (prevLimits, newLimits, categoryId, txnType) => {
      if (txnType !== 'expense') return
      if (!prevLimits || !newLimits) return

      const prev = prevLimits.limits?.find((l) => l.category_id === categoryId)
      const curr = newLimits.limits?.find((l) => l.category_id === categoryId)
      if (!prev || !curr) return

      if (prev.status !== 'over' && curr.status === 'over') {
        showToast(`🚨 تجاوزت ميزانية "${curr.category_name}"!`)
        return
      }

      if (prev.status === 'safe' && curr.status === 'warning') {
        showToast(
          `⚠️ اقتربت من ميزانية "${curr.category_name}" (${curr.percent.toFixed(0)}%)`
        )
      }
    },
    [showToast]
  )

  // ✅ helper: إعادة تحميل insights فقط (بعد كل CRUD)
  const refreshInsights = useCallback(
    async (monthOverride, compareOverride) => {
      const m = monthOverride !== undefined ? monthOverride : currentMonth
      const c = compareOverride !== undefined ? compareOverride : compareMonth
      if (!m) {
        setInsights(null)
        return
      }
      try {
        const ins = await getInsights(m, c)
        setInsights(ins)
      } catch (err) {
        console.error('فشل تحميل insights:', err)
      }
    },
    [currentMonth, compareMonth]
  )

  // ===========================
  // Data Loaders
  // ===========================
  const loadCategories = useCallback(async () => {
    const data = await getCategories()
    setCategories(data)
    return data
  }, [])

  const loadMonthData = useCallback(
    async (month, cats = null, cmpMonth = null) => {
      const filters = { limit: 2000 }
      if (month) filters.month = month

      const [txns, summ, lims, ins] = await Promise.all([
        getTransactions(filters),
        getSummary(month),
        month ? getLimits(month) : Promise.resolve(null),
        month ? getInsights(month, cmpMonth) : Promise.resolve(null),
      ])

      const catList = cats || categories
      setTransactions(txns.map((t) => enrichTxn(t, catList)))
      setSummary(summ)
      setLimits(lims)
      setInsights(ins)
    },
    [categories, enrichTxn]
  )

  // ===========================
  // Initial Load (مرة واحدة فقط)
  // ===========================
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

          const [txns, summ, lims, ins] = await Promise.all([
            getTransactions(filters),
            getSummary(currentMonth),
            currentMonth ? getLimits(currentMonth) : Promise.resolve(null),
            currentMonth ? getInsights(currentMonth) : Promise.resolve(null),
          ])
          if (cancelled) return

          setTransactions(txns.map((t) => enrichTxn(t, cats)))
          setSummary(summ)
          setLimits(lims)
          setInsights(ins)
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
  }, [])

  // ===========================
  // ✅ Effect 1: تغيير الشهر → إعادة تحميل كل البيانات
  // ===========================
  const isFirstMonthRef = useRef(true)
  useEffect(() => {
    if (isFirstMonthRef.current) {
      isFirstMonthRef.current = false
      return
    }
    setLoading(true)
    loadMonthData(currentMonth, null, compareMonth)
      .catch((err) => {
        console.error(err)
        showToast('فشل تحميل بيانات الشهر')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

  // ===========================
  // ✅ Effect 2: تغيير المقارنة → إعادة تحميل insights فقط
  // ===========================
  const isFirstCompareRef = useRef(true)
  useEffect(() => {
    if (isFirstCompareRef.current) {
      isFirstCompareRef.current = false
      return
    }
    if (!currentMonth) {
      setInsights(null)
      return
    }
    let cancelled = false
    getInsights(currentMonth, compareMonth)
      .then((ins) => {
        if (!cancelled) setInsights(ins)
      })
      .catch((err) => {
        if (!cancelled) console.error('فشل تحميل insights:', err)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMonth])

  // ===========================
  // Reload (يدوي)
  // ===========================
  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cats = await loadCategories()
      await loadMonthData(currentMonth, cats, compareMonth)
    } catch (err) {
      setError(err.message || 'فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, compareMonth, loadCategories, loadMonthData])

  // ===========================
  // CRUD — Transactions (Optimistic)
  // ===========================
  const createTransaction = useCallback(
    async (data) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const optimistic = enrichTxn({
        ...data,
        id: tempId,
        created_at: Date.now(),
      })

      // 1. Optimistic add
      setTransactions((prev) => sortTxns([optimistic, ...prev]))
      adjustSummary({
        income: data.type === 'income' ? data.amount : 0,
        expense: data.type === 'expense' ? data.amount : 0,
        count: 1,
      })

      try {
        const saved = await apiCreateTxn(data)
        const enriched = enrichTxn(saved)
        setTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? enriched : t))
        )
        showToast('تمت إضافة المعاملة')

        // ✅ تحديث limits + insights
        if (currentMonth) {
          try {
            const prevLimits = limitsRef.current
            const lims = await getLimits(currentMonth)
            setLimits(lims)
            checkLimitChange(prevLimits, lims, data.category_id, data.type)
          } catch (limitsErr) {
            console.error('فشل تحديث الميزانيات:', limitsErr)
          }
          refreshInsights()
        }

        return enriched
      } catch (err) {
        // rollback
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
    [
      enrichTxn,
      adjustSummary,
      showToast,
      currentMonth,
      checkLimitChange,
      refreshInsights,
    ]
  )

  const updateTransaction = useCallback(
    async (id, data) => {
      const old = transactions.find((t) => t.id === id)
      if (!old) throw new Error('المعاملة غير موجودة')

      const optimistic = enrichTxn({ ...old, ...data })

      setTransactions((prev) =>
        sortTxns(prev.map((t) => (t.id === id ? optimistic : t)))
      )
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

        if (currentMonth) {
          try {
            const prevLimits = limitsRef.current
            const lims = await getLimits(currentMonth)
            setLimits(lims)
            checkLimitChange(prevLimits, lims, data.category_id, data.type)
          } catch (limitsErr) {
            console.error('فشل تحديث الميزانيات:', limitsErr)
          }
          refreshInsights()
        }

        return enriched
      } catch (err) {
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
    [
      transactions,
      enrichTxn,
      adjustSummary,
      showToast,
      currentMonth,
      checkLimitChange,
      refreshInsights,
    ]
  )

  const deleteTransaction = useCallback(
    async (id) => {
      const old = transactions.find((t) => t.id === id)
      if (!old) return

      setTransactions((prev) => prev.filter((t) => t.id !== id))
      adjustSummary({
        income: old.type === 'income' ? -old.amount : 0,
        expense: old.type === 'expense' ? -old.amount : 0,
        count: -1,
      })

      try {
        await apiDeleteTxn(id)
        showToast('تم حذف المعاملة')

        if (currentMonth) {
          try {
            const lims = await getLimits(currentMonth)
            setLimits(lims)
          } catch (limitsErr) {
            console.error('فشل تحديث الميزانيات:', limitsErr)
          }
          refreshInsights()
        }
      } catch (err) {
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
    [transactions, adjustSummary, showToast, currentMonth, refreshInsights]
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
      setLimits((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          limits: prev.limits.map((l) =>
            l.category_id === id
              ? {
                ...l,
                category_name: updated.name,
                category_icon: updated.icon,
                category_color: updated.color,
              }
              : l
          ),
        }
      })
      showToast('تم تحديث التصنيف')
      return updated
    },
    [showToast]
  )

  const deleteCategory = useCallback(
    async (id) => {
      await apiDeleteCat(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setLimits((prev) => {
        if (!prev) return prev
        return recomputeLimitTotals({
          ...prev,
          limits: prev.limits.filter((l) => l.category_id !== id),
        })
      })
      showToast('تم حذف التصنيف')
    },
    [showToast]
  )

  // ===========================
  // CRUD — Monthly Limits
  // ===========================
  const createOrUpdateLimit = useCallback(
    async (data) => {
      const result = await apiCreateOrUpdateLimit(data)

      const existed = limits?.limits?.some(
        (l) => l.category_id === data.category_id
      )

      showToast(existed ? 'تم تحديث الميزانية' : 'تمت إضافة الميزانية')

      if (currentMonth) {
        try {
          const lims = await getLimits(currentMonth)
          setLimits(lims)
        } catch (err) {
          console.error('فشل تحديث الميزانيات:', err)
        }
        refreshInsights()
      }

      return result
    },
    [currentMonth, limits, showToast, refreshInsights]
  )

  const updateLimit = useCallback(
    async (id, amount) => {
      const updated = await apiUpdateLimit(id, amount)
      showToast('تم تحديث الميزانية')

      setLimits((prev) => {
        if (!prev) return prev
        const newLimits = prev.limits.map((l) =>
          l.id === id ? updated : l
        )
        return recomputeLimitTotals({ ...prev, limits: newLimits })
      })

      refreshInsights()

      return updated
    },
    [showToast, refreshInsights]
  )

  const deleteLimit = useCallback(
    async (id) => {
      await apiDeleteLimit(id)
      showToast('تم حذف الميزانية')

      setLimits((prev) => {
        if (!prev) return prev
        return recomputeLimitTotals({
          ...prev,
          limits: prev.limits.filter((l) => l.id !== id),
        })
      })

      refreshInsights()
    },
    [showToast, refreshInsights]
  )

  // ===========================
  // Value
  // ===========================
  const value = {
    // Data
    categories,
    transactions,
    summary,
    limits,
    insights,
    currentMonth,
    compareMonth,
    loading,
    error,
    // Setters
    setCurrentMonth,
    setCompareMonth,
    // Reload
    reload,
    // Transactions CRUD
    createTransaction,
    updateTransaction,
    deleteTransaction,
    // Categories CRUD
    createCategory,
    updateCategory,
    deleteCategory,
    // Limits CRUD
    createOrUpdateLimit,
    updateLimit,
    deleteLimit,
    // ... الموجود
    createOrUpdateLimit,
    updateLimit,
    deleteLimit,

    // ⬅️ ضيف ده لو مش موجود
    importLegacyBudget: async (legacy) => {
      const res = await apiImportLegacyBudget(legacy)
      await reload()
      return res
    }
  }

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  )
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be inside BudgetProvider')
  return ctx
}
