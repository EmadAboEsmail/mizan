// ═══════════════════════════════════════════════════════════════
// src/queries/zekr/useZekrQueries.js — استعلامات ذِكر (Queries)
// ═══════════════════════════════════════════════════════════════
import { useCallback } from 'react'
import {
  queryOptions,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query'
import {
  getAdhkar,
  getCounts,
  getTargets,
  getGroups,
  getStats,
  getStreak,
} from '@/services/zekrService.js'
import { zekrKeys } from '../queryKeys.js'

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
export function dedupeById(list) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  return list.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

// ═══════════════════════════════════════
// Query Options Factories
// ═══════════════════════════════════════
export const adhkarQueryOptions = () =>
  queryOptions({
    queryKey: zekrKeys.adhkar(),
    queryFn: async () => dedupeById(await getAdhkar()),
  })

export const countsQueryOptions = () =>
  queryOptions({
    queryKey: zekrKeys.counts(),
    queryFn: async () => (await getCounts()) || {},
  })

export const targetsQueryOptions = () =>
  queryOptions({
    queryKey: zekrKeys.targets(),
    queryFn: async () => (await getTargets()) || {},
  })

export const groupsQueryOptions = () =>
  queryOptions({
    queryKey: zekrKeys.groups(),
    queryFn: async () => dedupeById(await getGroups()),
  })

export const zekrStatsQueryOptions = (
  period = 'day',
  zekrId = null,
  compare = true
) =>
  queryOptions({
    queryKey: zekrKeys.stats(period, zekrId, compare),
    queryFn: () => getStats(period, zekrId, compare),
    // تعتمد على الساعة/اليوم الحالي فنسمح بتجديدها كل دقيقة
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  })

export const zekrStreakQueryOptions = () =>
  queryOptions({
    queryKey: zekrKeys.streak(),
    queryFn: () => getStreak(),
    staleTime: 1000 * 60,
  })

// ═══════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════
export function useAdhkarQuery() {
  return useQuery(adhkarQueryOptions())
}

export function useCountsQuery() {
  return useQuery(countsQueryOptions())
}

export function useTargetsQuery() {
  return useQuery(targetsQueryOptions())
}

export function useGroupsQuery() {
  return useQuery(groupsQueryOptions())
}

export function useZekrStatsQuery(
  period = 'day',
  zekrId = null,
  compare = true
) {
  return useQuery(zekrStatsQueryOptions(period, zekrId, compare))
}

export function useZekrStreakQuery() {
  return useQuery(zekrStreakQueryOptions())
}

// ═══════════════════════════════════════
// Bootstrap Hook (لشاشة التحميل والخطأ في ZekrLayout)
// ═══════════════════════════════════════
export function useZekrBootstrap() {
  const adhkarQuery = useAdhkarQuery()
  const countsQuery = useCountsQuery()
  const targetsQuery = useTargetsQuery()
  const groupsQuery = useGroupsQuery()

  const isPending =
    adhkarQuery.isPending ||
    countsQuery.isPending ||
    targetsQuery.isPending ||
    groupsQuery.isPending

  const rawError =
    adhkarQuery.error ||
    countsQuery.error ||
    targetsQuery.error ||
    groupsQuery.error

  const error = rawError
    ? rawError.message || 'فشل تحميل الأذكار والبيانات.'
    : null

  const { refetch: refetchAdhkar } = adhkarQuery
  const { refetch: refetchCounts } = countsQuery
  const { refetch: refetchTargets } = targetsQuery
  const { refetch: refetchGroups } = groupsQuery

  const refetchAll = useCallback(() => {
    return Promise.all([
      refetchAdhkar(),
      refetchCounts(),
      refetchTargets(),
      refetchGroups(),
    ])
  }, [refetchAdhkar, refetchCounts, refetchTargets, refetchGroups])

  return { isPending, error, refetchAll }
}
