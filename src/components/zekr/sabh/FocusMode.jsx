import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Capacitor } from '@capacitor/core'
import { Clock, Lock, Unlock } from 'lucide-react'
import { useModalBackButton } from '@/hooks/useModalBackButton'
import {
  setNativeImmersiveMode,
  setNativeScreenDim,
  triggerHapticFeedback,
} from '@/utils/haptics.js'
import styles from './FocusMode.module.scss'

const HOLD_TO_UNLOCK_MS = 1050
const HINT_VISIBLE_MS = 2600
const UNLOCK_RING_RADIUS = 30
const UNLOCK_RING_CIRCUMFERENCE = 2 * Math.PI * UNLOCK_RING_RADIUS

const ExitFocusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ExpandIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

async function attemptFullscreen() {
  if (Capacitor.isNativePlatform()) {
    setNativeImmersiveMode(true)
    return true
  }
  const docEl = document.documentElement
  if (!docEl) return false
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      return true
    }
    if (typeof docEl.requestFullscreen === 'function') {
      await docEl.requestFullscreen({ navigationUI: 'hide' })
      return true
    }
    if (typeof docEl.webkitRequestFullscreen === 'function') {
      await docEl.webkitRequestFullscreen()
      return true
    }
    if (typeof docEl.mozRequestFullScreen === 'function') {
      await docEl.mozRequestFullScreen()
      return true
    }
    return false
  } catch (err) {
    console.warn('[Fullscreen] error:', err)
    return false
  }
}

