import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './GroupFormModal.module.scss'

// اقتراحات شائعة للمجموعات لتسهيل الإدخال السريع
const SUGGESTED_GROUPS = [
  'أذكار الصباح',
  'أذكار المساء',
  'أذكار النوم',
  'أذكار بعد الصلاة',
  'الورد اليومي',
]

function GroupFormModal({ isOpen, onClose, onConfirm, initial = null }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('الرجاء إدخال اسم المجموعة')
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(trimmedName, description.trim() || null)
    } catch (err) {
      setError(err?.message || 'فشل حفظ المجموعة، يرجى المحاولة ثانية')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectSuggestion = (suggestedName) => {
    setName(suggestedName)
    if (error) setError('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* حقل اسم المجموعة */}
        <div className={styles.fieldGroup}>
          <label htmlFor="group-name" className={styles.label}>
            <span>اسم المجموعة</span>
            <span className={styles.required}>*</span>
          </label>

          {/* اقتراحات سريعة (تظهر فقط عند إضافة مجموعة جديدة) */}
          {!initial && (
            <div className={styles.suggestions}>
              {SUGGESTED_GROUPS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.suggestionChip} ${name === item ? styles.activeChip : ''}`}
                  onClick={() => handleSelectSuggestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          <input
            id="group-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="مثال: أذكار الصباح..."
            maxLength={50}
            autoFocus
          />
        </div>

        {/* حقل وصف المجموعة */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="group-desc" className={styles.label}>
              الوصف
            </label>
            <span className={styles.optionalHint}>اختياري</span>
          </div>

          <textarea
            id="group-desc"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر لمحتوى المجموعة أو وقت قراءتها..."
            rows={2}
            maxLength={150}
          />
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className={styles.error} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* أزرار الإلغاء والحفظ */}
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

export default GroupFormModal
