import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useAdhkarQuery, useZekrStreakQuery } from '@/queries/zekr'
import {
  useTransactionsQuery,
  useProcessDueRecurringMutation,
} from '@/queries/budget'
import { getCurrentMonth } from '@/contexts/BudgetContext'
import { useCurrency } from './useCurrency.js'
import { usePrivacyMode } from './usePrivacyMode.js'
import { useBudgetLock } from './useBudgetLock.js'
import { consumeNativeDeepLink, updateNativeWidget } from '@/utils/haptics.js'

const EMPTY_LIST = []

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * منسّق عالمي هادئ لثلاث مهام:
 * 1) تطبيق المعاملات المتكررة المستحقة عند فتح التطبيق أو عودته للواجهة
 * 2) استقبال روابط الاختصارات والودجت والإشعارات على أندرويد (App Shortcuts / Widget / Reminders)
 * 3) تحديث ودجت الشاشة الرئيسية لأندرويد بأحدث أرقام الذكر والمصروف والخصوصية
 */
export function useNativeSync() {
  const navigate = useNavigate()
  const { mutate: runDueRecurring } = useProcessDueRecurringMutation()
  const thisMonth = useMemo(() => getCurrentMonth(), [])

  const { data: adhkar = EMPTY_LIST } = useAdhkarQuery()
  const { data: streak = null } = useZekrStreakQuery()
  const { data: txns = EMPTY_LIST } = useTransactionsQuery(thisMonth)
  const { symbol } = useCurrency()
  const { isPrivate } = usePrivacyMode()
  const { lockEnabled } = useBudgetLock()

  // 1) تطبيق المعاملات المتكررة المستحقة تلقائياً
  useEffect(() => {
    runDueRecurring()
    const onVis = () => {
      if (document.visibilityState === 'visible') runDueRecurring()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [runDueRecurring])

  // 2) توجيه الروابط العميقة من App Shortcuts والودجت والإشعارات
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const go = (route) => {
      if (typeof route === 'string' && route.startsWith('/')) {
        navigate(route)
      }
    }

    consumeNativeDeepLink().then(go)

    const handler = (e) => go(e?.detail?.route)
    window.addEventListener('mizanDeepLink', handler)
    return () => window.removeEventListener('mizanDeepLink', handler)
  }, [navigate])

  // 3) مزامنة ودجت الشاشة الرئيسية في أندرويد
  const todayExpense = useMemo(() => {
    const today = todayIso()
    let sum = 0
    for (const t of txns) {
      if (t.type === 'expense' && t.date === today) {
        sum += Number(t.amount) || 0
      }
    }
    return Math.round(sum * 100) / 100
  }, [txns])

  const defaultZekrId = adhkar[0]?.id || ''
  const defaultZekrText = adhkar[0]?.text || 'سُبْحَانَ اللَّهِ'
  const todayZekrCount = Number(streak?.today_count) || 0
  const streakCurrent = Number(streak?.current) || 0

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    updateNativeWidget({
      todayZekr: todayZekrCount,
      streak: streakCurrent,
      todayExpense,
      currency: symbol,
      // إخفاء المبلغ على الودجت تلقائياً في وضع الخصوصية أو عند تفعيل قفل الميزانية
      isPrivate: Boolean(isPrivate || lockEnabled),
      defaultZekrId,
      defaultZekrText,
    })
  }, [
    todayZekrCount,
    streakCurrent,
    todayExpense,
    symbol,
    isPrivate,
    lockEnabled,
    defaultZekrId,
    defaultZekrText,
  ])
}
