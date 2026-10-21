import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import CategoryIcon from './CategoryIcon.jsx'
import styles from './TransactionFormModal.module.scss'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function TransactionFormModal({
  isOpen,
  onClose,
  onConfirm,
  initial = null,
  categories = [],
}) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [details, setDetails] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // إعادة تعبئة الحقول عند الفتح
  useEffect(() => {
    if (!isOpen) return
    if (initial) {
      setType(initial.type || 'expense')
      setAmount(String(initial.amount ?? ''))
      setCategoryId(initial.category_id || '')
      setDate(initial.date || todayISO())
      setDetails(initial.details || '')
      setDescription(initial.description || '')
    } else {
      setType('expense')
      setAmount('')
      setCategoryId('')
      setDate(todayISO())
      setDetails('')
      setDescription('')
    }
    setError('')
    setIsSubmitting(false)
  }, [isOpen, initial])

  // التصنيفات المفلترة حسب النوع
  const filteredCategories = categories.filter((c) => c.type === type)

  // لو النوع اتغير والتصنيف الحالي مش متوافق، نختار الأول
  useEffect(() => {
    if (!isOpen) return
    if (filteredCategories.length === 0) return
    if (!filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isOpen, categories.length])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedAmount = amount.trim().replace(',', '.')
    const numAmount = Number(trimmedAmount)

    if (!trimmedAmount) {
      setError('الرجاء إدخال المبلغ')
      return
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError('المبلغ يجب أن يكون رقماً موجباً')
      return
    }
    if (!categoryId) {
      setError('الرجاء اختيار تصنيف')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('تاريخ غير صالح')
      return
    }

    const payload = {
      amount: Math.round(numAmount * 100) / 100,
      type,
      category_id: categoryId,
      date,
      details: details.trim() || null,
      description: description.trim() || null,
    }

    try {
      setIsSubmitting(true)
      await onConfirm(payload)
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل المعاملة' : 'إضافة معاملة'}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* نوع المعاملة */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>النوع</label>
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'expense' ? styles.typeActiveExpense : ''
                }`}
              onClick={() => setType('expense')}
            >
              💸 مصروف
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'income' ? styles.typeActiveIncome : ''
                }`}
              onClick={() => setType('income')}
            >
              💰 دخل
            </button>
          </div>
        </div>

        {/* المبلغ */}
        <div className={styles.fieldGroup}>
          <label htmlFor="txn-amount" className={styles.label}>
            المبلغ <span className={styles.required}>*</span>
          </label>
          <input
            id="txn-amount"
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
        </div>

        {/* التصنيف */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            التصنيف <span className={styles.required}>*</span>
          </label>
          {filteredCategories.length === 0 ? (
            <div className={styles.emptyCategories}>
              لا توجد تصنيفات لهذا النوع. أضف تصنيفاً من الإعدادات أولاً.
            </div>
          ) : (
            <div className={styles.categoryGrid}>
              {filteredCategories.map((cat) => {
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

        {/* التاريخ */}
        <div className={styles.fieldGroup}>
          <label htmlFor="txn-date" className={styles.label}>
            التاريخ <span className={styles.required}>*</span>
          </label>
          <input
            id="txn-date"
            type="date"
            className={styles.input}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              if (error) setError('')
            }}
          />
        </div>

        {/* details */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="txn-details" className={styles.label}>
              تفاصيل قصيرة
            </label>
            <span className={styles.optional}>اختياري</span>
          </div>
          <input
            id="txn-details"
            type="text"
            className={styles.input}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="مثال: house, boys..."
            maxLength={200}
          />
        </div>

        {/* description */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="txn-desc" className={styles.label}>
              وصف
            </label>
            <span className={styles.optional}>اختياري</span>
          </div>
          <textarea
            id="txn-desc"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="تفاصيل أكثر عن المعاملة..."
            rows={2}
            maxLength={500}
          />
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الحفظ...' : initial ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TransactionFormModal
