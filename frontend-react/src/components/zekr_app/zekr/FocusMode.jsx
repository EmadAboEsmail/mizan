import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './FocusMode.module.scss'

const ExitFocusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function FocusMode({ isOpen = true, onClose, onCount, children }) {
  const wakeLockRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // 1. ملء الشاشة الكامل
  // 3. منع انطفاء الشاشة + إعادة الطلب لو الـ tab رجع visible
  useEffect(() => {
    if (!isOpen) return

    let wakeLock = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        // المتصفح ممكن يرفض — مش مشكلة
      }
    }

    requestWakeLock()

    // ✅ لما الـ tab يرجع visible، نطلب wakeLock تاني (المتصفح بيفكّه لما الـ tab يروح background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) {
        wakeLock.release().catch(() => { })
        wakeLock = null
      }
    }
  }, [isOpen])  // 2. زر Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 3. منع انطفاء الشاشة
  useEffect(() => {
    if (!isOpen) return
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch (err) { }
    }
    requestWakeLock()
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => { })
        wakeLockRef.current = null
      }
    }
  }, [isOpen])

  // 4. قفل التمرير
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  // ✅ التسبيح بالنقر على أي مكان في الشاشة + اهتزاز خفيف
  const handleTapScreen = (e) => {
    if (onCount) {
      onCount()
      if ('vibrate' in navigator) {
        navigator.vibrate(15) // اهتزاز خفيف جداً يؤكد التسبيحة
      }
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleTapScreen} // ✅ النقر في أي مكان بالشاشة يحسب تسبيحة
      role="dialog"
      aria-modal="true"
      aria-label="وضع التركيز التام"
    >
      {/* زر الخروج: نوقف انتشار الحدث stopPropagation حتى لا يحسب تسبيحة عند الخروج */}
      <button
        type="button"
        className={styles.exitBtn}
        onClick={(e) => {
          e.stopPropagation()
          onCloseRef.current?.()
        }}
        aria-label="خروج من وضع التركيز"
        title="خروج من وضع التركيز"
      >
        <ExitFocusIcon />
      </button>

      {/* محتوى الشاشة */}
      <div className={styles.centerContainer}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default FocusMode
