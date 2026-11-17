// ═══════════════════════════════════════════════════════════════
// src/queries/budget/useBudgetMutations.js — عمليات الميزانية (Mutations)
// ═══════════════════════════════════════════════════════════════
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createCategory,
  updateCategory,
  deleteCategory,
  createOrUpdateLimit,
  updateLimit,
  deleteLimit,
  getLimits,
  getBudgetBackup,
  restoreBudgetBackup,
  deleteAllBudgetData,
  exportBudgetCsv,
  importBudgetCsv,
  importLegacyBudget,
} from '@/services/budgetService.js'
import { useToast } from '@/hooks/useToast.js'
import { budgetKeys } from '../queryKeys.js'

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
function sortTxns(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (b.created_at || 0) - (a.created_at || 0)
  })
}

function matchesMonth(date, month) {
  if (!month) return true
  return typeof date === 'string' && date.startsWith(`${month}-`)
}

export function adjustSummaryData(prev, delta) {
  if (!prev) return prev
  const incomeDelta = delta.income || 0
  const expenseDelta = delta.expense || 0
  const countDelta = delta.count || 0
  const nextIncome =
    Math.round(Math.max(0, prev.total_income + incomeDelta) * 100) / 100
  const nextExpense =
    Math.round(Math.max(0, prev.total_expense + expenseDelta) * 100) / 100

  return {
    ...prev,
    total_income: nextIncome,
    total_expense: nextExpense,
    net: Math.round((nextIncome - nextExpense) * 100) / 100,
    transaction_count: Math.max(0, prev.transaction_count + countDelta),
  }
}

export function recomputeLimitTotals(prev) {
  if (!prev) return prev
  const totalLimit = prev.limits.reduce((s, l) => s + l.amount, 0)
  const totalSpent = prev.limits.reduce((s, l) => s + l.spent, 0)
  const totalRemaining = totalLimit - totalSpent
  const totalPercent =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 1000) / 10 : 0

  return {
    ...prev,
    total_limit: Math.round(totalLimit * 100) / 100,
    total_spent: Math.round(totalSpent * 100) / 100,
    total_remaining: Math.round(totalRemaining * 100) / 100,
    total_percent: totalPercent,
  }
}

export function notifyLimitTransition(
  prevLimits,
  nextLimits,
  categoryId,
  txnType,
  showToast
) {
  if (txnType !== 'expense' || !prevLimits || !nextLimits) return

  const prev = prevLimits.limits?.find((l) => l.category_id === categoryId)
  const curr = nextLimits.limits?.find((l) => l.category_id === categoryId)
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
}

function invalidateTransactionDependents(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: budgetKeys.transactionsAll() }),
    queryClient.invalidateQueries({ queryKey: budgetKeys.summariesAll() }),
    queryClient.invalidateQueries({ queryKey: budgetKeys.limitsAll() }),
    queryClient.invalidateQueries({ queryKey: budgetKeys.insightsAll() }),
    queryClient.invalidateQueries({ queryKey: budgetKeys.trendsAll() }),
  ])
}