function exitFullscreenSilent() {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    }
  } catch (e) {
    console.log(e)
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function FocusMode({ isOpen = true, onClose, onCount, vibrate = true, children }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const isClosingRef = useRef(false)
  const hasTriedFullscreenRef = useRef(false)
  const startTimeRef = useRef(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)

  // قفل اللمس (شاشة سوداء OLED) — للتسبيح في الجيب بدون لمسات خاطئة
  const [isTouchLocked, setIsTouchLocked] = useState(false)
  const [showLockHint, setShowLockHint] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)

  const hintTimerRef = useRef(null)
  const holdRafRef = useRef(null)
  const holdStartRef = useRef(null)
  const activePointerIdRef = useRef(null)

  // ✅ Adjust during render — لإعادة ضبط الحالة عند الإغلاق
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) {
      setSessionTime(0)
      setIsTouchLocked(false)
      setShowLockHint(false)
      setHoldProgress(0)
    }
  }

  // ✅ Reset startTimeRef + مؤقت الجلسة الحي
  useEffect(() => {
    if (!isOpen) {
      startTimeRef.current = null
      return
    }
    startTimeRef.current = Date.now()
    const id = setInterval(() => {
      if (startTimeRef.current) {
        setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isOpen])

  const isNative = Capacitor.isNativePlatform()

  const flashLockHint = useCallback(() => {
    setShowLockHint(true)
    clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(() => {
      if (!holdStartRef.current) {
        setShowLockHint(false)
      }
    }, HINT_VISIBLE_MS)
  }, [])

  const cancelHold = useCallback((hideSoon = true) => {
    if (holdRafRef.current) {
      cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
    holdStartRef.current = null
    activePointerIdRef.current = null
    setHoldProgress(0)
    if (hideSoon) {
      clearTimeout(hintTimerRef.current)
      hintTimerRef.current = setTimeout(() => {
        setShowLockHint(false)
      }, HINT_VISIBLE_MS)
    }
  }, [])

  const unlockTouch = useCallback(() => {
    cancelHold(false)
    clearTimeout(hintTimerRef.current)
    setShowLockHint(false)
    setIsTouchLocked(false)
    if (isNative) {
      setNativeScreenDim(false)
    }
    if (vibrate) {
      triggerHapticFeedback('medium')
    }
  }, [cancelHold, isNative, vibrate])

  const activateTouchLock = useCallback(
    (e) => {
      e?.stopPropagation()
      setIsTouchLocked(true)
      setHoldProgress(0)
      flashLockHint()
      if (isNative) {
        setNativeScreenDim(true)
      }
      if (vibrate) {
        triggerHapticFeedback('medium')
      }
    },
    [flashLockHint, isNative, vibrate]
  )

  // تنظيف المؤقتات واستعادة الإضاءة عند إغلاق المكون
  useEffect(() => {
    return () => {
      clearTimeout(hintTimerRef.current)
      if (holdRafRef.current) {
        cancelAnimationFrame(holdRafRef.current)
      }
      if (isNative) {
        setNativeScreenDim(false)
      }
    }
  }, [isNative])

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true
    if (isNative) {
      setNativeScreenDim(false)
      setNativeImmersiveMode(false)
    } else {
      exitFullscreenSilent()
    }
    onCloseRef.current?.()
  }, [isNative])

  // عند قفل اللمس يمنع زر الرجوع الخروج بالخطأ ويُظهر تلميح فك القفل فقط
  const handleBackRequest = useCallback(() => {
    if (isTouchLocked) {
      flashLockHint()
      return
    }
    handleClose()
  }, [isTouchLocked, flashLockHint, handleClose])

  useModalBackButton(isOpen, handleBackRequest)

  // ✅ ملء الشاشة الغامر على أندرويد (إخفاء الشريط العلوي والسفلي والهوامش الآمنة بالكامل)
  useEffect(() => {
    if (!isOpen || !isNative) return
    isClosingRef.current = false
    setNativeImmersiveMode(true)
    return () => {
      setNativeScreenDim(false)
      setNativeImmersiveMode(false)
    }
  }, [isOpen, isNative])

  // ✅ Fullscreen monitoring (للويب فقط)
  useEffect(() => {
    if (!isOpen || isNative) return
    isClosingRef.current = false
    hasTriedFullscreenRef.current = false

    const handleFullscreenChange = () => {
      const active = !!(
        document.fullscreenElement || document.webkitFullscreenElement
      )
      setIsFullscreen(active)
      if (!active && !isClosingRef.current) {
        handleClose()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFullscreen(
      !!(document.fullscreenElement || document.webkitFullscreenElement)
    )

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      )
    }
  }, [isOpen, isNative, handleClose])

  // ✅ Escape (يُحجب أثناء قفل اللمس لمنع الخروج غير المقصود)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        if (isTouchLocked) {
          flashLockHint()
        } else {
          handleClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isTouchLocked, flashLockHint, handleClose])

  // ✅ Wake Lock
  useEffect(() => {
    if (!isOpen) return
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
      } catch (e) {
        console.log(e)
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
  }, [isOpen])

  // ✅ Scroll lock
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    const prevOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.overscrollBehavior = prevOverscroll
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleShieldPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (activePointerIdRef.current !== null) return

    activePointerIdRef.current = e.pointerId
    holdStartRef.current = performance.now()
    clearTimeout(hintTimerRef.current)
    setShowLockHint(true)

    const step = (now) => {
      if (!holdStartRef.current) return
      const ratio = Math.min(1, (now - holdStartRef.current) / HOLD_TO_UNLOCK_MS)
      setHoldProgress(ratio)
      if (ratio >= 1) {
        unlockTouch()
        return
      }
      holdRafRef.current = requestAnimationFrame(step)
    }
    holdRafRef.current = requestAnimationFrame(step)
  }

  const handleShieldPointerEnd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (
      activePointerIdRef.current !== null &&
      e.pointerId !== activePointerIdRef.current
    ) {
      return
    }
    cancelHold(true)
  }

  const handleTapScreen = async () => {
    if (isTouchLocked) return
    if (!isNative && !isFullscreen && !hasTriedFullscreenRef.current) {
      hasTriedFullscreenRef.current = true
      await attemptFullscreen()
    }
    if (onCount) {
      onCount()
    }
  }

  const handleFullscreenBtn = async (e) => {
    e.stopPropagation()
    hasTriedFullscreenRef.current = true
    await attemptFullscreen()
  }

  const ringOffset =
    UNLOCK_RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, holdProgress)))

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleTapScreen}
      role="dialog"
      aria-modal="true"
      aria-label="وضع التركيز التام"
    >
      <button
        type="button"
        className={styles.exitBtn}
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
        }}
        aria-label="خروج من وضع التركيز"
        title="خروج (Esc)"
      >
        <ExitFocusIcon />
      </button>

      <div className={styles.topEndActions}>
        {!isNative && !isFullscreen && (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleFullscreenBtn}
            aria-label="ملء الشاشة"
            title="ملء الشاشة"
          >
            <ExpandIcon />
          </button>
        )}

        <button
          type="button"
          className={styles.iconBtn}
          onClick={activateTouchLock}
          aria-label="قفل اللمس (شاشة سوداء للتسبيح بزر الصوت)"
          title="قفل اللمس — شاشة سوداء للتسبيح في الجيب"
        >
          <Lock size={17} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.sessionTime} aria-hidden="true">
        <Clock size={13} strokeWidth={2.2} />
        <span>{formatTime(sessionTime)}</span>
      </div>

      <div className={styles.centerContainer} aria-hidden={isTouchLocked}>
        {children}
      </div>

      {isTouchLocked && (
        <div
          className={styles.oledShield}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onPointerDown={handleShieldPointerDown}
          onPointerUp={handleShieldPointerEnd}
          onPointerCancel={handleShieldPointerEnd}
          onContextMenu={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
          aria-label="الشاشة مقفولة ضد اللمس — اضغط مطوّلاً لفك القفل"
        >
          <div
            className={`${styles.lockPrompt} ${
              showLockHint || holdProgress > 0 ? styles.lockPromptVisible : ''
            }`}
          >
            <div className={styles.unlockRingWrap}>
              <svg
                className={styles.unlockRing}
                viewBox="0 0 72 72"
                aria-hidden="true"
              >
                <circle
                  className={styles.unlockRingTrack}
                  cx="36"
                  cy="36"
                  r={UNLOCK_RING_RADIUS}
                  strokeWidth="3"
                />
                {holdProgress > 0 && (
                  <circle
                    className={styles.unlockRingFill}
                    cx="36"
                    cy="36"
                    r={UNLOCK_RING_RADIUS}
                    strokeWidth="3"
                    strokeDasharray={UNLOCK_RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <span className={styles.lockGlyph} aria-hidden="true">
                {holdProgress > 0.65 ? (
                  <Unlock size={20} strokeWidth={2} />
                ) : (
                  <Lock size={20} strokeWidth={2} />
                )}
              </span>
            </div>

            <p className={styles.lockTitle}>
              {holdProgress > 0
                ? 'استمر بالضغط لفتح القفل...'
                : 'اللمس مقفول · سبّح بزر الصوت'}
            </p>
            <span className={styles.lockSub}>اضغط مطوّلاً لفتح الشاشة</span>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { attemptFullscreen }
export default FocusMode
