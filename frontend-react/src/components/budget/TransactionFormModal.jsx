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

function yesterdayISO() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateLabel(iso) {
  if (iso === todayISO()) return 'اليوم'
  if (iso === yesterdayISO()) return 'أمس'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
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
  const [showExtras, setShowExtras] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (initial) {
      setType(initial.type || 'expense')
      setAmount(String(initial.amount ?? ''))
      setCategoryId(initial.category_id || '')
      setDate(initial.date || todayISO())
      setDetails(initial.details || '')
      setDescription(initial.description || '')
      setShowExtras(!!(initial.details || initial.description))
    } else {
      setType('expense')
      setAmount('')
      setCategoryId('')
      setDate(todayISO())
      setDetails('')
      setDescription('')
      setShowExtras(false)
    }
    setShowDatePicker(false)
    setError('')
    setIsSubmitting(false)
  }, [isOpen, initial])

  const filteredCategories = categories.filter((c) => c.type === type)

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

  const isToday = date === todayISO()
  const isYesterday = date === yesterdayISO()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل المعاملة' : 'إضافة معاملة'}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* ─── 1. Segmented Toggle ─── */}
        <div
          className={styles.segmented}
          role="tablist"
          aria-label="نوع المعاملة"
        >
          <button
            type="button"
            role="tab"
            aria-selected={type === 'expense'}
            className={`${styles.segment} ${type === 'expense' ? styles.segmentExpense : ''
              }`}
            onClick={() => setType('expense')}
          >
            <span className={styles.segmentIcon}>💸</span>
            <span>مصروف</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={type === 'income'}
            className={`${styles.segment} ${type === 'income' ? styles.segmentIncome : ''
              }`}
            onClick={() => setType('income')}
          >
            <span className={styles.segmentIcon}>💰</span>
            <span>دخل</span>
          </button>
        </div>

        {/* ─── 2. Hero Amount ─── */}
        <div className={styles.amountSection}>
          <label htmlFor="txn-amount" className={styles.amountLabel}>
            المبلغ
          </label>
          <div className={styles.amountWrapper}>
            <input
              id="txn-amount"
              type="text"
              inputMode="decimal"
              className={styles.amountInput}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (error) setError('')
              }}
              placeholder="0"
              autoFocus
            />
            <span className={styles.amountCurrency}>ج.م</span>
          </div>
        </div>

        {/* ─── 3. Category ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.sectionLabel}>التصنيف</label>
          </div>
          {filteredCategories.length === 0 ? (
            <div className={styles.emptyCategories}>
              لا توجد تصنيفات لهذا النوع
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
                    <CategoryIcon category={cat} size={20} />
                    <span className={styles.catName}>{cat.name}</span>
                    {isSelected && <span className={styles.catCheck}>✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── 4. Date Quick Actions ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.sectionLabel}>التاريخ</label>
          </div>
          <div className={styles.dateQuickActions}>
            <button
              type="button"
              className={`${styles.dateChip} ${isToday ? styles.dateChipActive : ''
                }`}
              onClick={() => setDate(todayISO())}
            >
              اليوم
            </button>
            <button
              type="button"
              className={`${styles.dateChip} ${isYesterday ? styles.dateChipActive : ''
                }`}
              onClick={() => setDate(yesterdayISO())}
            >
              أمس
            </button>
            <button
              type="button"
              className={`${styles.dateChip} ${!isToday && !isYesterday ? styles.dateChipActive : ''
                }`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {!isToday && !isYesterday ? formatDateLabel(date) : '📅 تاريخ آخر'}
            </button>
          </div>
          {showDatePicker && (
            <input
              type="date"
              className={styles.dateInput}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setShowDatePicker(false)
                if (error) setError('')
              }}
              autoFocus
            />
          )}
        </div>

        {/* ─── 5. Extras (Collapsible) ─── */}
        <div className={styles.extras}>
          <button
            type="button"
            className={styles.extrasToggle}
            onClick={() => setShowExtras(!showExtras)}
            aria-expanded={showExtras}
          >
            <span className={styles.extrasChevron}>
              {showExtras ? '▼' : '◀'}
            </span>
            <span>تفاصيل إضافية (اختياري)</span>
          </button>

          {showExtras && (
            <div className={styles.extrasContent}>
              <div className={styles.fieldGroup}>
                <label htmlFor="txn-details" className={styles.fieldLabel}>
                  تفاصيل قصيرة
                </label>
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

              <div className={styles.fieldGroup}>
                <label htmlFor="txn-desc" className={styles.fieldLabel}>
                  وصف
                </label>
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
            </div>
          )}
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className={styles.error} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ─── Sticky Footer ─── */}
        <div className={styles.footer}>
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
            {isSubmitting
              ? 'جاري الحفظ...'
              : initial
                ? 'حفظ التعديلات'
                : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TransactionFormModal
