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
} from '@/api/client.js'
import { useToast } from './ToastContext'

const ZekrDataContext = createContext(null)

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
  // تحميل البيانات الأولية
  // ===========================
  const loadInitialData = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([getAdhkar(), getCounts(), getTargets(), getGroups()])
      .then(([adhkarData, countsData, targetsData, groupsData]) => {
        setAllAdhkar(adhkarData || [])
        setCounts(countsData || {})
        setTargets(targetsData || {})
        setGroups(groupsData || [])
        if (adhkarData && adhkarData.length > 0) {
          setCurrentZekrId((prev) =>
            prev && adhkarData.some((z) => z.id === prev) ? prev : adhkarData[0].id
          )
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('فشل تحميل البيانات:', err)
        setError(err.message || 'فشل الاتصال بالخادم، يرجى التأكد من تشغيل السيرفر.')
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
      pendingRef.current[zekrId] = Math.max(0, (pendingRef.current[zekrId] || 1) - 1)

      if (
        pendingRef.current[zekrId] === 0 &&
        result &&
        typeof result.count === 'number'
      ) {
        setCounts((prev) => ({ ...prev, [zekrId]: result.count }))
      }
    } catch (err) {
      console.error('فشل تسجيل الضغطة بالسيرفر:', err)
      pendingRef.current[zekrId] = Math.max(0, (pendingRef.current[zekrId] || 1) - 1)
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
    }
  }

  const updateZekrTarget = async (zekrId, numericTarget) => {
    await setTarget(zekrId, numericTarget)
    setTargets((prev) => ({ ...prev, [zekrId]: numericTarget }))
  }

  // ===========================
  // إدارة الأذكار
  // ===========================
  const handleAddAdhkar = async (text, target) => {
    try {
      const newZekr = await createAdhkar(text, target)
      setAllAdhkar((prev) => [...prev, newZekr])
      return newZekr
    } catch (err) {
      console.error('فشل إضافة الذكر:', err)
    }
  }

  const handleUpdateAdhkar = async (id, text, target) => {
    try {
      const updated = await updateAdhkar(id, text, target)
      setAllAdhkar((prev) => prev.map((z) => (z.id === id ? updated : z)))
    } catch (err) {
      console.error('فشل تحديث الذكر:', err)
    }
  }

  const handleDeleteAdhkar = async (id) => {
    try {
      await deleteAdhkar(id)
      setAllAdhkar((prev) => prev.filter((z) => z.id !== id))
    } catch (err) {
      console.error('فشل حذف الذكر:', err)
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
      console.error(err)
    }
  }

  const handleDeleteAllTargets = async () => {
    try {
      await deleteAllTargets()
      setTargets({})
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAllClicks = async () => {
    try {
      await deleteAllClicks()
      setCounts({})
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllData()
      setCounts({})
      setTargets({})
    } catch (err) {
      console.error(err)
    }
  }

  // ===========================
  // إدارة المجموعات
  // ===========================
  const handleAddGroup = async (name, description) => {
    try {
      const newGroup = await createGroup(name, description)
      setGroups((prev) => [newGroup, ...prev])
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateGroup = async (id, name, description) => {
    try {
      const updated = await updateGroup(id, name, description)
      setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteGroup = async (id) => {
    try {
      await deleteGroup(id)
      setGroups((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddGroupItem = async (groupId, zekr_id, target = null) => {
    try {
      const updated = await addGroupItem(groupId, zekr_id, target)
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateGroupItem = async (groupId, itemId, updates) => {
    try {
      const updated = await updateGroupItem(groupId, itemId, updates)
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
      return updated
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteGroupItem = async (groupId, itemId) => {
    try {
      const updated = await deleteGroupItem(groupId, itemId)
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
    } catch (err) {
      console.error(err)
    }
  }

  // ===========================
  // النسخ الاحتياطي
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
    }
  }

  const handleImportBackup = async (fileContent) => {
    try {
      const data = JSON.parse(fileContent)
      const res = await restoreBackup(data)
      loadInitialData()
      return { success: true, count: res?.count || data.adhkar?.length || 0 }
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
  }

  return <ZekrDataContext.Provider value={value}>{children}</ZekrDataContext.Provider>
}

export function useZekrData() {
  const ctx = useContext(ZekrDataContext)
  if (!ctx) throw new Error('useZekrData must be used inside ZekrDataProvider')
  return ctx
}
