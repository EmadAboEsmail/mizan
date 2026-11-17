// ═══════════════════════════════════════════════════════════════
// src/contexts/BudgetContext.jsx — حالة واجهة الميزانية فقط (Client UI State)
// بيانات قاعدة البيانات انتقلت بالكامل إلى src/queries/budget/*
// ═══════════════════════════════════════════════════════════════
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'

const BudgetContext = createContext(null)

export function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function BudgetProvider({ children }) {
  const [currentMonth, _setCurrentMonth] = useState(() => getCurrentMonth())
  const [compareMonth, setCompareMonth] = useState(null)

  const setCurrentMonth = useCallback((month) => {
    _setCurrentMonth(month === 'all' || !month ? null : month)
  }, [])

  const value = useMemo(
    () => ({
      currentMonth,
      compareMonth,
      setCurrentMonth,
      setCompareMonth,
    }),
    [currentMonth, compareMonth, setCurrentMonth]
  )

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  )
}

export function useBudgetUI() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudgetUI must be inside BudgetProvider')
  return ctx
}
