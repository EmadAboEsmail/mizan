import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './CategoryFormModal.module.scss'

const PRESET_ICONS = ['🍔', '🚗', '🏠', '💼', '🎁', '📱', '💊', '🎮', '🛍️', '📚', '💰', '🌾', '🪨', '❓']
const PRESET_COLORS = ['#059669', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#64748b']

function CategoryFormModal({ isOpen, onClose, onConfirm, initial = null, defaultType = 'expense' }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('#059669')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (initial) {
      setName(initial.name || '')
      setType(initial.type || 'expense')
      setIcon(initial.icon || '📦')
      setColor(initial.color || '#059669')
    } else {
      setName('')
      setType(defaultType)
      setIcon('📦')
      setColor('#059669')
    }
    setError('')
    setSubmitting(false)
  }, [isOpen, initial, defaultType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('الرجاء إدخال اسم التصنيف')
      return
    }

    try {
      setSubmitting(true)
      if (initial) {
        await onConfirm(initial.id, {
          name: name.trim(),
          icon,
          color,
        })
      } else {
        await onConfirm({
          name: name.trim(),
          type,
          icon,
          color,
          sort_order: 0,
        })
      }
    } catch (err) {
      setError(err?.message || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
      variant="sheet"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {!initial && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>النوع</label>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === 'expense' ? styles.typeExpense : ''
                  }`}
                onClick={() => setType('expense')}
              >
                💸 مصروف
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === 'income' ? styles.typeIncome : ''
                  }`}
                onClick={() => setType('income')}
              >
                💰 دخل
              </button>
            </div>
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="cat-name" className={styles.label}>
            الاسم <span className={styles.required}>*</span>
          </label>
          <input
            id="cat-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="مثال: طعام، راتب..."
            maxLength={50}
            autoFocus
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>الأيقونة</label>
          <div className={styles.iconGrid}>
            {PRESET_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`${styles.iconBtn} ${icon === ic ? styles.selected : ''}`}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>اللون</label>
          <div className={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.colorBtn} ${color === c ? styles.selected : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`لون ${c}`}
              >
                {color === c && '✓'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            ⚠️ {error}
          </div>
        )}

        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className={styles.confirm}
            disabled={submitting}
          >
            {submitting ? 'جاري الحفظ...' : initial ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryFormModal
