import { useState, useEffect, useCallback } from 'react'
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
  getBackup,     // ✅ تم إضافة الاستيراد
  restoreBackup, // ✅ تم إضافة الاستيراد
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
import FocusMode from '@/components/zekr_app/zekr/FocusMode.jsx'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import styles from './Zekr.module.scss'

const TABS = [
  { id: 'sabh', label: 'سبحة', icon: '📿' },
  { id: 'stats', label: 'إحصائيات', icon: '📊' },
  { id: 'settings', label: 'إعدادات', icon: '⚙️' },
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
  const [isFocusMode, setIsFocusMode] = useState(false)

  // سياق تعديل الهدف (حر أم مجموعات)
  const [targetModalConfig, setTargetModalConfig] = useState(null)

  // ===========================
  // القيم المشتقة
  // ===========================
  const currentZekr = allAdhkar.find((z) => z.id === currentZekrId)
  const currentCount = (currentZekrId && counts[currentZekrId]) || 0
  const currentTarget = currentZekr
    ? targets[currentZekr.id] ?? currentZekr.default_target ?? null
    : null
  const isComplete = !!currentTarget && currentCount >= currentTarget

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
          setCurrentZekrId(adhkarData[0].id)
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

  // الخروج التلقائي من وضع التركيز عند اكتمال الهدف
  useEffect(() => {
    if (isFocusMode && isComplete) {
      const timer = setTimeout(() => setIsFocusMode(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isFocusMode, isComplete])

  // ===========================
  // التسبيح بنظام التحديث التفاؤلي
  // ===========================
  const handlePerformClick = useCallback(async (zekrId) => {
    if (!zekrId) return

    setCounts((prev) => {
      const prevCount = prev[zekrId] || 0
      return { ...prev, [zekrId]: prevCount + 1 }
    })

    try {
      const result = await addClick(zekrId)
      if (result && typeof result.count === 'number') {
        setCounts((prev) => ({ ...prev, [zekrId]: result.count }))
      }
    } catch (err) {
      console.error('فشل تسجيل الضغطة بالسيرفر:', err)
      setCounts((prev) => ({
        ...prev,
        [zekrId]: Math.max(0, (prev[zekrId] || 1) - 1),
      }))
    }
  }, [])

  const handleNormalClick = useCallback(() => {
    if (!currentZekrId) return
    if (currentTarget && currentCount >= currentTarget) return
    handlePerformClick(currentZekrId)
  }, [currentZekrId, currentTarget, currentCount, handlePerformClick])

  // ===========================
  // Handlers — التصفير وتعديل الأهداف
  // ===========================
  const handleConfirmReset = async () => {
    if (!currentZekrId) return
    try {
      await resetClick(currentZekrId)
      setCounts((prev) => ({ ...prev, [currentZekrId]: 0 }))
      setIsResetModalOpen(false)
    } catch (err) {
      console.error('فشل تصفير العدد:', err)
    }
  }

  const handleOpenNormalTargetModal = (zekrId, currentValue) => {
    setTargetModalConfig({ mode: 'normal', zekrId, currentValue })
    setIsTargetModalOpen(true)
  }

  const handleOpenGroupTargetModal = (groupId, itemId, currentValue) => {
    setTargetModalConfig({ mode: 'group', groupId, itemId, currentValue })
    setIsTargetModalOpen(true)
  }

  const handleConfirmTarget = async (newTarget) => {
    if (!targetModalConfig) return
    const numericTarget = newTarget ? parseInt(newTarget, 10) : null

    try {
      if (targetModalConfig.mode === 'normal') {
        await setTarget(targetModalConfig.zekrId, numericTarget)
        setTargets((prev) => ({ ...prev, [targetModalConfig.zekrId]: numericTarget }))
      } else if (targetModalConfig.mode === 'group') {
        await handleUpdateGroupItem(
          targetModalConfig.groupId,
          targetModalConfig.itemId,
          { target: numericTarget }
        )
      }

      setIsTargetModalOpen(false)
      setTargetModalConfig(null)
    } catch (err) {
      console.error('فشل تعديل الهدف:', err)
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

  // ===========================
  // Handlers — إدارة الأذكار والمجموعات
  // ===========================
  const handleAddAdhkar = async (text, target) => {
    try {
      const newZekr = await createAdhkar(text, target)
      setAllAdhkar((prev) => [...prev, newZekr])
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
  // النسخ الاحتياطي الكامل (سيرفر 100%)
  // ===========================
  const handleExportBackup = async () => {
    try {
      // ✅ نسحب النسخة الشاملة مباشرة من السيرفر (تحتوي على كل التواريخ والـ clicks)
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
      alert('فشل في تصدير النسخة الاحتياطية من السيرفر.')
    }
  }

  const handleImportBackup = async (fileContent) => {
    try {
      const data = JSON.parse(fileContent)

      // ✅ نرسل الملف بالكامل للسيرفر ليقوم بكتابة الجداول والتواريخ والعدادات
      const res = await restoreBackup(data)

      // تحديث كل البيانات في الواجهة فوراً
      loadInitialData()

      return { success: true, count: res?.count || data.adhkar?.length || 0 }
    } catch (err) {
      console.error('فشل استيراد النسخة الاحتياطية:', err)
      throw err
    }
  }

  // ===========================
  // اختصار الكيبورد (Space)
  // ===========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)

      if (
        e.code === 'Space' &&
        activeTab === 'sabh' &&
        sabhMode === 'normal' &&
        !isTargetModalOpen &&
        !isResetModalOpen &&
        !isInputActive
      ) {
        e.preventDefault()
        handleNormalClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeTab,
    sabhMode,
    isTargetModalOpen,
    isResetModalOpen,
    handleNormalClick,
  ])

  // ===========================
  // شاشات التحميل والخطأ
  // ===========================
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>جاري تجهيز الأذكار والبيانات...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>تعذر الاتصال بالخادم</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={loadInitialData}>
            إعادة المحاولة ↺
          </button>
        </div>
      </div>
    )
  }

  // محتوى السبحة الحرة
  const renderNormalSabhContent = () => {
    if (!currentZekr) {
      return (
        <div className={styles.emptyContainer}>
          <p className={styles.empty}>لا توجد أذكار مضافة حالياً.</p>
          <button
            type="button"
            className={styles.addFirstBtn}
            onClick={() => setActiveTab('settings')}
          >
            أضف ذكرك الأول من الإعدادات
          </button>
        </div>
      )
    }

    return (
      <>
        <ZekrDisplay
          zekrText={currentZekr.text}
          count={currentCount}
          target={currentTarget}
          onClickCount={() => handleOpenNormalTargetModal(currentZekrId, currentTarget)}
          isComplete={isComplete}
          isFocusMode={isFocusMode}
        />

        {!isFocusMode && (
          <AdhkarSelect
            adhkar={allAdhkar}
            value={currentZekrId}
            onChange={setCurrentZekrId}
          />
        )}

        <ActionButtons
          zekrText={currentZekr.text}
          onReset={!isFocusMode && currentCount > 0 ? () => setIsResetModalOpen(true) : undefined}
          showReset={!isFocusMode}
          onClick={handleNormalClick}
          progress={
            currentTarget
              ? Math.min((currentCount / currentTarget) * 100, 100)
              : 0
          }
          isComplete={isComplete}
          isFocusMode={isFocusMode}
        />

        {!isFocusMode && currentTarget && currentTarget > 33 && (
          <button
            type="button"
            className={styles.focusBtn}
            onClick={() => setIsFocusMode(true)}
            title="الانتقال لوضع التركيز بدون مشتتات"
          >
            🌙 وضع التركيز
          </button>
        )}
      </>
    )
  }

  // ===========================
  // العرض الرئيسي (Render)
  // ===========================
  return (
    <div className={styles.zekr}>
      <header className={styles.navHeader}>
        <Link to="/" className={styles.backBtn} title="الرجوع للرئيسية">
          <span>←</span>
          <span>الرئيسية</span>
        </Link>

        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </header>

      <div className={styles.container}>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <main className={styles.content}>
          {activeTab === 'sabh' && (
            <div className={styles.sabhView}>
              <SabhModeTabs value={sabhMode} onChange={setSabhMode} />

              {sabhMode === 'normal' && (
                <div className={styles.normalModeContainer}>
                  {isFocusMode ? (
                    <FocusMode onClose={() => setIsFocusMode(false)}
                      onCount={handleNormalClick}
                    >
                      {renderNormalSabhContent()}
                    </FocusMode>
                  ) : (
                    renderNormalSabhContent()
                  )}
                </div>
              )}

              {sabhMode === 'group' && (
                <GroupModeView
                  groups={groups}
                  onAddClick={handlePerformClick}
                  onResetClick={handleResetForZekr}
                  onSetTarget={handleOpenGroupTargetModal}
                />
              )}
            </div>
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
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}
        </main>
      </div>

      <PromptModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false)
          setTargetModalConfig(null)
        }}
        onConfirm={handleConfirmTarget}
        title={targetModalConfig?.mode === 'group' ? 'هدف الذكر في المجموعة' : 'الهدف للوضع الحر'}
        defaultValue={targetModalConfig?.currentValue ?? ''}
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
        message="هل أنت متأكد من تصفير عدد هذا الذكر؟"
        confirmLabel="نعم، امسح"
        cancelLabel="إلغاء"
        danger
      />
    </div>
  )
}

export default Zekr
