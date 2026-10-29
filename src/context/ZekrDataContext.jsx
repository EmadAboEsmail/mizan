import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import {
  getAdhkar,
  getCounts,
  getTargets,
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
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupItem,
  updateGroupItem,
  deleteGroupItem,
  getBackup,
  restoreBackup,
  // ... الموجود
  importLegacy as apiImportLegacy,
} from '@/services/zekrService.js'
import { useToast } from './ToastContext'

const ZekrDataContext = createContext(null)

// ===========================
// دوال مساعدة
// ===========================
const dedupeById = (list) => {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  return list.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

const isNotFoundError = (err) => {
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('غير موجود') || msg.includes('not found')
}

export function ZekrDataProvider({ children }) {
  // ===========================
  // Data State
  // ===========================
  const [allAdhkar, setAllAdhkar] = useState([])
  const [counts, setCounts] = useState({})
  const [targets, setTargets] = useState({})
  const [groups, setGroups] = useState([])
  const [currentZekrId, setCurrentZekrId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const pendingRef = useRef({})
  const { showToast } = useToast()

  // ===========================
  // تحميل البيانات الأولية (مع dedupe)
  // ===========================
  const loadInitialData = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([getAdhkar(), getCounts(), getTargets(), getGroups()])
      .then(([adhkarData, countsData, targetsData, groupsData]) => {
        const cleanAdhkar = dedupeById(adhkarData)
        const cleanGroups = dedupeById(groupsData)

        setAllAdhkar(cleanAdhkar)
        setCounts(countsData || {})
        setTargets(targetsData || {})
        setGroups(cleanGroups)

        if (cleanAdhkar.length > 0) {
          setCurrentZekrId((prev) =>
            prev && cleanAdhkar.some((z) => z.id === prev)
              ? prev
              : cleanAdhkar[0].id
          )
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('فشل تحميل البيانات:', err)
        setError(
          err.message || 'فشل الاتصال بالخادم، يرجى التأكد من تشغيل السيرفر.'
        )
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // اختيار أول ذكر تلقائياً عند حذف الذكر الحالي
  useEffect(() => {
    if (allAdhkar.length > 0 && !allAdhkar.some((z) => z.id === currentZekrId)) {
      setCurrentZekrId(allAdhkar[0].id)
    }
  }, [allAdhkar, currentZekrId])

  // ===========================
  // التسبيح (Optimistic + pendingRef)
  // ===========================
  const handlePerformClick = useCallback(async (zekrId) => {
    if (!zekrId) return

    pendingRef.current[zekrId] = (pendingRef.current[zekrId] || 0) + 1
    setCounts((prev) => {
      const prevCount = prev[zekrId] || 0
      return { ...prev, [zekrId]: prevCount + 1 }
    })

    try {
      const result = await addClick(zekrId)
      pendingRef.current[zekrId] = Math.max(
        0,
        (pendingRef.current[zekrId] || 1) - 1
      )

      if (
        pendingRef.current[zekrId] === 0 &&
        result &&
        typeof result.count === 'number'
      ) {
        setCounts((prev) => ({ ...prev, [zekrId]: result.count }))
      }
    } catch (err) {
      console.error('فشل تسجيل الضغطة بالسيرفر:', err)
      pendingRef.current[zekrId] = Math.max(
        0,
        (pendingRef.current[zekrId] || 1) - 1
      )
      setCounts((prev) => ({
        ...prev,
        [zekrId]: Math.max(0, (prev[zekrId] || 1) - 1),
      }))
    }
  }, [])

  // ===========================
  // التصفير والهدف
  // ===========================
  const handleResetForZekr = async (zekrId) => {
    try {
      await resetClick(zekrId)
      setCounts((prev) => ({ ...prev, [zekrId]: 0 }))
    } catch (err) {
      console.error('فشل تصفير العدد:', err)
      throw err
    }
  }

  const updateZekrTarget = async (zekrId, numericTarget) => {
    try {
      await setTarget(zekrId, numericTarget)
      setTargets((prev) => ({ ...prev, [zekrId]: numericTarget }))
    } catch (err) {
      console.error('فشل تعديل الهدف:', err)
      throw err
    }
  }

  // ===========================
  // إدارة الأذكار (re-throw + self-heal)
  // ===========================
  const handleAddAdhkar = async (text, target) => {
    try {
      const newZekr = await createAdhkar(text, target)
      setAllAdhkar((prev) => [...prev, newZekr])
      return newZekr
    } catch (err) {
      console.error('فشل إضافة الذكر:', err)
      throw err
    }
  }

  const handleUpdateAdhkar = async (id, text, target) => {
    try {
      const updated = await updateAdhkar(id, text, target)
      setAllAdhkar((prev) => prev.map((z) => (z.id === id ? updated : z)))
    } catch (err) {
      console.error('فشل تحديث الذكر:', err)
      if (isNotFoundError(err)) {
        console.warn('🔄 الذكر غير موجود في السيرفر — إعادة مزامنة...')
        loadInitialData()
      }
      throw err
    }
  }

  const handleDeleteAdhkar = async (id) => {
    try {
      await deleteAdhkar(id)
      setAllAdhkar((prev) => prev.filter((z) => z.id !== id))
    } catch (err) {
      console.error('فشل حذف الذكر:', err)
      if (isNotFoundError(err)) {
        console.warn('🔄 الذكر غير موجود في السيرفر — إعادة مزامنة...')
        loadInitialData()
      }
      throw err
    }
  }

  // ===========================
  // مسح عام
  // ===========================
  const handleDeleteAllCounts = async () => {
    try {
      await deleteAllCounts()
      setCounts({})
    } catch (err) {
      console.error('فشل مسح الأعداد:', err)
      throw err
    }
  }

  const handleDeleteAllTargets = async () => {
    try {
      await deleteAllTargets()
      setTargets({})
    } catch (err) {
      console.error('فشل مسح الأهداف:', err)
      throw err
    }
  }

  const handleDeleteAllClicks = async () => {
    try {
      await deleteAllClicks()
      setCounts({})
    } catch (err) {
      console.error('فشل مسح الإحصائيات:', err)
      throw err
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllData()
      setCounts({})
      setTargets({})
    } catch (err) {
      console.error('فشل مسح كل البيانات:', err)
      throw err
    }
  }

  // ===========================
  // إدارة المجموعات (re-throw + self-heal)
  // ===========================
  const handleAddGroup = async (name, description) => {
    try {
      const newGroup = await createGroup(name, description)
      setGroups((prev) => [newGroup, ...prev])
      return newGroup
    } catch (err) {
      console.error('فشل إضافة المجموعة:', err)
      throw err
    }
  }

  const handleUpdateGroup = async (id, name, description) => {
    try {
      const updated = await updateGroup(id, name, description)
      setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)))
    } catch (err) {
      console.error('فشل تحديث المجموعة:', err)
      if (isNotFoundError(err)) {
        console.warn('🔄 المجموعة غير موجودة في السيرفر — إعادة مزامنة...')
        loadInitialData()
      }
      throw err
    }
  }

  const handleDeleteGroup = async (id) => {
    try {
      await deleteGroup(id)
      setGroups((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      console.error('فشل حذف المجموعة:', err)
      if (isNotFoundError(err)) {
        console.warn('🔄 المجموعة غير موجودة في السيرفر — إعادة مزامنة...')
        loadInitialData()
      }
      throw err
    }
  }

  const handleAddGroupItem = async (groupId, zekr_id, target = null) => {
    try {
      const updated = await addGroupItem(groupId, zekr_id, target)
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
    } catch (err) {
      console.error('فشل إضافة الذكر للمجموعة:', err)
      if (isNotFoundError(err)) loadInitialData()
      throw err
    }
  }

  const handleUpdateGroupItem = async (groupId, itemId, updates) => {
    try {
      const updated = await updateGroupItem(groupId, itemId, updates)
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
      return updated
    } catch (err) {
      console.error('فشل تحديث الذكر في المجموعة:', err)
      if (isNotFoundError(err)) loadInitialData()
      throw err
    }
  }

  const handleDeleteGroupItem = async (groupId, itemId) => {
    try {
      const updated = await deleteGroupItem(groupId, itemId)
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
    } catch (err) {
      console.error('فشل حذف الذكر من المجموعة:', err)
      if (isNotFoundError(err)) loadInitialData()
      throw err
    }
  }

  // ===========================
  // النسخ الاحتياطي (مع dedupe)
  // ===========================
  const handleExportBackup = async () => {
    try {
      const backupData = await getBackup()
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `zekr-backup-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('فشل تصدير النسخة الاحتياطية:', err)
      showToast('فشل في تصدير النسخة الاحتياطية من السيرفر.')
      throw err
    }
  }

  const handleImportBackup = async (fileContent) => {
    try {
      const data = JSON.parse(fileContent)

      // ✅ dedupe قبل الإرسال للسيرفر لمنع التكرار
      const sanitized = {
        ...data,
        adhkar: dedupeById(data?.adhkar),
        groups: dedupeById(data?.groups),
      }

      const res = await restoreBackup(sanitized)
      loadInitialData()

      return {
        success: true,
        count: res?.count || sanitized.adhkar?.length || 0,
      }
    } catch (err) {
      console.error('فشل استيراد النسخة الاحتياطية:', err)
      throw err
    }
  }

  // ===========================
  // القيمة المصدّرة
  // ===========================
  const value = {
    // Data
    allAdhkar,
    counts,
    targets,
    groups,
    currentZekrId,
    setCurrentZekrId,
    loading,
    error,
    // Loader
    loadInitialData,
    // Handlers
    handlePerformClick,
    handleResetForZekr,
    updateZekrTarget,
    handleAddAdhkar,
    handleUpdateAdhkar,
    handleDeleteAdhkar,
    handleDeleteAllCounts,
    handleDeleteAllTargets,
    handleDeleteAllClicks,
    handleDeleteAll,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAddGroupItem,
    handleUpdateGroupItem,
    handleDeleteGroupItem,
    handleExportBackup,
    handleImportBackup,
    importLegacy: async (legacy) => {
      const res = await apiImportLegacy(legacy)
      loadInitialData()
      return res
    }
  }

  return <ZekrDataContext.Provider value={value}>{children}</ZekrDataContext.Provider>
}

export function useZekrData() {
  const ctx = useContext(ZekrDataContext)
  if (!ctx) throw new Error('useZekrData must be used inside ZekrDataProvider')
  return ctx
}
