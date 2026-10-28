import Modal from './Modal.jsx'
import styles from './ConfirmModal.module.scss'

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
}) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className={styles.message}>{message}</p>

      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          className={`${styles.confirm} ${danger ? styles.danger : ''}`}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmModal
