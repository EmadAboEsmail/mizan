import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './FocusMode.module.scss'

function FocusMode({ isOpen = true, onClose, children }) {
  const wakeLockRef = useRef(null)

  // 1. زر الهروب (Escape) للخروج
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.code === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 2. منع scroll الصفحة في الخلفية
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // 3. منع الشاشة من الإغلاق أثناء وضع التركيز (Wake Lock API)
  useEffect(() => {
    if (!isOpen) return

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        // بعض المتصفحات ترفض الطلب لو البطارية منخفضة جداً
        console.warn('Wake Lock غير متاح:', err)
      }
    }

    requestWakeLock()

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => { })
        wakeLockRef.current = null
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  // استخدام createPortal لضمان ظهور الـ Overlay فوق كل شيء في الصفحة
  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="وضع التركيز"
    >
      {/* شريط أدوات علوي */}
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="خروج من وضع التركيز"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default FocusMode
