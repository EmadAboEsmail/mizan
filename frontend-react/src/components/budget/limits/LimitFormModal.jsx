import { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import styles from './LimitFormModal.module.scss'

function LimitFormModal({
  isOpen,
  onClose,
  onConfirm,
  initial = null,
  categories = [],
  existingLimits = [],
  currentMonth,
}) {
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // التصنيفات المتاحة (مصاريف فقط + مش عليها ميزانية بالفعل)
  const availableCategories = useMemo(() => {
    const usedCatIds = existingLimits
      .filter((l) => l.id !== initial?.id)
      .map((l) => l.category_id)

    return categories.filter(
      (c) => c.type === 'expense' && !usedCatIds.includes(c.id)
    )
  }, [categories, existingLimits, initial])

  useEffect(() => {
    if (!isOpen) return

    if (initial) {
      setCategoryId(initial.category_id || '')
      setAmount(String(initial.amount ?? ''))
    } else {
      setCategoryId(availableCategories[0]?.id || '')
      setAmount('')
    }
    setError('')
    setIsSubmitting(false)
  }, [isOpen, initial, availableCategories])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmed = amount.trim().replace(',', '.')
    const num = Number(trimmed)

    if (!categoryId) {
      setError('الرجاء اختيار تصنيف')
      return
    }
    if (!trimmed) {
      setError('الرجاء إدخال المبلغ')
      return
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('المبلغ يجب أن يكون رقماً موجباً')
      return
    }

    try {
      setIsSubmitting(true)
      const roundedAmount = Math.round(num * 100) / 100

      if (initial) {
        await onConfirm(initial.id, roundedAmount)
      } else {
        await onConfirm({
          category_id: categoryId,
          month: currentMonth,
          amount: roundedAmount,
        })
      }
    } catch (err) {
      setError(err?.message || 'حدث خطأ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل الميزانية' : 'إضافة ميزانية'}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* التصنيف */}
        {initial ? (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>التصنيف</label>
            <div className={styles.selectedCategory}>
              <CategoryIcon category={selectedCategory} size={32} />
              <span>{selectedCategory?.name || 'غير محدد'}</span>
            </div>
          </div>
        ) : (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              التصنيف <span className={styles.required}>*</span>
            </label>

            {availableCategories.length === 0 ? (
              <div className={styles.emptyCategories}>
                كل تصنيفات المصاريف لها ميزانية بالفعل.
                <br />
                عدّل ميزانية موجودة أو أضف تصنيفاً جديداً من الإعدادات.
              </div>
            ) : (
              <div className={styles.categoryGrid}>
                {availableCategories.map((cat) => {
                  const isSelected = cat.id === categoryId
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.catChip} ${isSelected ? styles.catSelected : ''
                        }`}
                      onClick={() => {
                        setCategoryId(cat.id)
                        if (error) setError('')
                      }}
                    >
                      <CategoryIcon category={cat} size={28} />
                      <span className={styles.catName}>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* المبلغ */}
        <div className={styles.fieldGroup}>
          <label htmlFor="limit-amount" className={styles.label}>
            المبلغ الشهري <span className={styles.required}>*</span>
          </label>
          <input
            id="limit-amount"
            type="text"
            inputMode="decimal"
            className={styles.input}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (error) setError('')
            }}
            placeholder="0.00"
            autoFocus
          />
          <span className={styles.hint}>الحد الأقصى للصرف في هذا التصنيف</span>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

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
            disabled={
              isSubmitting || (!initial && availableCategories.length === 0)
            }
          >
            {isSubmitting ? 'جاري الحفظ...' : initial ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default LimitFormModal
