import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useZekrData } from '@/context/ZekrDataContext'
import ZekrDisplay from '@/components/zekr_app/zekr/ZekrDisplay.jsx'
import AdhkarSelect from '@/components/zekr_app/zekr/AdhkarSelect.jsx'
import ActionButtons from '@/components/zekr_app/zekr/ActionButtons.jsx'
import SabhModeTabs from '@/components/zekr_app/zekr/SabhModeTabs.jsx'
import GroupModeView from '@/components/zekr_app/zekr/GroupModeView.jsx'
import PromptModal from '@/components/ui/PromptModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import FocusMode from '@/components/zekr_app/zekr/FocusMode.jsx'
import styles from './ZekrSabh.module.scss'

function ZekrSabh() {
  const navigate = useNavigate()
  const {
    allAdhkar,
    counts,
    targets,
    groups,
    currentZekrId,
    setCurrentZekrId,
    handlePerformClick,
    handleResetForZekr,
    updateZekrTarget,
    handleUpdateGroupItem,
  } = useZekrData()

  const [sabhMode, setSabhMode] = useState('normal')
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [targetModalConfig, setTargetModalConfig] = useState(null)

  const currentZekr = allAdhkar.find((z) => z.id === currentZekrId)
  const currentCount = (currentZekrId && counts[currentZekrId]) || 0
  const currentTarget = currentZekr
    ? targets[currentZekr.id] ?? currentZekr.default_target ?? null
    : null
  const isComplete = !!currentTarget && currentCount >= currentTarget

  const handleNormalClick = useCallback(() => {
    if (!currentZekrId) return
    handlePerformClick(currentZekrId)
  }, [currentZekrId, handlePerformClick])

  const handleConfirmReset = async () => {
    if (!currentZekrId) return
    await handleResetForZekr(currentZekrId)
    setIsResetModalOpen(false)
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
        await updateZekrTarget(targetModalConfig.zekrId, numericTarget)
      } else if (targetModalConfig.mode === 'group') {
        await handleUpdateGroupItem(
          targetModalConfig.groupId,
          targetModalConfig.itemId,
          { target: numericTarget },
        )
      }
      setIsTargetModalOpen(false)
      setTargetModalConfig(null)
    } catch (err) {
      console.error('فشل تعديل الهدف:', err)
    }
  }

  // Space shortcut — مربوط بوجود ZekrSabh (يعني تاب sabh)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(
        document.activeElement?.tagName,
      )
      if (
        e.code === 'Space' &&
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
  }, [sabhMode, isTargetModalOpen, isResetModalOpen, handleNormalClick])

  const renderNormalSabhContent = () => {
    if (!currentZekr) {
      return (
        <div className={styles.emptyContainer}>
          <p className={styles.empty}>لا توجد أذكار مضافة حالياً.</p>
          <button
            type="button"
            className={styles.addFirstBtn}
            onClick={() => navigate('/zekr/settings')}
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
          onReset={!isFocusMode ? () => setIsResetModalOpen(true) : undefined}
          zekrText={currentZekr.text}
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

        {!isFocusMode && currentTarget && currentTarget && (
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

  return (
    <div className={styles.sabhView}>
      <SabhModeTabs value={sabhMode} onChange={setSabhMode} />

      {sabhMode === 'normal' && (
        <div className={styles.normalModeContainer}>
          {isFocusMode ? (
            <FocusMode
              onClose={() => setIsFocusMode(false)}
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

      <PromptModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false)
          setTargetModalConfig(null)
        }}
        onConfirm={handleConfirmTarget}
        title={
          targetModalConfig?.mode === 'group'
            ? 'هدف الذكر في المجموعة'
            : 'الهدف للوضع الحر'
        }
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

export default ZekrSabh