// ═══════════════════════════════════════
// Transactions Mutations (Optimistic)
// ═══════════════════════════════════════
export function useCreateTransactionMutation(currentMonth = null) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (data) => createTransaction(data),

    onMutate: async (data) => {
      const txnKey = budgetKeys.transactions(currentMonth)
      const summaryKey = budgetKeys.summary(currentMonth)
      const txnMonth =
        typeof data.date === 'string' ? data.date.slice(0, 7) : null

      await Promise.all([
        queryClient.cancelQueries({ queryKey: budgetKeys.transactionsAll() }),
        queryClient.cancelQueries({ queryKey: budgetKeys.summariesAll() }),
        queryClient.cancelQueries({ queryKey: budgetKeys.limitsAll() }),
      ])

      const prevTxns = queryClient.getQueryData(txnKey)
      const prevSummary = queryClient.getQueryData(summaryKey)
      const prevLimits = txnMonth
        ? queryClient.getQueryData(budgetKeys.limits(txnMonth))
        : null

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      if (matchesMonth(data.date, currentMonth)) {
        const optimistic = {
          ...data,
          id: tempId,
          created_at: Date.now(),
        }

        queryClient.setQueryData(txnKey, (old = []) =>
          sortTxns([optimistic, ...old])
        )
        queryClient.setQueryData(summaryKey, (old) =>
          adjustSummaryData(old, {
            income: data.type === 'income' ? data.amount : 0,
            expense: data.type === 'expense' ? data.amount : 0,
            count: 1,
          })
        )
      }

      return { tempId, txnKey, summaryKey, prevTxns, prevSummary, prevLimits, txnMonth }
    },

    onError: (err, _data, context) => {
      if (context?.prevTxns !== undefined) {
        queryClient.setQueryData(context.txnKey, context.prevTxns)
      }
      if (context?.prevSummary !== undefined) {
        queryClient.setQueryData(context.summaryKey, context.prevSummary)
      }
      showToast(err?.message || 'فشل إضافة المعاملة')
    },

    onSuccess: async (saved, data, context) => {
      if (context?.tempId && matchesMonth(saved.date, currentMonth)) {
        queryClient.setQueryData(context.txnKey, (old = []) =>
          old.map((t) => (t.id === context.tempId ? saved : t))
        )
      }

      showToast('تمت إضافة المعاملة')

      if (data.type === 'expense' && context?.txnMonth && context?.prevLimits) {
        try {
          const freshLimits = await queryClient.fetchQuery({
            queryKey: budgetKeys.limits(context.txnMonth),
            queryFn: () => getLimits(context.txnMonth),
            staleTime: 0,
          })
          notifyLimitTransition(
            context.prevLimits,
            freshLimits,
            data.category_id,
            data.type,
            showToast
          )
        } catch (err) {
          console.error('فشل تحديث الميزانيات:', err)
        }
      }
    },

    onSettled: () => {
      invalidateTransactionDependents(queryClient)
    },
  })
}

export function useUpdateTransactionMutation(currentMonth = null) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => updateTransaction(id, data),

    onMutate: async ({ id, data }) => {
      const txnKey = budgetKeys.transactions(currentMonth)
      const summaryKey = budgetKeys.summary(currentMonth)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: budgetKeys.transactionsAll() }),
        queryClient.cancelQueries({ queryKey: budgetKeys.summariesAll() }),
        queryClient.cancelQueries({ queryKey: budgetKeys.limitsAll() }),
      ])

      const prevTxns = queryClient.getQueryData(txnKey)
      const prevSummary = queryClient.getQueryData(summaryKey)
      const existing = prevTxns?.find((t) => t.id === id)

      const targetDate = data.date ?? existing?.date
      const txnMonth =
        typeof targetDate === 'string' ? targetDate.slice(0, 7) : null
      const prevLimits = txnMonth
        ? queryClient.getQueryData(budgetKeys.limits(txnMonth))
        : null

      if (existing) {
        const merged = { ...existing, ...data }
        const staysInView = matchesMonth(merged.date, currentMonth)

        queryClient.setQueryData(txnKey, (old = []) =>
          staysInView
            ? sortTxns(old.map((t) => (t.id === id ? merged : t)))
            : old.filter((t) => t.id !== id)
        )

        const oldIncome = existing.type === 'income' ? existing.amount : 0
        const oldExpense = existing.type === 'expense' ? existing.amount : 0
        const newIncome =
          staysInView && merged.type === 'income' ? merged.amount : 0
        const newExpense =
          staysInView && merged.type === 'expense' ? merged.amount : 0

        queryClient.setQueryData(summaryKey, (old) =>
          adjustSummaryData(old, {
            income: newIncome - oldIncome,
            expense: newExpense - oldExpense,
            count: staysInView ? 0 : -1,
          })
        )
      }

      return { txnKey, summaryKey, prevTxns, prevSummary, prevLimits, txnMonth }
    },

    onError: (err, _vars, context) => {
      if (context?.prevTxns !== undefined) {
        queryClient.setQueryData(context.txnKey, context.prevTxns)
      }
      if (context?.prevSummary !== undefined) {
        queryClient.setQueryData(context.summaryKey, context.prevSummary)
      }
      showToast(err?.message || 'فشل تحديث المعاملة')
    },

    onSuccess: async (saved, { id }, context) => {
      if (context?.txnKey && matchesMonth(saved.date, currentMonth)) {
        queryClient.setQueryData(context.txnKey, (old = []) =>
          sortTxns(old.map((t) => (t.id === id ? saved : t)))
        )
      }

      showToast('تم تحديث المعاملة')

      if (saved.type === 'expense' && context?.txnMonth && context?.prevLimits) {
        try {
          const freshLimits = await queryClient.fetchQuery({
            queryKey: budgetKeys.limits(context.txnMonth),
            queryFn: () => getLimits(context.txnMonth),
            staleTime: 0,
          })
          notifyLimitTransition(
            context.prevLimits,
            freshLimits,
            saved.category_id,
            saved.type,
            showToast
          )
        } catch (err) {
          console.error('فشل تحديث الميزانيات:', err)
        }
      }
    },

    onSettled: () => {
      invalidateTransactionDependents(queryClient)
    },
  })
}

