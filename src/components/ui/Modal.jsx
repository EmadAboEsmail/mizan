import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useModalBackButton } from '@/hooks/useModalBackButton'
import styles from './Modal.module.scss'

let openModalsCount = 0
let originalOverflow = ''
let originalOverscroll = ''

function lockBodyScroll() {
  openModalsCount++
  if (openModalsCount === 1) {
    originalOverflow = document.body.style.overflow
    originalOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'contain'
  }
}

function unlockBodyScroll() {
  openModalsCount = Math.max(0, openModalsCount - 1)
  if (openModalsCount === 0) {
    document.body.style.overflow = originalOverflow
    document.body.style.overscrollBehavior = originalOverscroll
  }
}

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

        {(title || !hideCloseButton) && (
          <div className={styles.header}>
            {title ? <h3 className={styles.title}>{title}</h3> : <span />}
            {!hideCloseButton && (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="إغلاق"
                title="إغلاق"
              >
                <X size={18} strokeWidth={2.3} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
