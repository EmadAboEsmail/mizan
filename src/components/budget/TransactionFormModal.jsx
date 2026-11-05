import { useState } from 'react'   // ← useEffect اتشال
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
  const [m, d] = iso.split('-')
  return `${d}/${m}`
}

// ═══════════════════════════════════════════════════════════════
// 🆕 دالة نقية لبناء الحالة الابتدائية للفورم
//     - مصدر واحد لشكل الحالة
//     - سهلة الاختبار
//     - تُستخدم في useState وفي reset
// ═══════════════════════════════════════════════════════════════
function buildFormState(initial) {
  if (initial) {
    return {
      type: initial.type || 'expense',
      amount: String(initial.amount ?? ''),
      categoryId: initial.category_id || '',
      date: initial.date || todayISO(),
      details: initial.details || '',
      description: initial.description || '',
      showExtras: !!(initial.details || initial.description),
    }
  }
  return {
    type: 'expense',
    amount: '',
    categoryId: '',
    date: todayISO(),
    details: '',
    description: '',
    showExtras: false,
  }
}

function TransactionFormModal({
  isOpen,
  onClose,
  onConfirm,
  initial = null,
  categories = [],
}) {
  // ─────────────────────────────────────────────────────────────
  // 1) الحالة الابتدائية (تُستخدم عند أول mount فقط)
  // ─────────────────────────────────────────────────────────────
  const [type, setType] = useState(() => buildFormState(initial).type)
  const [amount, setAmount] = useState(() => buildFormState(initial).amount)
  const [categoryId, setCategoryId] = useState(() => buildFormState(initial).categoryId)
  const [date, setDate] = useState(() => buildFormState(initial).date)
  const [details, setDetails] = useState(() => buildFormState(initial).details)
  const [description, setDescription] = useState(() => buildFormState(initial).description)
  const [showExtras, setShowExtras] = useState(() => buildFormState(initial).showExtras)

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // ─────────────────────────────────────────────────────────────
  // 2) Session Key — مفتاح الجلسة
  //    بيتغيّر لما نحتاج reset (فتح/قفل/تغيير txn)
  // ─────────────────────────────────────────────────────────────
  const sessionKey = isOpen ? (initial?.id ?? 'new') : 'closed'
  const [lastSessionKey, setLastSessionKey] = useState(sessionKey)

  // ─────────────────────────────────────────────────────────────
  // 3) Adjust state during render
  //    ⚠️ مش useEffect — كود عادي أثناء الرسم
  //    React بيعيد الرسم فوراً بدون flash ولا cascading renders
  // ─────────────────────────────────────────────────────────────
  if (sessionKey !== lastSessionKey) {
    setLastSessionKey(sessionKey)
    if (isOpen) {
      const fresh = buildFormState(initial)
      setType(fresh.type)
      setAmount(fresh.amount)
      setCategoryId(fresh.categoryId)
      setDate(fresh.date)
      setDetails(fresh.details)
      setDescription(fresh.description)
      setShowExtras(fresh.showExtras)

      setShowDatePicker(false)
      setError('')
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4) Derived category — بدل الـ useEffect التاني
  //    لو categoryId الحالي مش موجود ضمن الـ filtered، خُد الأول
  // ─────────────────────────────────────────────────────────────
  const filteredCategories = categories.filter((c) => c.type === type)
  const effectiveCategoryId =
    categoryId && filteredCategories.some((c) => c.id === categoryId)
      ? categoryId
      : filteredCategories[0]?.id ?? ''

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
    if (!effectiveCategoryId) {          // ← تعديل
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
      category_id: effectiveCategoryId,   // ← تعديل
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
      variant="sheet"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* ─── 1. Segmented Toggle ─── */}
        <div className={styles.segmented} role="tablist" aria-label="نوع المعاملة">
          <button
            type="button"
            role="tab"
            aria-selected={type === 'expense'}
            className={`${styles.segment} ${type === 'expense' ? styles.segmentExpense : ''}`}
            onClick={() => setType('expense')}
          >
            <span className={styles.segmentIcon}>💸</span>
            <span>مصروف</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={type === 'income'}
            className={`${styles.segment} ${type === 'income' ? styles.segmentIncome : ''}`}
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
                const isSelected = cat.id === effectiveCategoryId  // ← تعديل
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.catChip} ${isSelected ? styles.catSelected : ''}`}
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
              className={`${styles.dateChip} ${isToday ? styles.dateChipActive : ''}`}
              onClick={() => setDate(todayISO())}
            >
              اليوم
            </button>
            <button
              type="button"
              className={`${styles.dateChip} ${isYesterday ? styles.dateChipActive : ''}`}
              onClick={() => setDate(yesterdayISO())}
            >
              أمس
            </button>
            <button
              type="button"
              className={`${styles.dateChip} ${!isToday && !isYesterday ? styles.dateChipActive : ''}`}
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
            <span className={styles.extrasChevron}>{showExtras ? '▼' : '◀'}</span>
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
          <button type="submit" className={styles.confirm} disabled={isSubmitting}>
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
