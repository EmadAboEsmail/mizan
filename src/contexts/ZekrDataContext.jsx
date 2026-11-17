// ═══════════════════════════════════════════════════════════════
// src/contexts/ZekrDataContext.jsx — حالة واجهة ذِكر فقط (Client UI State)
// بيانات قاعدة البيانات انتقلت بالكامل إلى src/queries/zekr/*
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useMemo } from 'react'

const ZekrDataContext = createContext(null)

export function ZekrDataProvider({ children }) {
  const [selectedZekrId, setCurrentZekrId] = useState(null)

  const value = useMemo(
    () => ({
      selectedZekrId,
      setCurrentZekrId,
    }),
    [selectedZekrId]
  )

  return (
    <ZekrDataContext.Provider value={value}>
      {children}
    </ZekrDataContext.Provider>
  )
}

export function useZekrUI() {
  const ctx = useContext(ZekrDataContext)
  if (!ctx) throw new Error('useZekrUI must be used inside ZekrDataProvider')
  return ctx
}

/**
 * يُرجع الذكر النشط حالياً مع السقوط التلقائي إلى أول ذكر متاح
 * عند أول تشغيل أو بعد حذف الذكر المختار (بدون useEffect).
 */
export function useCurrentZekrId(allAdhkar = []) {
  const { selectedZekrId, setCurrentZekrId } = useZekrUI()

  const currentZekrId = useMemo(() => {
    if (allAdhkar.length === 0) return null
    const exists =
      selectedZekrId != null &&
      allAdhkar.some((z) => String(z.id) === String(selectedZekrId))
    return exists ? selectedZekrId : allAdhkar[0].id
  }, [allAdhkar, selectedZekrId])

  return [currentZekrId, setCurrentZekrId]
}
