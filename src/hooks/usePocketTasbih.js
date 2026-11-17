import { useState, useEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { useQueryClient } from '@tanstack/react-query'
import { applyPocketClicks } from '@/services/zekrService.js'
import { zekrKeys } from '@/queries/queryKeys.js'
import {
  startNativePocketMode,
  updateNativePocketMode,
  stopNativePocketMode,
  getNativePocketStatus,
  drainNativePocketClicks,
} from '@/utils/haptics.js'
import { useToast } from '@/hooks/useToast.js'

// تسلسل عمليات السحب لمنع أي تداخل عند عودة التطبيق من الخلفية
let syncChain = Promise.resolve(0)
let syncingCount = 0

export function syncPendingPocketClicks(queryClient) {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(0)

  syncingCount += 1
  syncChain = syncChain
    .catch(() => 0)
    .then(async () => {
      const items = await drainNativePocketClicks()
      if (!items.length) return 0

      const inserted = await applyPocketClicks(items)
      if (inserted > 0 && queryClient) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: zekrKeys.counts() }),
          queryClient.invalidateQueries({ queryKey: zekrKeys.statsAll() }),
        ])
      }
      return inserted
    })
    .catch((err) => {
      console.warn('[PocketTasbih] Sync failed:', err)
      return 0
    })
    .finally(() => {
      syncingCount = Math.max(0, syncingCount - 1)
    })

  return syncChain
}

function readEventField(event, key) {
  if (!event) return undefined
  if (event[key] !== undefined) return event[key]
  let detail = event.detail
  if (typeof detail === 'string') {
    try {
      detail = JSON.parse(detail)
    } catch {
      return undefined
    }
  }
  return detail?.[key]
}

/**
 * يسحب أي تسبيحات مسجّلة أثناء قفل الشاشة فور فتح التطبيق أو عودته للواجهة
 * (حتى لو فتح المستخدم الرئيسية أو الإحصائيات مباشرة).
 */
export function usePocketQueueSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    syncPendingPocketClicks(queryClient)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncPendingPocketClicks(queryClient)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    let subPromise = null
    try {
      subPromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          syncPendingPocketClicks(queryClient)
        }
      })
    } catch {
      // تجاهل
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      subPromise?.then((h) => h.remove()).catch(() => {})
    }
  }, [queryClient])
}

/**
 * إدارة وضع «التسبيح والشاشة مقفلة» داخل شاشة السبحة.
 */