export function useDeleteTransactionMutation(currentMonth = null) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id) => deleteTransaction(id),

    onMutate: async (id) => {
      const txnKey = budgetKeys.transactions(currentMonth)
      const summaryKey = budgetKeys.summary(currentMonth)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: budgetKeys.transactionsAll() }),
        queryClient.cancelQueries({ queryKey: budgetKeys.summariesAll() }),
      ])

      const prevTxns = queryClient.getQueryData(txnKey)
      const prevSummary = queryClient.getQueryData(summaryKey)
      const existing = prevTxns?.find((t) => t.id === id)

      if (existing) {
        queryClient.setQueryData(txnKey, (old = []) =>
          old.filter((t) => t.id !== id)
        )
        queryClient.setQueryData(summaryKey, (old) =>
          adjustSummaryData(old, {
            income: existing.type === 'income' ? -existing.amount : 0,
            expense: existing.type === 'expense' ? -existing.amount : 0,
            count: -1,
          })
        )
      }

      return { txnKey, summaryKey, prevTxns, prevSummary }
    },

    onError: (err, _id, context) => {
      if (context?.prevTxns !== undefined) {
        queryClient.setQueryData(context.txnKey, context.prevTxns)
      }
      if (context?.prevSummary !== undefined) {
        queryClient.setQueryData(context.summaryKey, context.prevSummary)
      }
      showToast(err?.message || 'فشل حذف المعاملة')
    },

    onSuccess: () => {
      showToast('تم حذف المعاملة')
    },

    onSettled: () => {
      invalidateTransactionDependents(queryClient)
    },
  })
}

// ═══════════════════════════════════════
// Categories Mutations
// ═══════════════════════════════════════
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (data) => createCategory(data),

    onSuccess: (newCat) => {
      queryClient.setQueryData(budgetKeys.categories(null), (old) =>
        old ? [...old, newCat] : [newCat]
      )
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoriesAll() })
      showToast('تمت إضافة التصنيف')
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),

    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(budgetKeys.categories(null), (old) =>
        old ? old.map((c) => (c.id === id ? updated : c)) : old
      )
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoriesAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.summariesAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.limitsAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.insightsAll() })
      showToast('تم تحديث التصنيف')
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id) => deleteCategory(id),

    onSuccess: (_res, id) => {
      queryClient.setQueryData(budgetKeys.categories(null), (old) =>
        old ? old.filter((c) => c.id !== id) : old
      )
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoriesAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.limitsAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.summariesAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.insightsAll() })
      showToast('تم حذف التصنيف')
    },

    onError: (err) => {
      showToast(err?.message || 'فشل حذف التصنيف')
    },
  })
}

