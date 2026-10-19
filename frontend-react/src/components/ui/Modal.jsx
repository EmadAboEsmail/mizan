import styles from './Modal.module.scss'
// import { useModalBackButton } from '@/hooks/useModalBackButton'

function Modal({ isOpen, onClose, title, children }) {
  // useModalBackButton(isOpen, onClose)

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
