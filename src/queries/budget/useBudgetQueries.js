// ═══════════════════════════════════════════════════════════════
// src/queries/budget/useBudgetQueries.js — استعلامات الميزانية (Queries)
// ═══════════════════════════════════════════════════════════════
import { useCallback } from 'react'
import {
  queryOptions,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query'
import {
  getCategories,
  getTransactions,
  getSummary,
  getLimits,
  getInsights,
  getMonthlyTrend,
  getWalletsWithBalances,
  getWalletTransfers,
  getRecurringTransactions,
} from '@/services/budgetService.js'
import { budgetKeys } from '../queryKeys.js'

// ═══════════════════════════════════════
// Query Options Factories
// ═══════════════════════════════════════
export const categoriesQueryOptions = (type = null) =>
  queryOptions({
    queryKey: budgetKeys.categories(type),
    queryFn: () => getCategories(type),
  })

export const transactionsQueryOptions = (month = null) =>
  queryOptions({
    queryKey: budgetKeys.transactions(month),
    queryFn: () =>
      getTransactions(month ? { limit: 2000, month } : { limit: 2000 }),
    placeholderData: keepPreviousData,
  })

export const summaryQueryOptions = (month = null) =>
  queryOptions({
    queryKey: budgetKeys.summary(month),
    queryFn: () => getSummary(month),
    placeholderData: keepPreviousData,
  })

export const limitsQueryOptions = (month) =>
  queryOptions({
    queryKey: budgetKeys.limits(month),
    queryFn: () => getLimits(month),
    enabled: Boolean(month),
    placeholderData: (previousData) => (month ? previousData : undefined),
  })

export const insightsQueryOptions = (month, compareMonth = null) =>
  queryOptions({
    queryKey: budgetKeys.insights(month, compareMonth),
    queryFn: () => getInsights(month, compareMonth),
    enabled: Boolean(month),
    // تعتمد على اليوم الحالي (days_elapsed / آخر 7 أيام) فنسمح بتجديدها كل دقيقة
    staleTime: 1000 * 60,
    placeholderData: (previousData) => (month ? previousData : undefined),
  })

export const monthlyTrendQueryOptions = (months = 6, endMonth = null) =>
  queryOptions({
    queryKey: budgetKeys.trend(months, endMonth),
    queryFn: () => getMonthlyTrend(months, endMonth),
    placeholderData: keepPreviousData,
  })

// ═══════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════
export function useCategoriesQuery(type = null) {
  return useQuery(categoriesQueryOptions(type))
}

export function useTransactionsQuery(month = null) {
  return useQuery(transactionsQueryOptions(month))
}

export function useSummaryQuery(month = null) {
  return useQuery(summaryQueryOptions(month))
}

export function useLimitsQuery(month) {
  return useQuery(limitsQueryOptions(month))
}

export function useInsightsQuery(month, compareMonth = null) {
  return useQuery(insightsQueryOptions(month, compareMonth))
}

export function useMonthlyTrendQuery(months = 6, endMonth = null) {
  return useQuery(monthlyTrendQueryOptions(months, endMonth))
}

export function useWalletsQuery() {
  return useQuery({
    queryKey: budgetKeys.wallets(),
    queryFn: () => getWalletsWithBalances(),
  })
}

export function useWalletTransfersQuery() {
  return useQuery({
    queryKey: budgetKeys.walletTransfers(),
    queryFn: () => getWalletTransfers(),
  })
}

export function useRecurringTransactionsQuery() {
  return useQuery({
    queryKey: budgetKeys.recurring(),
    queryFn: () => getRecurringTransactions(),
  })
}

// ═══════════════════════════════════════
// Bootstrap Hook (لشاشة التحميل والخطأ في BudgetLayout)
// ═══════════════════════════════════════
export function useBudgetBootstrap(currentMonth) {
  const categoriesQuery = useCategoriesQuery()
  const transactionsQuery = useTransactionsQuery(currentMonth)
  const summaryQuery = useSummaryQuery(currentMonth)

  const isPending =
    categoriesQuery.isPending ||
    transactionsQuery.isPending ||
    summaryQuery.isPending

  const rawError =
    categoriesQuery.error || transactionsQuery.error || summaryQuery.error

  const error = rawError
    ? rawError.message || 'فشل تحميل بيانات الميزانية'
    : null

  const { refetch: refetchCategories } = categoriesQuery
  const { refetch: refetchTransactions } = transactionsQuery
  const { refetch: refetchSummary } = summaryQuery

  const refetchAll = useCallback(() => {
    return Promise.all([
      refetchCategories(),
      refetchTransactions(),
      refetchSummary(),
    ])
  }, [refetchCategories, refetchTransactions, refetchSummary])

  return { isPending, error, refetchAll }
}
