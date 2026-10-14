import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  createAdhkar,
  updateAdhkar,
  deleteAdhkar
} from '@/api/client.js'
import Tabs from '@/components/zekr_app/zekr/Tabs.jsx'
import ZekrDisplay from '@/components/zekr_app/zekr/ZekrDisplay.jsx'
import AdhkarSelect from '@/components/zekr_app/zekr/AdhkarSelect.jsx'
import ActionButtons from '@/components/zekr_app/zekr/ActionButtons.jsx'
import PromptModal from '@/components/ui/PromptModal.jsx'
import styles from './Zekr.module.scss'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import StatsTab from '@/components/zekr_app/stats/StatsTab.jsx'
import SettingsTab from '@/components/zekr_app/settings/SettingsTab.jsx'
const TABS = [
  { id: 'sabh', label: 'سبحة' },
  { id: 'stats', label: 'إحصائيات' },
  { id: 'settings', label: 'إعدادات' },
]

function Zekr() {
  // ===========================
  // State
  // ===========================
  const [activeTab, setActiveTab] = useState('sabh')
  const [allAdhkar, setAllAdhkar] = useState([])
  const [counts, setCounts] = useState({})
  const [targets, setTargets] = useState({})
  const [currentZekrId, setCurrentZekrId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // ===========================
  // تحميل البيانات الأولية
  // ===========================
  useEffect(() => {
    Promise.all([getAdhkar(), getCounts(), getTargets()])
      .then(([adhkarData, countsData, targetsData]) => {
        setAllAdhkar(adhkarData)
        setCounts(countsData)
        setTargets(targetsData)
        if (adhkarData.length > 0) {
          setCurrentZekrId(adhkarData[0].id)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('فشل تحميل البيانات:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])
  useEffect(() => {
    if (allAdhkar.length > 0 && !allAdhkar.find((z) => z.id === currentZekrId)) {
      setCurrentZekrId(allAdhkar[0].id)
    }
  }, [allAdhkar, currentZekrId])
  // ===========================
  // القيم المشتقة
  // ===========================
  const currentZekr = allAdhkar.find((z) => z.id === currentZekrId)
  const currentCount = counts[currentZekrId] || 0
  const currentTarget = currentZekr
    ? targets[currentZekr.id] ?? currentZekr.default_target ?? null
    : null

  // ===========================
  // Handlers
  // ===========================

  // زيادة العدد (Optimistic Update)
  const handleClick = async () => {
    if (!currentZekr) return
    if (currentTarget && currentCount >= currentTarget) return

    const newCount = currentCount + 1
    setCounts((prev) => ({ ...prev, [currentZekrId]: newCount }))

    try {
      const result = await addClick(currentZekrId)
      setCounts((prev) => ({ ...prev, [currentZekrId]: result.count }))
    } catch (err) {
      console.error('فشل تسجيل الضغطة:', err)
      setCounts((prev) => ({ ...prev, [currentZekrId]: currentCount }))
    }
  }

  // تصفير العدد
  const handleOpenResetModal = () => {
    if (!currentZekr) return
    if (currentCount === 0) return
    setIsResetModalOpen(true)
  }

  const handleConfirmReset = async () => {
    try {
      await resetClick(currentZekrId)
      setCounts((prev) => ({ ...prev, [currentZekrId]: 0 }))
      setIsResetModalOpen(false)
    } catch (err) {
      console.error('فشل تصفير العدد:', err)
    }
  }  // فتح Modal الهدف
  const handleOpenTargetModal = () => {
    if (!currentZekr) return
    setIsTargetModalOpen(true)
  }

  // تأكيد الهدف الجديد
  const handleConfirmTarget = async (newTarget) => {
    try {
      await setTarget(currentZekrId, newTarget)
      setTargets((prev) => ({ ...prev, [currentZekrId]: newTarget }))
      setIsTargetModalOpen(false)
    } catch (err) {
      console.error('فشل تعديل الهدف:', err)
    }
  }

  // تغيير الذكر
  const handleSelectZekr = (id) => {
    setCurrentZekrId(id)
  }

  const handleAddAdhkar = async (text, target) => {
    const newZekr = await createAdhkar(text, target)
    setAllAdhkar((prev) => [...prev, newZekr])
  }

  const handleUpdateAdhkar = async (id, text, target) => {
    const updated = await updateAdhkar(id, text, target)
    setAllAdhkar((prev) => prev.map((z) => (z.id === id ? updated : z)))
  }

  const handleDeleteAdhkar = async (id) => {
    await deleteAdhkar(id)
    setAllAdhkar((prev) => prev.filter((z) => z.id !== id))
    // لو الذكر المحذوف هو الحالي، نختار أول ذكر
    if (currentZekrId === id) {
      const remaining = allAdhkar.filter((z) => z.id !== id)
      setCurrentZekrId(remaining[0]?.id ?? null)
    }
  }

  // مسح كل الأعداد
  const handleDeleteAllCounts = async () => {
    await deleteAllCounts()
    setCounts({})
  }


  // مسح كل الأهداف
  const handleDeleteAllTargets = async () => {
    await deleteAllTargets()
    setTargets({})
  }

  // مسح كل الإحصائيات
  const handleDeleteAllClicks = async () => {
    await deleteAllClicks()

    setCounts({})
  }

  // مسح كل حاجة
  const handleDeleteAll = async () => {
    await deleteAllData()
    setCounts({})
    setTargets({})
  }

  // ===========================
  // اختصار الكيبورد (Space)
  // ===========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && activeTab === 'sabh' && !isTargetModalOpen && !isResetModalOpen) {
        e.preventDefault()
        handleClick()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, currentZekrId, currentCount, currentTarget, isTargetModalOpen, isResetModalOpen])

  // ===========================
  // حالات التحميل والخطأ
  // ===========================
  if (loading) {
    return <div className={styles.message}>جاري التحميل..</div>
  }

  if (error) {
    return (
      <div className={styles.message}>
        خطأ: {error}
        <br />
        تأكد من تشغيل السيرفر
      </div>
    )
  }

  const isComplete = !!currentTarget && currentCount >= currentTarget

  // ===========================
  // العرض
  // ===========================
  return (
    <div className={styles.zekr}>
      <Link to="/" className={styles.back}>
        ← الرجوع
      </Link>

      <div className={styles.container}>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className={styles.content}>
          {activeTab === 'sabh' && currentZekr && (
            <>
              <ZekrDisplay
                zekrText={currentZekr.text}
                count={currentCount}
                target={currentTarget}
                onClickCount={handleOpenTargetModal}
                isComplete={isComplete}


              />

              <AdhkarSelect
                adhkar={allAdhkar}
                value={currentZekrId}
                onChange={handleSelectZekr}
              />

              <ActionButtons
                zekrText={currentZekr.text}
                onReset={handleOpenResetModal}
                onClick={handleClick}
                progress={
                  currentTarget
                    ? Math.min((currentCount / currentTarget) * 100, 100)
                    : 0
                }

                isComplete={isComplete}
              />
            </>
          )}

          {activeTab === 'stats' && <StatsTab adhkar={allAdhkar} />}

          {activeTab === 'settings' && (
            <SettingsTab
              adhkar={allAdhkar}
              onDeleteCounts={handleDeleteAllCounts}
              onDeleteTargets={handleDeleteAllTargets}
              onDeleteClicks={handleDeleteAllClicks}
              onDeleteAll={handleDeleteAll}
              onAddAdhkar={handleAddAdhkar}
              onUpdateAdhkar={handleUpdateAdhkar}
              onDeleteAdhkar={handleDeleteAdhkar}
            />
          )}
        </div>
      </div>

      {/* PromptModal بره التابات عشان يفضل ظاهر */}
      <PromptModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onConfirm={handleConfirmTarget}
        title="الهدف الجديد"
        defaultValue={currentTarget ?? ''}
        type="number"
        min={1}
        max={10000}
        placeholder="1 - 10000"
      />
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="مسح العدد؟"
        message="هل أنت متأكد من مسح عدد هذا الذكر؟"
        confirmLabel="نعم، امسح"
        cancelLabel="إلغاء"
        danger
      />
    </div>
  )
}

export default Zekr