export function usePocketTasbih({
  zekrId,
  zekrText,
  count,
  target,
  vibrate,
}) {
  const isSupported = Capacitor.isNativePlatform()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [isPocketActive, setIsPocketActive] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const statusReadyRef = useRef(false)
  const lastPushedMetaRef = useRef('')
  const lastPushedCountRef = useRef(-1)
  const nativeEchoRef = useRef({ zekrId: '', count: -1 })

  // مزامنة الحالة والضغطات عند فتح الشاشة والعودة من القفل وعند كل ضغطة حية
  useEffect(() => {
    if (!isSupported) return

    let cancelled = false

    const refresh = () => {
      statusReadyRef.current = false
      syncPendingPocketClicks(queryClient)
        .then(() => getNativePocketStatus())
        .then((status) => {
          if (cancelled) return
          const running = Boolean(status?.running)
          if (running && status?.zekrId) {
            nativeEchoRef.current = {
              zekrId: String(status.zekrId),
              count: Math.max(0, Number(status.count) || 0),
            }
          } else {
            nativeEchoRef.current = { zekrId: '', count: -1 }
            lastPushedMetaRef.current = ''
            lastPushedCountRef.current = -1
          }
          statusReadyRef.current = true
          setIsPocketActive(running)
        })
        .catch(() => {
          if (!cancelled) {
            statusReadyRef.current = true
          }
        })
    }

    refresh()

    const handleTick = (event) => {
      const tickZekrId = readEventField(event, 'zekrId')
      const tickCount = readEventField(event, 'count')
      if (tickZekrId && typeof tickCount === 'number') {
        nativeEchoRef.current = {
          zekrId: String(tickZekrId),
          count: tickCount,
        }
      }
      syncPendingPocketClicks(queryClient)
    }

    const handleState = (event) => {
      const running = readEventField(event, 'running')
      if (typeof running === 'boolean') {
        setIsPocketActive(running)
        if (!running) {
          nativeEchoRef.current = { zekrId: '', count: -1 }
          lastPushedMetaRef.current = ''
          lastPushedCountRef.current = -1
          syncPendingPocketClicks(queryClient)
        }
      }
    }

    window.addEventListener('pocketTasbihTick', handleTick)
    window.addEventListener('pocketTasbihState', handleState)

    let subPromise = null
    try {
      subPromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive && !cancelled) {
          refresh()
        }
      })
    } catch {
      // تجاهل
    }

    return () => {
      cancelled = true
      window.removeEventListener('pocketTasbihTick', handleTick)
      window.removeEventListener('pocketTasbihState', handleState)
      subPromise?.then((h) => h.remove()).catch(() => {})
    }
  }, [isSupported, queryClient])

  // تحديث إشعار القفل عند تغيير الذكر أو العدّاد أو الهدف أو إعداد الاهتزاز من داخل التطبيق
  useEffect(() => {
    if (!isSupported || !isPocketActive || !statusReadyRef.current || !zekrId) {
      return
    }
    if (syncingCount > 0) return

    const safeCount = Math.max(0, Number(count) || 0)
    const safeTarget = Math.max(0, Number(target) || 0)
    const metaKey = JSON.stringify([
      String(zekrId),
      String(zekrText || ''),
      safeTarget,
      Boolean(vibrate),
    ])
    if (
      metaKey === lastPushedMetaRef.current &&
      safeCount === lastPushedCountRef.current
    ) {
      return
    }

    // إذا كان تغيّر العدّاد ناتجاً عن سحب ضغطة قادمة من الخدمة نفسها فلا نعيد إرساله
    const echo = nativeEchoRef.current
    if (
      lastPushedMetaRef.current === metaKey &&
      echo.zekrId === String(zekrId) &&
      echo.count === safeCount
    ) {
      lastPushedCountRef.current = safeCount
      return
    }

    lastPushedMetaRef.current = metaKey
    lastPushedCountRef.current = safeCount
    nativeEchoRef.current = { zekrId: String(zekrId), count: safeCount }

    updateNativePocketMode({
      zekrId,
      zekrText,
      count: safeCount,
      target: safeTarget,
      vibrate,
    })
  }, [isSupported, isPocketActive, zekrId, zekrText, count, target, vibrate])

  const startPocket = useCallback(async () => {
    if (!isSupported || !zekrId || isBusy) return
    setIsBusy(true)
    try {
      const safeCount = Math.max(0, Number(count) || 0)
      const safeTarget = Math.max(0, Number(target) || 0)
      lastPushedMetaRef.current = JSON.stringify([
        String(zekrId),
        String(zekrText || ''),
        safeTarget,
        Boolean(vibrate),
      ])
      lastPushedCountRef.current = safeCount
      nativeEchoRef.current = { zekrId: String(zekrId), count: safeCount }
      await startNativePocketMode({
        zekrId,
        zekrText,
        count: safeCount,
        target: safeTarget,
        vibrate,
      })
      statusReadyRef.current = true
      setIsPocketActive(true)
      showToast('تم التفعيل — اقفل الشاشة وسبّح بزر الصوت')
    } catch (err) {
      console.error('[PocketTasbih] Start failed:', err)
      showToast('تعذّر تفعيل التسبيح في القفل')
    } finally {
      setIsBusy(false)
    }
  }, [isSupported, zekrId, zekrText, count, target, vibrate, isBusy, showToast])

  const stopPocket = useCallback(async () => {
    if (!isSupported || isBusy) return
    setIsBusy(true)
    try {
      await stopNativePocketMode()
      setIsPocketActive(false)
      lastPushedMetaRef.current = ''
      lastPushedCountRef.current = -1
      nativeEchoRef.current = { zekrId: '', count: -1 }
      await syncPendingPocketClicks(queryClient)
      showToast('تم إيقاف التسبيح في القفل')
    } catch (err) {
      console.error('[PocketTasbih] Stop failed:', err)
    } finally {
      setIsBusy(false)
    }
  }, [isSupported, isBusy, queryClient, showToast])

  const togglePocket = useCallback(() => {
    if (isPocketActive) {
      return stopPocket()
    }
    return startPocket()
  }, [isPocketActive, startPocket, stopPocket])

  return {
    isPocketSupported: isSupported,
    isPocketActive,
    isPocketBusy: isBusy,
    togglePocket,
    stopPocket,
  }
}
