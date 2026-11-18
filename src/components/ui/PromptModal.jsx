import { useState } from 'react'
import { X } from 'lucide-react'
import Modal from './Modal.jsx'
import styles from './PromptModal.module.scss'

function PromptForm({
  onClose,
  onConfirm,
  defaultValue = '',
  type = 'text',
  placeholder = '',
  min,
  max,
  presets = null,
  allowClear = false,
  clearLabel = 'بلا هدف',
}) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState('')

  const handleConfirm = (overrideValue) => {
    const raw = overrideValue !== undefined ? overrideValue : value
    const trimmed = String(raw).trim()

    if (trimmed === '') {
      if (allowClear) {
        onConfirm(null)
        return
      }
      setError('الرجاء إدخال قيمة')
      return
    }

    if (type === 'number') {
      const num = Number(trimmed)
      if (Number.isNaN(num)) {
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm()
  }

  return (
    <>
      {Array.isArray(presets) && presets.length > 0 && (
        <div className={styles.presets} role="group" aria-label="قيم سريعة">
          {presets.map((preset) => {
            const active = String(value) === String(preset)
            return (
              <button
                key={preset}
                type="button"
                className={`${styles.presetChip} ${
                  active ? styles.presetChipActive : ''
                }`}
                onClick={() => {
                  setValue(String(preset))
                  setError('')
                  handleConfirm(preset)
                }}
              >
                {Number(preset).toLocaleString('en')}
              </button>
            )
          })}
          {allowClear && defaultValue !== '' && defaultValue !== null && (
            <button
              type="button"
              className={`${styles.presetChip} ${styles.clearChip}`}
              onClick={() => onConfirm(null)}
            >
              <X size={13} strokeWidth={2.4} aria-hidden="true" />
              <span>{clearLabel}</span>
            </button>
          )}
        </div>
      )}

      <input
        className={styles.input}
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
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
        <button type="button" className={styles.cancel} onClick={onClose}>
          إلغاء
        </button>
        <button
          type="button"
          className={styles.confirm}
          onClick={() => handleConfirm()}
        >
          تأكيد
        </button>
      </div>
    </>
  )
}

function PromptModal({
  isOpen,
  onClose,
  title,
  variant = 'sheet',
  ...formProps
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant={variant}>
      {isOpen && <PromptForm onClose={onClose} {...formProps} />}
    </Modal>
  )
}

export default PromptModal
