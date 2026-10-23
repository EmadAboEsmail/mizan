import { useEffect } from 'react'
import styles from './Modal.module.scss'
import { useModalBackButton } from '@/hooks/useModalBackButton'

// ✅ مرجع عالمي لعدد المودالز المفتوحة
let openModalsCount = 0
let originalBodyStyles = null

function lockBodyScroll() {
  openModalsCount++

  // أول مودال يفتح → نحفظ الحالة الأصلية ونقفل
  if (openModalsCount === 1) {
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth

    originalBodyStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }

    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollBarWidth}px`
    // ✅ منع iOS bounce
    document.body.style.position = 'fixed'
    document.body.style.top = `-${window.scrollY}px`
    document.body.style.width = '100%'
  }
}

function unlockBodyScroll() {
  openModalsCount = Math.max(0, openModalsCount - 1)

  // آخر مودال اتقفل → نرجع الحالة الأصلية
  if (openModalsCount === 0 && originalBodyStyles) {
    const scrollY = document.body.style.top
    document.body.style.overflow = originalBodyStyles.overflow
    document.body.style.paddingRight = originalBodyStyles.paddingRight
    document.body.style.position = originalBodyStyles.position
    document.body.style.top = originalBodyStyles.top
    document.body.style.width = originalBodyStyles.width
    originalBodyStyles = null

    // ✅ إرجاع الـ scroll position
    window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
  }
}

function Modal({ isOpen, onClose, title, children }) {
  useModalBackButton(isOpen, onClose)

  // ✅ قفل scroll الـ body لما المودال يفتح
  useEffect(() => {
    if (!isOpen) return

    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'نافذة'}
    >
      <div className={styles.modal}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
