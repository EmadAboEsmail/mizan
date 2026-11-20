import { saveLastWird } from '@/utils/lastWird.js'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Moon, Lock } from 'lucide-react'
import { useCurrentZekrId } from '@/contexts/ZekrDataContext'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import {
  useAdhkarQuery,
  useCountsQuery,
  useTargetsQuery,
  useGroupsQuery,
  useAddClickMutation,
  useResetClickMutation,
  useSetTargetMutation,
  useUpdateGroupItemMutation,
} from '@/queries/zekr'
import ZekrDisplay from '@/components/zekr/sabh/ZekrDisplay.jsx'
import AdhkarSelect from '@/components/zekr/sabh/AdhkarSelect.jsx'
import ActionButtons from '@/components/zekr/sabh/ActionButtons.jsx'
import SabhModeTabs from '@/components/zekr/sabh/SabhModeTabs.jsx'
import GroupModeView from '@/components/zekr/sabh/GroupModeView.jsx'
import PromptModal from '@/components/ui/PromptModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import FocusMode, {
  attemptFullscreen,
} from '@/components/zekr/sabh/FocusMode.jsx'
import { useVibrationEnabled } from '@/hooks/useVibrationEnabled'
import { useVolumeButton } from '@/hooks/useVolumeButton.js'
import { usePocketTasbih } from '@/hooks/usePocketTasbih.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './Sabh.module.scss'

const EMPTY_LIST = []
const EMPTY_MAP = {}

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
          wakeLock?.release().catch(() => {})
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
      wakeLock?.release().catch(() => {})
      wakeLock = null
    }
  }, [active])
}

