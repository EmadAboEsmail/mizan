// ═══════════════════════════════════════════════════════════════
// src/queries/zekr/useZekrMutations.js — عمليات ذِكر (Mutations)
// ═══════════════════════════════════════════════════════════════
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addClick,
  resetClick,
  setTarget,
  deleteAllCounts,
  deleteAllTargets,
  deleteAllClicks,
  deleteAllData,
  createAdhkar,
  updateAdhkar,
  deleteAdhkar,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupItem,
  updateGroupItem,
  deleteGroupItem,
  getBackup,
  restoreBackup,
  importLegacy,
} from '@/services/zekrService.js'
import { zekrKeys } from '../queryKeys.js'
import { dedupeById } from './useZekrQueries.js'

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
// تتبع الضغطات الجارية لكل ذكر لمنع قفز العداد للخلف أثناء التسبيح السريع
const inFlightClicks = new Map()

function isNotFoundError(err) {
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('غير موجود') || msg.includes('not found')
}

function selfHealIfMissing(queryClient, err) {
  if (isNotFoundError(err)) {
    queryClient.invalidateQueries({ queryKey: zekrKeys.all })
  }
}

// ═══════════════════════════════════════
// Clicks & Targets Mutations (Optimistic)
// ═══════════════════════════════════════
export function useAddClickMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (zekrId) => {
      if (!zekrId) return Promise.resolve(null)
      return addClick(zekrId)
    },

    onMutate: (zekrId) => {
      if (!zekrId) return
      const key = String(zekrId)
      inFlightClicks.set(key, (inFlightClicks.get(key) || 0) + 1)

      // إلغاء أي قراءة جارية + تحديث فوري بدون انتظار لسرعة استجابة السبحة
      queryClient.cancelQueries({ queryKey: zekrKeys.counts() })
      queryClient.setQueryData(zekrKeys.counts(), (prev = {}) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }))
    },

    onSuccess: (result, zekrId) => {
      if (!zekrId) return
      const key = String(zekrId)
      const remaining = Math.max(0, (inFlightClicks.get(key) || 1) - 1)
      if (remaining === 0) {
        inFlightClicks.delete(key)
      } else {
        inFlightClicks.set(key, remaining)
      }

      if (remaining === 0 && typeof result?.count === 'number') {
        queryClient.setQueryData(zekrKeys.counts(), (prev = {}) => ({
          ...prev,
          [key]: result.count,
        }))
      }

      // تعليم الإحصائيات والسلسلة كـ stale لتتحدث تلقائياً عند فتح تبويب الإحصائيات
      queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.streak() })
    },

    onError: (err, zekrId) => {
      console.error('فشل تسجيل التسبيحة:', err)
      if (!zekrId) return
      const key = String(zekrId)
      const remaining = Math.max(0, (inFlightClicks.get(key) || 1) - 1)
      if (remaining === 0) {
        inFlightClicks.delete(key)
      } else {
        inFlightClicks.set(key, remaining)
      }

      queryClient.setQueryData(zekrKeys.counts(), (prev = {}) => ({
        ...prev,
        [key]: Math.max(0, (prev[key] || 1) - 1),
      }))

      selfHealIfMissing(queryClient, err)
    },
  })
}

export function useResetClickMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (zekrId) => resetClick(zekrId),

    onMutate: async (zekrId) => {
      const key = String(zekrId)
      inFlightClicks.delete(key)
      await queryClient.cancelQueries({ queryKey: zekrKeys.counts() })
      const prevCounts = queryClient.getQueryData(zekrKeys.counts())

      queryClient.setQueryData(zekrKeys.counts(), (prev = {}) => ({
        ...prev,
        [key]: 0,
      }))

      return { prevCounts }
    },

    onError: (err, _zekrId, context) => {
      if (context?.prevCounts !== undefined) {
        queryClient.setQueryData(zekrKeys.counts(), context.prevCounts)
      }
      selfHealIfMissing(queryClient, err)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: zekrKeys.counts() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.streak() })
    },
  })
}

export function useSetTargetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ zekrId, target }) => setTarget(zekrId, target),

    onMutate: async ({ zekrId, target }) => {
      const key = String(zekrId)
      await queryClient.cancelQueries({ queryKey: zekrKeys.targets() })
      const prevTargets = queryClient.getQueryData(zekrKeys.targets())

      queryClient.setQueryData(zekrKeys.targets(), (prev = {}) => {
        const next = { ...prev }
        if (target == null) {
          delete next[key]
        } else {
          next[key] = target
        }
        return next
      })

      return { prevTargets }
    },

    onError: (err, _vars, context) => {
      if (context?.prevTargets !== undefined) {
        queryClient.setQueryData(zekrKeys.targets(), context.prevTargets)
      }
      selfHealIfMissing(queryClient, err)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: zekrKeys.targets() })
    },
  })
}

// ═══════════════════════════════════════
// Adhkar CRUD Mutations
// ═══════════════════════════════════════
export function useCreateAdhkarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ text, defaultTarget = null }) =>
      createAdhkar(text, defaultTarget),

    onSuccess: (newZekr) => {
      queryClient.setQueryData(zekrKeys.adhkar(), (prev = []) =>
        dedupeById([...prev, newZekr])
      )
      queryClient.setQueryData(zekrKeys.counts(), (prev = {}) => ({
        ...prev,
        [newZekr.id]: prev[newZekr.id] ?? 0,
      }))
      queryClient.invalidateQueries({ queryKey: zekrKeys.adhkar() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.counts() })
    },
  })
}