// ═══════════════════════════════════════
// Monthly Limits Mutations
// ═══════════════════════════════════════
export function useCreateOrUpdateLimitMutation() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (data) => createOrUpdateLimit(data),

    onMutate: (data) => {
      const current = queryClient.getQueryData(budgetKeys.limits(data.month))
      const existed = Boolean(
        current?.limits?.some((l) => l.category_id === data.category_id)
      )
      return { existed }
    },

    onSuccess: (savedItem, data, context) => {
      if (savedItem && data.month) {
        queryClient.setQueryData(budgetKeys.limits(data.month), (prev) => {
          if (!prev) return prev
          const hasItem = prev.limits.some((l) => l.id === savedItem.id)
          const nextLimits = hasItem
            ? prev.limits.map((l) => (l.id === savedItem.id ? savedItem : l))
            : [...prev.limits, savedItem]
          return recomputeLimitTotals({ ...prev, limits: nextLimits })
        })
      }

      showToast(context?.existed ? 'تم تحديث الميزانية' : 'تمت إضافة الميزانية')
      queryClient.invalidateQueries({ queryKey: budgetKeys.limitsAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.insightsAll() })
    },
  })
}

export function useUpdateLimitMutation(currentMonth = null) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, amount }) => updateLimit(id, amount),

    onSuccess: (updated, { id }) => {
      if (currentMonth && updated) {
        queryClient.setQueryData(budgetKeys.limits(currentMonth), (prev) => {
          if (!prev) return prev
          return recomputeLimitTotals({
            ...prev,
            limits: prev.limits.map((l) => (l.id === id ? updated : l)),
          })
        })
      }

      showToast('تم تحديث الميزانية')
      queryClient.invalidateQueries({ queryKey: budgetKeys.limitsAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.insightsAll() })
    },
  })
}

export function useDeleteLimitMutation(currentMonth = null) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id) => deleteLimit(id),

    onMutate: async (id) => {
      if (!currentMonth) return { prevLimits: undefined, limitsKey: null }

      const limitsKey = budgetKeys.limits(currentMonth)
      await queryClient.cancelQueries({ queryKey: limitsKey })
      const prevLimits = queryClient.getQueryData(limitsKey)

      if (prevLimits) {
        queryClient.setQueryData(limitsKey, (prev) =>
          recomputeLimitTotals({
            ...prev,
            limits: prev.limits.filter((l) => l.id !== id),
          })
        )
      }

      return { prevLimits, limitsKey }
    },

    onError: (err, _id, context) => {
      if (context?.limitsKey && context?.prevLimits !== undefined) {
        queryClient.setQueryData(context.limitsKey, context.prevLimits)
      }
      showToast(err?.message || 'فشل حذف الميزانية')
    },

    onSuccess: () => {
      showToast('تم حذف الميزانية')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.limitsAll() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.insightsAll() })
    },
  })
}

// ═══════════════════════════════════════
// Backup / Import / Export / Reset Mutations
// ═══════════════════════════════════════
export function useExportBudgetJsonMutation() {
  return useMutation({
    mutationFn: () => getBudgetBackup(),
  })
}

export function useExportBudgetCsvMutation() {
  return useMutation({
    mutationFn: () => exportBudgetCsv(),
  })
}

export function useRestoreBudgetBackupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => restoreBudgetBackup(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}

export function useImportBudgetCsvMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, clearExisting = false }) =>
      importBudgetCsv(file, clearExisting),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}

export function useImportLegacyBudgetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (legacy) => importLegacyBudget(legacy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}

export function useDeleteAllBudgetDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keepCategories = false) => deleteAllBudgetData(keepCategories),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}