function ZekrSabh() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ===========================
  // Queries
  // ===========================
  const { data: allAdhkar = EMPTY_LIST } = useAdhkarQuery()
  const { data: counts = EMPTY_MAP } = useCountsQuery()
  const { data: targets = EMPTY_MAP } = useTargetsQuery()
  const { data: groups = EMPTY_LIST } = useGroupsQuery()

  // ===========================
  // UI Context
  // ===========================
  const [currentZekrId, setCurrentZekrId] = useCurrentZekrId(allAdhkar)

  // ===========================
  // Mutations
  // ===========================
  const { mutate: addClickMutate } = useAddClickMutation()
  const { mutate: resetClickFire, mutateAsync: resetClickMutate } =
    useResetClickMutation()
  const { mutateAsync: setTargetMutate } = useSetTargetMutation()
  const { mutateAsync: updateGroupItemMutate } = useUpdateGroupItemMutation()

  const handlePerformClick = useCallback(
    (zekrId) => {
      if (!zekrId) return
      addClickMutate(zekrId)
    },
    [addClickMutate]
  )

  const handleResetForGroupItem = useCallback(
    (zekrId) => {
      if (!zekrId) return
      resetClickFire(zekrId)
    },
    [resetClickFire]
  )

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
  const currentZekr = allAdhkar.find(
    (z) => String(z.id) === String(currentZekrId)
  )
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

  useEffect(() => {
    if (sabhMode === 'group' && groups.some((group) => String(group.id) === urlGroupId && group.items?.length)) saveLastWird(urlGroupId)
    // Normal tasbih must not discard the last group.
  }, [sabhMode, groups, urlGroupId])

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
      const reachesTarget = !!currentTarget && currentCount + 1 === currentTarget
      triggerHapticFeedback(reachesTarget ? 'success' : 'light')
    }
    handlePerformClick(currentZekrId)
  }, [
    currentZekrId,
    currentCount,
    currentTarget,
    handlePerformClick,
    vibrationEnabled,
  ])

  // التسبيح والشاشة مقفلة (أندرويد APK)
  const {
    isPocketSupported,
    isPocketActive,
    isPocketBusy,
    togglePocket,
  } = usePocketTasbih({
    zekrId: currentZekrId,
    zekrText: currentZekr?.text || '',
    count: currentCount,
    target: currentTarget,
    vibrate: vibrationEnabled,
  })

  // التسبيح بأزرار رفع/خفض الصوت في الوضع الحر ووضع التركيز
  useVolumeButton(
    handleNormalClick,
    sabhMode === 'normal' &&
      !!currentZekrId &&
      !isTargetModalOpen &&
      !isResetModalOpen
  )

  const handleConfirmReset = async () => {
    if (!currentZekrId) return
    try {
      await resetClickMutate(currentZekrId)
      if (isFocusMode) {
        setFocusSessionStart(0)
      }
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
    const parsed = newTarget ? parseInt(newTarget, 10) : null
    const numericTarget = Number.isNaN(parsed) ? null : parsed
    try {
      if (targetModalConfig.mode === 'normal') {
        await setTargetMutate({
          zekrId: targetModalConfig.zekrId,
          target: numericTarget,
        })
      } else if (targetModalConfig.mode === 'group') {
        await updateGroupItemMutate({
          groupId: targetModalConfig.groupId,
          itemId: targetModalConfig.itemId,
          updates: { target: numericTarget },
        })
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
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
        el?.isContentEditable
      ) {
        return
      }
      if (isTargetModalOpen || isResetModalOpen) return

      // أثناء وضع التركيز تتولى FocusMode إدارة Escape وحجب اللمس عند القفل
      if (isFocusMode) {
        if (e.code === 'Space' && sabhMode === 'normal') {
          e.preventDefault()
          if (!e.repeat) handleNormalClick()
        }
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
          <div className={styles.emptyIcon} aria-hidden="true">
            <TasbihIcon size={28} />
          </div>
          <p className={styles.empty}>لا توجد أذكار مضافة حالياً.</p>
          <button
            type="button"
            className={styles.addFirstBtn}
            onClick={() => navigate('/zekr/manage')}
          >
            أضف ذكرك الأول
          </button>
        </div>
      )
    }

    const currentIdx = allAdhkar.findIndex(
      (z) => String(z.id) === String(currentZekr.id)
    )
    const canSwipePrev = currentIdx > 0
    const canSwipeNext =
      currentIdx >= 0 && currentIdx < allAdhkar.length - 1

    return (
      <>
        {!isFocusMode && (
          <AdhkarSelect
            adhkar={allAdhkar}
            counts={counts}
            targets={targets}
            value={currentZekrId}
            onChange={handleZekrChange}
          />
        )}

        <ZekrDisplay
          key={currentZekr.id}
          zekrText={currentZekr.text}
          virtue={currentZekr.virtue}
          count={currentCount}
          sessionCount={sessionCount}
          target={currentTarget}
          onClickCount={() =>
            handleOpenNormalTargetModal(currentZekrId, currentTarget)
          }
          canSwipePrev={canSwipePrev}
          canSwipeNext={canSwipeNext}
          onSwipePrev={
            canSwipePrev
              ? () => handleZekrChange(allAdhkar[currentIdx - 1].id)
              : undefined
          }
          onSwipeNext={
            canSwipeNext
              ? () => handleZekrChange(allAdhkar[currentIdx + 1].id)
              : undefined
          }
          isComplete={isComplete}
          isFocusMode={isFocusMode}
        />

        {!isFocusMode && isComplete && canSwipeNext && (
          <button type="button" className={styles.focusBtn} onClick={() => handleZekrChange(allAdhkar[currentIdx + 1].id)}>
            الذِكر التالي
          </button>
        )}

        <div className={isFocusMode ? undefined : styles.thumbZone}>
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
            extraAction={
              !isFocusMode ? (
                <>
                  <button
                    type="button"
                    className={styles.focusBtn}
                    onClick={handleEnterFocusMode}
                    title="وضع التركيز بدون مشتتات (F)"
                  >
                    <Moon size={15} strokeWidth={2.1} aria-hidden="true" />
                    <span>وضع التركيز</span>
                    <kbd className={styles.kbdHint}>F</kbd>
                  </button>

                  {isPocketSupported && (
                    <button
                      type="button"
                      className={`${styles.pocketBtn} ${
                        isPocketActive ? styles.pocketBtnActive : ''
                      }`}
                      onClick={togglePocket}
                      disabled={isPocketBusy}
                      aria-pressed={isPocketActive}
                      title={
                        isPocketActive
                          ? 'إيقاف التسبيح والشاشة مقفلة'
                          : 'تفعيل التسبيح بزر الصوت والشاشة مقفلة'
                      }
                    >
                      {isPocketActive ? (
                        <span className={styles.liveDot} aria-hidden="true" />
                      ) : (
                        <Lock size={15} strokeWidth={2.1} aria-hidden="true" />
                      )}
                      <span>
                        {isPocketActive ? 'في القفل · إيقاف' : 'في القفل'}
                      </span>
                    </button>
                  )}
                </>
              ) : null
            }
          />
        </div>
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
              onClose={handleExitFocusMode}
              onCount={handleNormalClick}
              vibrate={vibrationEnabled}
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
          onResetClick={handleResetForGroupItem}
          onSetTarget={handleOpenGroupTargetModal}
          isModalOpen={isTargetModalOpen || isResetModalOpen}
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
            : 'تحديد هدف التسبيح'
        }
        defaultValue={targetModalConfig?.currentValue ?? ''}
        type="number"
        min={1}
        max={10000}
        presets={[33, 99, 100, 500, 1000]}
        allowClear
        clearLabel="بلا هدف"
        placeholder="أو اكتب عدداً (1 - 10000)"
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
