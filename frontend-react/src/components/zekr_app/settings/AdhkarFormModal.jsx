import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './AdhkarFormModal.module.scss'

// الأهداف الأكثر شيوعاً في الأذكار
const PRESET_TARGETS = [
  { label: 'مفتوح (بدون)', value: '' },
  { label: '33', value: '33' },
  { label: '100', value: '100' },
  { label: '1000', value: '1000' },
]

function AdhkarFormModal({ isOpen, onClose, onConfirm, initial = null }) {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setText(initial?.text ?? '')
      setTarget(initial?.default_target ? String(initial.default_target) : '')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedText = text.trim()

    if (!trimmedText) {
      setError('الرجاء إدخال نص الذكر')
      return
    }

    let targetValue = null
    if (target !== '') {
      const num = Number(target)
      // التأكد من أنه عدد صحيح ضمن النطاق
      if (!Number.isInteger(num) || num < 1 || num > 10000) {
        setError('الهدف يجب أن يكون عدداً صحيحاً بين 1 و 10,000')
        return
      }
      targetValue = num
    }

    try {
      setIsSubmitting(true)
      await onConfirm(trimmedText, targetValue)
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل الذكر' : 'إضافة ذكر جديد'}
      variant="sheet"
    >      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* حقل نص الذكر */}
        <div className={styles.fieldGroup}>
          <label htmlFor="zekr-text" className={styles.label}>
            <span>نص الذكر أو الدعاء</span>
            <span className={styles.required}>*</span>
          </label>
          <textarea
            id="zekr-text"
            className={styles.textarea}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError('')
            }}
            placeholder="اكتب الذكر هنا (مثال: أستغفر الله العظيم وأتوب إليه)..."
            rows={3}
            autoFocus
          />
        </div>

        {/* حقل الهدف */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="zekr-target" className={styles.label}>
              الهدف المطلوب
            </label>
            <span className={styles.optionalHint}>اختياري</span>
          </div>

          {/* أزرار سريعة لاختيار الهدف الشائع بنقرة واحدة */}
          <div className={styles.presetChips}>
            {PRESET_TARGETS.map((preset) => {
              const isSelected = String(target) === String(preset.value)
              return (
                <button
                  key={preset.label}
                  type="button"
                  className={`${styles.presetBtn} ${isSelected ? styles.activePreset : ''}`}
                  onClick={() => {
                    setTarget(preset.value)
                    if (error) setError('')
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <input
            id="zekr-target"
            className={styles.input}
            type="number"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value)
              if (error) setError('')
            }}
            placeholder="أو اكتب رقمًا مخصصًا (مثال: 70)"
            min={1}
            max={10000}
          />
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className={styles.error} role="alert">
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className={styles.confirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الحفظ...' : initial ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AdhkarFormModal
