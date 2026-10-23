import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useZekrData } from '@/context/ZekrDataContext'
import { useModalBackButton } from '@/hooks/useModalBackButton'
import ZekrDisplay from '@/components/zekr_app/zekr/ZekrDisplay.jsx'
import AdhkarSelect from '@/components/zekr_app/zekr/AdhkarSelect.jsx'
import ActionButtons from '@/components/zekr_app/zekr/ActionButtons.jsx'
import SabhModeTabs from '@/components/zekr_app/zekr/SabhModeTabs.jsx'
import GroupModeView from '@/components/zekr_app/zekr/GroupModeView.jsx'
import PromptModal from '@/components/ui/PromptModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import FocusMode, {
  attemptFullscreen,
} from '@/components/zekr_app/zekr/FocusMode.jsx'
import styles from './ZekrSabh.module.scss'

function ZekrSabh() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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

  // ===========================
  // URL-derived state
  // ===========================
  const urlZekrId = searchParams.get('zekr')
  const urlMode = searchParams.get('mode')
  const urlGroupId = searchParams.get('group')

  const sabhMode = urlMode === 'group' ? 'group' : 'normal'

  // ===========================
  // UI-only state (not in URL)
  // ===========================
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
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
  // URL ↔ Context sync (zekr)
  // ===========================
  const zekrInitRef = useRef(false)

  // 1. On first load: if URL has no zekr, mirror context's value to URL
  useEffect(() => {
    if (zekrInitRef.current) return
    if (allAdhkar.length === 0) return
    zekrInitRef.current = true
    if (!urlZekrId && currentZekrId) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('zekr', currentZekrId)
          return next
        },
        { replace: true }
      )
    }
  }, [allAdhkar.length, urlZekrId, currentZekrId, setSearchParams])

  // 2. Sync URL → Context (mount with deep link, back/forward)
  useEffect(() => {
    if (!urlZekrId) return
    if (urlZekrId === currentZekrId) return
    if (!allAdhkar.some((z) => z.id === urlZekrId)) return
    setCurrentZekrId(urlZekrId)
  }, [urlZekrId, allAdhkar, currentZekrId, setCurrentZekrId])

  // 3. Cleanup: URL zekr was deleted
  useEffect(() => {
    if (!urlZekrId) return
    if (allAdhkar.length === 0) return
    if (allAdhkar.some((z) => z.id === urlZekrId)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('zekr')
        return next
      },
      { replace: true }
    )
  }, [urlZekrId, allAdhkar, setSearchParams])

  // User changes zekr via selector
  const handleZekrChange = useCallback(
    (newId) => {
      setCurrentZekrId(newId)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('zekr', newId)
        return next
      })
    },
    [setCurrentZekrId, setSearchParams]
  )

  // ===========================
  // Mode sync
  // ===========================
  const handleModeChange = useCallback(
    (newMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (newMode === 'group') {
            next.set('mode', 'group')
          } else {
            next.delete('mode')
            next.delete('group')
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // ===========================
  // Group sync (default + cleanup)
  // ===========================
  useEffect(() => {
    if (sabhMode !== 'group') return
    if (groups.length === 0) return
    if (urlGroupId && groups.some((g) => g.id === urlGroupId)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('group', groups[0].id)
        return next
      },
      { replace: true }
    )
  }, [sabhMode, groups, urlGroupId, setSearchParams])

  const handleGroupChange = useCallback(
    (newGroupId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('group', newGroupId)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // ===========================
  // Handlers
  // ===========================
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
          { target: numericTarget }
        )
      }
      setIsTargetModalOpen(false)
      setTargetModalConfig(null)
    } catch (err) {
      console.error('فشل تعديل الهدف:', err)
    }
  }

  const handleEnterFocusMode = useCallback(async () => {
    console.log('[Focus] Button clicked')
    try {
      const result = await attemptFullscreen()
      console.log('[Focus] Fullscreen result:', result)
    } catch (err) {
      console.error('[Focus] Fullscreen error:', err)
    } finally {
      console.log('[Focus] Setting isFocusMode = true')
      setIsFocusMode(true)
    }
  }, [])  // ===========================
  // Keyboard shortcuts
  // ===========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(
        document.activeElement?.tagName
      )
      if (isInputActive) return
      if (isTargetModalOpen || isResetModalOpen) return

      // Space: تسبيح
      if (e.code === 'Space' && sabhMode === 'normal' && !isFocusMode) {
        e.preventDefault()
        handleNormalClick()
        return
      }

      // F: وضع التركيز
      if (
        (e.key === 'f' || e.key === 'F') &&
        sabhMode === 'normal' &&
        !isFocusMode &&
        currentZekr
      ) {
        e.preventDefault()
        handleEnterFocusMode()
        return
      }

      // R: تصفير
      if (
        (e.key === 'r' || e.key === 'R') &&
        sabhMode === 'normal' &&
        !isFocusMode &&
        currentCount > 0
      ) {
        e.preventDefault()
        setIsResetModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    sabhMode,
    isFocusMode,
    isTargetModalOpen,
    isResetModalOpen,
    handleNormalClick,
    handleEnterFocusMode,
    currentZekr,
    currentCount,
  ])

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
          onClickCount={() =>
            handleOpenNormalTargetModal(currentZekrId, currentTarget)
          }
          isComplete={isComplete}
          isFocusMode={isFocusMode}
        />

        {!isFocusMode && (
          <AdhkarSelect
            adhkar={allAdhkar}
            value={currentZekrId}
            onChange={handleZekrChange}
          />
        )}

        <ActionButtons
          onReset={!isFocusMode ? () => setIsResetModalOpen(true) : undefined}
          zekrText={currentZekr.text}
          showReset={!isFocusMode}
          count={currentCount}
          onClick={handleNormalClick}
          progress={
            currentTarget
              ? Math.min((currentCount / currentTarget) * 100, 100)
              : 0
          }
          isComplete={isComplete}
          isFocusMode={isFocusMode}
        />

        {!isFocusMode && currentZekr && (
          <button
            type="button"
            className={styles.focusBtn}
            onClick={handleEnterFocusMode}
            title="الانتقال لوضع التركيز بدون مشتتات (F)"
          >
            🌙 وضع التركيز
            <kbd className={styles.kbdHint}>F</kbd>
          </button>
        )}
      </>
    )
  }

  return (
    <div className={styles.sabhView}>
      <SabhModeTabs value={sabhMode} onChange={handleModeChange} />

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
          selectedGroupId={urlGroupId}
          onGroupChange={handleGroupChange}
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
