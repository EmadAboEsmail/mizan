import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './AdhkarFormModal.module.scss'

function AdhkarFormModal({ isOpen, onClose, onConfirm, initial = null }) {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setText(initial?.text ?? '')
      setTarget(initial?.default_target ?? '')
      setError('')
    }
  }, [isOpen, initial])

  const handleConfirm = () => {
    const trimmedText = text.trim()
    if (!trimmedText) {
      setError('الرجاء إدخال نص الذكر')
      return
    }

    let targetValue = null
    if (target !== '') {
      const num = Number(target)
      if (isNaN(num) || num < 1 || num > 10000) {
        setError('الهدف يجب أن يكون بين 1 و 10000')
        return
      }
      targetValue = num
    }

    onConfirm(trimmedText, targetValue)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل الذكر' : 'إضافة ذكر'}
    >
      <label className={styles.label}>
        نص الذكر
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError('')
          }}
          autoFocus
        />
      </label>

      <label className={styles.label}>
        الهدف (اختياري)
        <input
          className={styles.input}
          type="number"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value)
            setError('')
          }}
          placeholder="اتركه فارغًا لذكر بدون هدف"
          min={1}
          max={10000}
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

export default AdhkarFormModal
