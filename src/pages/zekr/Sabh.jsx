import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useZekrData } from '@/contexts/ZekrDataContext'
import ZekrDisplay from '@/components/zekr/sabh/ZekrDisplay.jsx'
import AdhkarSelect from '@/components/zekr/sabh/AdhkarSelect.jsx'
import ActionButtons from '@/components/zekr/sabh/ActionButtons.jsx'
import SabhModeTabs from '@/components/zekr/sabh/SabhModeTabs.jsx'
import GroupModeView from '@/components/zekr/sabh/GroupModeView.jsx'
import PromptModal from '@/components/ui/PromptModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import FocusMode, { attemptFullscreen } from '@/components/zekr/sabh/FocusMode.jsx'
import { useVibrationEnabled } from '@/hooks/useVibrationEnabled'
import { triggerHapticFeedback } from '@/utils/haptics.js' // ✅ تم نقلها للأعلى
import styles from './Sabh.module.scss'

// Wake Lock Hook — يمنع إطفاء الشاشة في وضع التركيز
function useWakeLock(active) {
  useEffect(() => {
    if (!active) return
    if (!('wakeLock' in navigator)) return

    let wakeLock = null
    let cancelled = false

    const acquire = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          wakeLock?.release().catch(() => { })
          wakeLock = null
        }
      } catch (err) {
        console.warn('[WakeLock] Failed:', err)
      }
    }

    acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLock && !cancelled) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      wakeLock?.release().catch(() => { })
      wakeLock = null
    }
  }, [active])
}

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
  // UI-only state
  // ===========================
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [targetModalConfig, setTargetModalConfig] = useState(null)
  const [focusSessionStart, setFocusSessionStart] = useState(null)

  const vibrationEnabled = useVibrationEnabled()
  useWakeLock(isFocusMode)

  // ===========================
  // القيم المشتقة
  // ===========================
  const currentZekr = allAdhkar.find((z) => String(z.id) === String(currentZekrId))
  const currentCount = (currentZekrId && counts[currentZekrId]) || 0
  const currentTarget = currentZekr
    ? targets[currentZekr.id] ?? currentZekr.default_target ?? null
    : null
  const isComplete = !!currentTarget && currentCount >= currentTarget

  const sessionCount =
    focusSessionStart !== null
      ? Math.max(0, currentCount - focusSessionStart)
      : 0

  // ===========================
  // URL → Context sync
  // ===========================
  const urlZekr = urlZekrId
    ? allAdhkar.find((z) => String(z.id) === urlZekrId)
    : undefined

  const zekrInitRef = useRef(false)

  useEffect(() => {
    if (zekrInitRef.current) return
    if (allAdhkar.length === 0) return
    if (urlZekrId) {
      zekrInitRef.current = true
      return
    }
    if (!currentZekrId) return
    zekrInitRef.current = true
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('zekr', String(currentZekrId))
        return next
      },
      { replace: true }
    )
  }, [allAdhkar.length, urlZekrId, currentZekrId, setSearchParams])

  useEffect(() => {
    if (!urlZekr) return
    if (String(currentZekrId) === String(urlZekr.id)) return
    setCurrentZekrId(urlZekr.id)
  }, [urlZekr, currentZekrId, setCurrentZekrId])

  useEffect(() => {
    if (!urlZekrId) return
    if (allAdhkar.length === 0) return
    if (urlZekr) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('zekr')
        return next
      },
      { replace: true }
    )
  }, [urlZekrId, urlZekr, allAdhkar.length, setSearchParams])

  const handleZekrChange = useCallback(
    (newId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('zekr', String(newId))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // ===========================
  // Mode & Group sync
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

  useEffect(() => {
    if (sabhMode !== 'group') return
    if (groups.length === 0) return
    if (urlGroupId && groups.some((g) => String(g.id) === urlGroupId)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('group', String(groups[0].id))
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
          next.set('group', String(newGroupId))
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
    if (vibrationEnabled) {
      triggerHapticFeedback('light')
    }
    handlePerformClick(currentZekrId)
  }, [currentZekrId, handlePerformClick, vibrationEnabled])

  // ✅ تم نقل هذا الـ useEffect ليكون بعد تعريف handleNormalClick
  // استقبال أحداث أزرار الصوت من Native
  useEffect(() => {
    const handleVolumeButton = (event) => {
      // ❌ لا تعدّ أثناء فتح أي modal
      if (isTargetModalOpen || isResetModalOpen) return

      // ❌ لا تعدّ في وضع المجموعات (له منطقه الخاص في GroupModeView)
      if (sabhMode !== 'normal') return

      // ❌ لا تعدّ لو مفيش ذكر مختار
      if (!currentZekrId) return

      try {
        const data = JSON.parse(event.detail || '{}')
        if (data.keyCode === 24 || data.keyCode === 25) {
          // keyCode 24 = VOLUME_UP، 25 = VOLUME_DOWN
          handleNormalClick()
        }
      } catch (err) {
        console.warn('[VolumeButton] Invalid event payload:', err)
      }
    }

    window.addEventListener('volumeButtonPress', handleVolumeButton)
    return () => window.removeEventListener('volumeButtonPress', handleVolumeButton)
  }, [handleNormalClick, isTargetModalOpen, isResetModalOpen, sabhMode, currentZekrId])
  const handleConfirmReset = async () => {
    if (!currentZekrId) return
    await handleResetForZekr(currentZekrId)
    if (isFocusMode) {
      setFocusSessionStart(0)
    }
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
    const parsed = newTarget ? parseInt(newTarget, 10) : null
    const numericTarget = Number.isNaN(parsed) ? null : parsed
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
    try {
      await attemptFullscreen()
    } catch (err) {
      console.warn('[Focus] Fullscreen failed:', err)
    }
    setFocusSessionStart(currentZekrId ? counts[currentZekrId] || 0 : 0)
    setIsFocusMode(true)
  }, [currentZekrId, counts])

  const handleExitFocusMode = useCallback(() => {
    setIsFocusMode(false)
    setFocusSessionStart(null)
  }, [])

  // ===========================
  // Keyboard shortcuts
  // ===========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const el = document.activeElement
      const tag = el?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || el?.isContentEditable) {
        return
      }
      if (isTargetModalOpen || isResetModalOpen) return

      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault()
        handleExitFocusMode()
        return
      }

      if (e.code === 'Space' && sabhMode === 'normal') {
        if (el?.getAttribute?.('role') === 'tab') {
          el.blur()
        } else if (tag === 'BUTTON' || tag === 'A') {
          return
        }
        e.preventDefault()
        if (e.repeat) return
        handleNormalClick()
        return
      }

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
    handleExitFocusMode,
    currentZekr,
    currentCount,
  ])

  const renderNormalSabhContent = () => {
    if (!currentZekr) {
      return (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>📿</div>
          <p className={styles.empty}>لا توجد أذكار مضافة حالياً.</p>
          <button
            type="button"
            className={styles.addFirstBtn}
            onClick={() => navigate('/zekr/settings')}
          >
            أضف ذكرك الأول
          </button>
        </div>
      )
    }

    return (
      <>
        <ZekrDisplay
          key={currentZekr.id}
          zekrText={currentZekr.text}
          count={currentCount}
          sessionCount={sessionCount}
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
          showReset={!isFocusMode}
          count={currentCount}
          target={currentTarget}
          onClick={handleNormalClick}
          progress={
            currentTarget
              ? Math.min((currentCount / currentTarget) * 100, 100)
              : 0
          }
          isComplete={isComplete}
          isFocusMode={isFocusMode}
        />

        {!isFocusMode && (
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
            <FocusMode onClose={handleExitFocusMode} onCount={handleNormalClick}>
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
