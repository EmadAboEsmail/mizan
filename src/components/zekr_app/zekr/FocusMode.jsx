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
    if (document.fullscreenElement || document.webkitFullscreenElement) return true
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
  } catch { }
}

// ✅ تنسيق الوقت mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function FocusMode({ isOpen = true, onClose, onCount, children }) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const isClosingRef = useRef(false)
  const hasTriedFullscreenRef = useRef(false)  // ✅ محاولة fullscreen مرة واحدة
  const startTimeRef = useRef(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)

  // ✅ عدّاد وقت الجلسة
  useEffect(() => {
    if (!isOpen) {
      setSessionTime(0)
      startTimeRef.current = null
      return
    }
    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true
    exitFullscreenSilent()
    onCloseRef.current?.()
  }, [])

  // ✅ Fullscreen monitoring (بدون تغييرات عن نسختك)
  useEffect(() => {
    if (!isOpen) return
    isClosingRef.current = false
    hasTriedFullscreenRef.current = false

    const handleFullscreenChange = () => {
      const active = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(active)
      if (!active && !isClosingRef.current) {
        handleClose()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement))

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [isOpen, handleClose])

  // ✅ Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

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
          wakeLock?.release().catch(() => { })
          wakeLock = null
        }
      } catch { }
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

  // ✅ Tap على أي مكان = تسبيح (بدون اهتزاز هنا — ZekrSabh مسؤول)
  // ✅ Fullscreen-on-tap يشتغل مرة واحدة بس
  const handleTapScreen = async () => {
    if (!isFullscreen && !hasTriedFullscreenRef.current) {
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

      {/* ✅ مؤقّت الجلسة في الركن السفلي */}
      <div className={styles.sessionTime} aria-hidden="true">
        {formatTime(sessionTime)}
      </div>

      <div className={styles.centerContainer}>{children}</div>
    </div>,
    document.body
  )
}

export { attemptFullscreen }
export default FocusMode
