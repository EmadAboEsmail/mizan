import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './FocusMode.module.scss'

const ExitFocusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ExpandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

async function attemptFullscreen() {
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
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { })
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    }
  } catch (err) {
    // تجاهل
  }
}

function FocusMode({ isOpen = true, onClose, onCount, children }) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const isClosingRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ═══════════════════════════════════════
  // ✅ handleClose — الطريقة الوحيدة للخروج
  // بيتنادى من: زر Exit, Escape, fullscreenchange (ESC)
  // ═══════════════════════════════════════
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true

    // الخروج من fullscreen
    exitFullscreenSilent()

    // ثم استدعاء onClose
    onCloseRef.current?.()
  }, [])

  // ═══════════════════════════════════════
  // 1. Fullscreen monitoring (بدون exitFullscreen في cleanup!)
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isOpen) return

    isClosingRef.current = false

    const handleFullscreenChange = () => {
      const active = !!(
        document.fullscreenElement || document.webkitFullscreenElement
      )
      setIsFullscreen(active)

      // لو المستخدم خرج من fullscreen بـ ESC → نقفل FocusMode
      if (!active && !isClosingRef.current) {
        handleClose()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    setIsFullscreen(
      !!(document.fullscreenElement || document.webkitFullscreenElement)
    )

    // ⚠️ مفيش exitFullscreen هنا!
    // الـ exitFullscreen بيتنادى بس في handleClose
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      )
    }
  }, [isOpen, handleClose])

  // ═══════════════════════════════════════
  // 2. Escape key
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // ═══════════════════════════════════════
  // 3. Wake Lock
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isOpen) return
    let wakeLock = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        // تجاهل
      }
    }

    requestWakeLock()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (wakeLock) wakeLock.release().catch(() => { })
    }
  }, [isOpen])

  // ═══════════════════════════════════════
  // 4. قفل التمرير
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    const originalOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.overscrollBehavior = originalOverscroll
    }
  }, [isOpen])

  if (!isOpen) return null

  // ═══════════════════════════════════════
  // 5. Tap handler
  // ═══════════════════════════════════════
  const handleTapScreen = async () => {
    if (!isFullscreen) {
      await attemptFullscreen()
    }
    if (onCount) {
      onCount()
      if ('vibrate' in navigator) {
        navigator.vibrate(15)
      }
    }
  }

  // ═══════════════════════════════════════
  // 6. زر Fullscreen اليدوي
  // ═══════════════════════════════════════
  const handleFullscreenBtn = async (e) => {
    e.stopPropagation()
    await attemptFullscreen()
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleTapScreen}
      role="dialog"
      aria-modal="true"
      aria-label="وضع التركيز التام"
    >
      {/* زر الخروج */}
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

      {/* زر Fullscreen — يظهر لو مش in fullscreen */}
      {!isFullscreen && (
        <button
          type="button"
          className={styles.fullscreenBtn}
          onClick={handleFullscreenBtn}
          aria-label="ملء الشاشة"
          title="ملء الشاشة"
        >
          <ExpandIcon />
        </button>
      )}

      {/* محتوى الشاشة */}
      <div className={styles.centerContainer}>{children}</div>
    </div>,
    document.body
  )
}

export { attemptFullscreen }
export default FocusMode
