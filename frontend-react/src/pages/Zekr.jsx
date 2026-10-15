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
} from '@/api/client.js'
import Tabs from '@/components/zekr_app/zekr/Tabs.jsx'
import ZekrDisplay from '@/components/zekr_app/zekr/ZekrDisplay.jsx'
import AdhkarSelect from '@/components/zekr_app/zekr/AdhkarSelect.jsx'
import ActionButtons from '@/components/zekr_app/zekr/ActionButtons.jsx'
import SabhModeTabs from '@/components/zekr_app/zekr/SabhModeTabs.jsx'
import GroupModeView from '@/components/zekr_app/zekr/GroupModeView.jsx'
import PromptModal from '@/components/ui/PromptModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import StatsTab from '@/components/zekr_app/stats/StatsTab.jsx'
import SettingsTab from '@/components/zekr_app/settings/SettingsTab.jsx'
import styles from './Zekr.module.scss'

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
  const [sabhMode, setSabhMode] = useState('normal') // 'normal' | 'group'

  const [allAdhkar, setAllAdhkar] = useState([])
  const [counts, setCounts] = useState({})
  const [targets, setTargets] = useState({})
  const [groups, setGroups] = useState([])
  const [currentZekrId, setCurrentZekrId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // Modal الهدف — يشيل zekr_id والقيمة الحالية
  const [targetModalZekrId, setTargetModalZekrId] = useState(null)
  const [targetModalValue, setTargetModalValue] = useState(null)

  // ===========================
  // تحميل البيانات الأولية
  // ===========================
  useEffect(() => {
    Promise.all([getAdhkar(), getCounts(), getTargets(), getGroups()])
      .then(([adhkarData, countsData, targetsData, groupsData]) => {
        setAllAdhkar(adhkarData)
        setCounts(countsData)
        setTargets(targetsData)
        setGroups(groupsData ?? [])
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

  // لو الذكر الحالي اتحذف، اختار أول واحد
  useEffect(() => {
    if (
      allAdhkar.length > 0 &&
      !allAdhkar.find((z) => z.id === currentZekrId)
    ) {
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
  // Handlers — الوضع العادي
  // ===========================

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
  }

  const handleOpenTargetModal = () => {
    if (!currentZekr) return
    setTargetModalZekrId(currentZekrId)
    setTargetModalValue(currentTarget)
    setIsTargetModalOpen(true)
  }

  const handleConfirmTarget = async (newTarget) => {
    try {
      await setTarget(targetModalZekrId, newTarget)
      setTargets((prev) => ({ ...prev, [targetModalZekrId]: newTarget }))
      setIsTargetModalOpen(false)
      setTargetModalZekrId(null)
      setTargetModalValue(null)
    } catch (err) {
      console.error('فشل تعديل الهدف:', err)
    }
  }

  const handleSelectZekr = (id) => {
    setCurrentZekrId(id)
  }

  // ===========================
  // Handlers — وضع المجموعة
  // ===========================

  const handleClickForZekr = async (zekr_id) => {
    const zekr = allAdhkar.find((z) => z.id === zekr_id)
    if (!zekr) return
    const target = targets[zekr_id] ?? zekr.default_target ?? null
    const count = counts[zekr_id] || 0

    if (target && count >= target) return

    const newCount = count + 1
    setCounts((prev) => ({ ...prev, [zekr_id]: newCount }))

    try {
      const result = await addClick(zekr_id)
      setCounts((prev) => ({ ...prev, [zekr_id]: result.count }))
    } catch (err) {
      console.error('فشل تسجيل الضغطة:', err)
      setCounts((prev) => ({ ...prev, [zekr_id]: count }))
    }
  }

  const handleResetForZekr = async (zekr_id) => {
    try {
      await resetClick(zekr_id)
      setCounts((prev) => ({ ...prev, [zekr_id]: 0 }))
    } catch (err) {
      console.error('فشل تصفير العدد:', err)
    }
  }

  const handleSetTargetForZekr = (zekr_id, currentTarget) => {
    setTargetModalZekrId(zekr_id)
    setTargetModalValue(currentTarget)
    setIsTargetModalOpen(true)
  }

  // ===========================
  // Handlers — الأذكار
  // ===========================

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
    if (currentZekrId === id) {
      const remaining = allAdhkar.filter((z) => z.id !== id)
      setCurrentZekrId(remaining[0]?.id ?? null)
    }
  }

  // ===========================
  // Handlers — مسح البيانات
  // ===========================

  const handleDeleteAllCounts = async () => {
    await deleteAllCounts()
    setCounts({})
  }

  const handleDeleteAllTargets = async () => {
    await deleteAllTargets()
    setTargets({})
  }

  const handleDeleteAllClicks = async () => {
    await deleteAllClicks()
    setCounts({})
  }

  const handleDeleteAll = async () => {
    await deleteAllData()
    setCounts({})
    setTargets({})
  }

  // ===========================
  // Handlers — المجموعات
  // ===========================

  const handleAddGroup = async (name, description) => {
    const newGroup = await createGroup(name, description)
    setGroups((prev) => [newGroup, ...prev])
  }

  const handleUpdateGroup = async (id, name, description) => {
    const updated = await updateGroup(id, name, description)
    setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)))
  }

  const handleDeleteGroup = async (id) => {
    await deleteGroup(id)
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  const handleAddGroupItem = async (groupId, zekr_id, target = null) => {
    const updated = await addGroupItem(groupId, zekr_id, target)
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
  }

  const handleUpdateGroupItem = async (groupId, itemId, updates) => {
    const updated = await updateGroupItem(groupId, itemId, updates)
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
  }

  const handleDeleteGroupItem = async (groupId, itemId) => {
    const updated = await deleteGroupItem(groupId, itemId)
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
  }

  // ===========================
  // اختصار الكيبورد (Space)
  // ===========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === 'Space' &&
        activeTab === 'sabh' &&
        sabhMode === 'normal' &&
        !isTargetModalOpen &&
        !isResetModalOpen
      ) {
        e.preventDefault()
        handleClick()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    activeTab,
    sabhMode,
    currentZekrId,
    currentCount,
    currentTarget,
    isTargetModalOpen,
    isResetModalOpen,
  ])

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
          {activeTab === 'sabh' && (
            <>
              <SabhModeTabs value={sabhMode} onChange={setSabhMode} />

              {sabhMode === 'normal' && currentZekr && (
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

              {sabhMode === 'group' && (
                <GroupModeView
                  groups={groups}
                  counts={counts}
                  targets={targets}
                  onAddClick={handleClickForZekr}
                  onResetClick={handleResetForZekr}
                  onSetTarget={handleSetTargetForZekr}
                />
              )}
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
              groups={groups}
              onAddGroup={handleAddGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddGroupItem={handleAddGroupItem}
              onUpdateGroupItem={handleUpdateGroupItem}
              onDeleteGroupItem={handleDeleteGroupItem}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <PromptModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false)
          setTargetModalZekrId(null)
          setTargetModalValue(null)
        }}
        onConfirm={handleConfirmTarget}
        title="الهدف الجديد"
        defaultValue={targetModalValue ?? ''}
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
