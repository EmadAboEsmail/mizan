import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import styles from './PromptModal.module.scss'

function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  defaultValue = '',
  type = 'text',
  placeholder = '',
  min,
  max,
}) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState('')

  // إعادة تعيين عند الفتح
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setError('')
    }
  }, [isOpen, defaultValue])

  const handleConfirm = () => {
    const trimmed = String(value).trim()

    if (trimmed === '') {
      setError('الرجاء إدخال قيمة')
      return
    }

    if (type === 'number') {
      const num = Number(trimmed)
      if (isNaN(num)) {
        setError('الرجاء إدخال رقم صحيح')
        return
      }
      if (min !== undefined && num < min) {
        setError(`القيمة يجب أن تكون ${min} على الأقل`)
        return
      }
      if (max !== undefined && num > max) {
        setError(`القيمة يجب أن تكون ${max} على الأكثر`)
        return
      }
      onConfirm(num)
    } else {
      onConfirm(trimmed)
    }
  }

  // Enter للحفظ
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError('')
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        min={min}
        max={max}
      />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={onClose}>
          إلغاء
        </button>
        <button className={styles.confirm} onClick={handleConfirm}>
          تأكيد
        </button>
      </div>
    </Modal>
  )
}

export default PromptModal