export function useUpdateAdhkarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, text, defaultTarget = null }) =>
      updateAdhkar(id, text, defaultTarget),

    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(zekrKeys.adhkar(), (prev = []) =>
        prev.map((z) => (z.id === id ? updated : z))
      )
      // تحديث المجموعات والإحصائيات لأنها تعرض نص الذكر وهدفه الافتراضي
      queryClient.invalidateQueries({ queryKey: zekrKeys.adhkar() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

export function useDeleteAdhkarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteAdhkar(id),

    onSuccess: (_res, id) => {
      inFlightClicks.delete(String(id))
      queryClient.setQueryData(zekrKeys.adhkar(), (prev = []) =>
        prev.filter((z) => z.id !== id)
      )
      // مزامنة كل الجداول المتأثرة بـ ON DELETE CASCADE
      queryClient.invalidateQueries({ queryKey: zekrKeys.adhkar() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.counts() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.targets() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.streak() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

// ═══════════════════════════════════════
// Groups & Group Items Mutations
// ═══════════════════════════════════════
export function useCreateGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, description = null }) =>
      createGroup(name, description),

    onSuccess: (newGroup) => {
      queryClient.setQueryData(zekrKeys.groups(), (prev = []) =>
        dedupeById([newGroup, ...prev])
      )
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
    },
  })
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name, description = null }) =>
      updateGroup(id, name, description),

    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(zekrKeys.groups(), (prev = []) =>
        prev.map((g) => (g.id === id ? updated : g))
      )
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteGroup(id),

    onSuccess: (_res, id) => {
      queryClient.setQueryData(zekrKeys.groups(), (prev = []) =>
        prev.filter((g) => g.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

export function useAddGroupItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, zekrId, target = null }) =>
      addGroupItem(groupId, zekrId, target),

    onSuccess: (updatedGroup, { groupId }) => {
      queryClient.setQueryData(zekrKeys.groups(), (prev = []) =>
        prev.map((g) => (g.id === groupId ? updatedGroup : g))
      )
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

export function useUpdateGroupItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, itemId, updates }) =>
      updateGroupItem(groupId, itemId, updates),

    onSuccess: (updatedGroup, { groupId }) => {
      queryClient.setQueryData(zekrKeys.groups(), (prev = []) =>
        prev.map((g) => (g.id === groupId ? updatedGroup : g))
      )
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

export function useDeleteGroupItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, itemId }) => deleteGroupItem(groupId, itemId),

    onSuccess: (updatedGroup, { groupId }) => {
      queryClient.setQueryData(zekrKeys.groups(), (prev = []) =>
        prev.map((g) => (g.id === groupId ? updatedGroup : g))
      )
      queryClient.invalidateQueries({ queryKey: zekrKeys.groups() })
    },

    onError: (err) => selfHealIfMissing(queryClient, err),
  })
}

// ═══════════════════════════════════════
// Bulk Reset / Clear Mutations
// ═══════════════════════════════════════
export function useDeleteAllCountsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteAllCounts(),
    onSuccess: () => {
      inFlightClicks.clear()
      queryClient.setQueryData(zekrKeys.counts(), {})
      queryClient.invalidateQueries({ queryKey: zekrKeys.counts() })
    },
  })
}

export function useDeleteAllTargetsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteAllTargets(),
    onSuccess: () => {
      queryClient.setQueryData(zekrKeys.targets(), {})
      queryClient.invalidateQueries({ queryKey: zekrKeys.targets() })
    },
  })
}

export function useDeleteAllClicksMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteAllClicks(),
    onSuccess: () => {
      inFlightClicks.clear()
      queryClient.setQueryData(zekrKeys.counts(), {})
      queryClient.invalidateQueries({ queryKey: zekrKeys.counts() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.streak() })
    },
  })
}

export function useDeleteAllZekrDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteAllData(),
    onSuccess: () => {
      inFlightClicks.clear()
      queryClient.setQueryData(zekrKeys.counts(), {})
      queryClient.setQueryData(zekrKeys.targets(), {})
      queryClient.invalidateQueries({ queryKey: zekrKeys.counts() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.targets() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: zekrKeys.streak() })
    },
  })
}

// ═══════════════════════════════════════
// Backup / Restore / Legacy Mutations
// ═══════════════════════════════════════
export function useExportZekrBackupMutation() {
  return useMutation({
    mutationFn: () => getBackup(),
  })
}

export function useRestoreZekrBackupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rawInput) => {
      const parsed =
        typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput
      const sanitized = {
        ...parsed,
        adhkar: dedupeById(parsed?.adhkar),
        groups: dedupeById(parsed?.groups),
      }
      const res = await restoreBackup(sanitized)
      return {
        success: true,
        count: res?.count ?? sanitized.adhkar.length,
      }
    },

    onSuccess: () => {
      inFlightClicks.clear()
      return queryClient.invalidateQueries({ queryKey: zekrKeys.all })
    },
  })
}

export function useImportLegacyZekrMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (legacy) => importLegacy(legacy),

    onSuccess: () => {
      inFlightClicks.clear()
      return queryClient.invalidateQueries({ queryKey: zekrKeys.all })
    },
  })
}
