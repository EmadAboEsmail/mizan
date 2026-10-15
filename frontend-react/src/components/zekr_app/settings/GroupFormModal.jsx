import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './GroupFormModal.module.scss'

function GroupFormModal({ isOpen, onClose, onConfirm, initial = null }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setError('')
    }
  }, [isOpen, initial])

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('الرجاء إدخال اسم المجموعة')
      return
    }
    onConfirm(trimmed, description.trim() || null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل المجموعة' : 'إضافة مجموعة'}
    >
      <label className={styles.label}>
        الاسم
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </label>

      <label className={styles.label}>
        الوصف (اختياري)
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </label>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={onClose}>
          إلغاء
        </button>
        <button className={styles.confirm} onClick={handleConfirm}>
          {initial ? 'حفظ' : 'إضافة'}
        </button>
      </div>
    </Modal>
  )
}

export default GroupFormModal
