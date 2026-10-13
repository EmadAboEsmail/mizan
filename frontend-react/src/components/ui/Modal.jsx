import { useEffect } from 'react'
import styles from './Modal.module.scss'

function Modal({ isOpen, onClose, title, children }) {
  // إغلاق بـ Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.code === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // إغلاق عند الضغط خارج الصندوق
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
