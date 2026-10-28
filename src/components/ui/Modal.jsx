import { useEffect } from 'react'
import styles from './Modal.module.scss'
import { useModalBackButton } from '@/hooks/useModalBackButton'

let openModalsCount = 0
let originalBodyStyles = null

function lockBodyScroll() {
  openModalsCount++
  if (openModalsCount === 1) {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    originalBodyStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollBarWidth}px`
    document.body.style.position = 'fixed'
    document.body.style.top = `-${window.scrollY}px`
    document.body.style.width = '100%'
  }
}

function unlockBodyScroll() {
  openModalsCount = Math.max(0, openModalsCount - 1)
  if (openModalsCount === 0 && originalBodyStyles) {
    const scrollY = document.body.style.top
    document.body.style.overflow = originalBodyStyles.overflow
    document.body.style.paddingRight = originalBodyStyles.paddingRight
    document.body.style.position = originalBodyStyles.position
    document.body.style.top = originalBodyStyles.top
    document.body.style.width = originalBodyStyles.width
    originalBodyStyles = null
    window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
  }
}

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = 'center',
  disableBackButton = false,
  hideCloseButton = false,
}) {
  useModalBackButton(isOpen && !disableBackButton, onClose)

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
      className={`${styles.overlay} ${styles[variant]}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'نافذة'}
    >
      <div className={`${styles.modal} ${styles[variant]}`}>
        {variant === 'sheet' && (
          <div className={styles.grabber} aria-hidden="true" />
        )}

        {/* ✅ زر X — ظاهر دائماً إلا لو hideCloseButton */}
        {!hideCloseButton && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
          >
            <CloseIcon />
          </button>
        )}

        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
