import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Check,
  ChevronDown,
  AlertCircle,
  Plus,
} from 'lucide-react'
import Modal from '@/components/ui/Modal.jsx'
import DatePickerSheet from '@/components/ui/DatePickerSheet/DatePickerSheet.jsx'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import { useCurrency } from '@/hooks/useCurrency.js'
import { useWalletsQuery } from '@/queries/budget'
import CategoryIcon from './CategoryIcon.jsx'
import styles from './TransactionFormModal.module.scss'

const LAST_CAT_KEY = 'mizan_last_category_v1'
const QUICK_AMOUNTS = [20, 50, 100, 250, 500]
const EMPTY_MAP = {}

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
  const [, m, d] = String(iso || '').split('-')
  return d && m ? `${d}/${m}` : iso
}

function readLastCategory(type) {
  try {
    const raw = localStorage.getItem(LAST_CAT_KEY)
    if (!raw) return ''
    return JSON.parse(raw)?.[type] || ''
  } catch {
    return ''
  }
}

function saveLastCategory(type, catId) {
  if (!type || !catId) return
  try {
    const raw = localStorage.getItem(LAST_CAT_KEY)
    const obj = raw ? JSON.parse(raw) : {}
    obj[type] = catId
    localStorage.setItem(LAST_CAT_KEY, JSON.stringify(obj))
  } catch {
    // تجاهل
  }
}

/**
 * تقييم آمن لتعبيرات الجمع والطرح السريعة (مثل "50+35+20" أو "٥٠+٣٥" أو "200-25").
 * يعيد { value: number | null, hasOperator: boolean }
 */
function evaluateAmountExpression(raw) {
  const normalized = String(raw ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, '.')
    .replace(/\s+/g, '')

  if (!normalized) return { value: null, hasOperator: false }
  const cleaned = normalized.replace(/[+-]+$/, '')
  if (!cleaned) return { value: null, hasOperator: false }
  if (!/^[0-9]+(\.[0-9]+)?([+-][0-9]+(\.[0-9]+)?)*$/.test(cleaned)) {
    return { value: NaN, hasOperator: false }
  }

  const tokens = cleaned.match(/[+-]?[0-9]+(\.[0-9]+)?/g)
  if (!tokens) return { value: NaN, hasOperator: false }

  const sum = tokens.reduce((acc, tok) => acc + Number(tok), 0)
  return {
    value: Math.round(sum * 100) / 100,
    hasOperator: tokens.length > 1,
  }
}

function buildFormState(initial) {
  if (initial) {
    return {
      type: initial.type || 'expense',
      amount: String(initial.amount ?? ''),
      categoryId: initial.category_id || '',
      walletId: initial.wallet_id || '',
      date: initial.date || todayISO(),
      details: initial.details || '',
      description: initial.description || '',
      showExtras: !!(initial.details || initial.description),
    }
  }
  return {
    type: 'expense',
    amount: '',
    categoryId: readLastCategory('expense'),
    walletId: localStorage.getItem('mizan_last_wallet_v1') || '',
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
  categoryUsage = EMPTY_MAP,
}) {
  const { symbol } = useCurrency()
  const { data: wallets = [] } = useWalletsQuery()
  const [type, setType] = useState(() => buildFormState(initial).type)
  const [amount, setAmount] = useState(() => buildFormState(initial).amount)
  const [categoryId, setCategoryId] = useState(
    () => buildFormState(initial).categoryId
  )
  const [walletId, setWalletId] = useState(
    () => buildFormState(initial).walletId
  )
  const [date, setDate] = useState(() => buildFormState(initial).date)
  const [details, setDetails] = useState(() => buildFormState(initial).details)
  const [description, setDescription] = useState(
    () => buildFormState(initial).description
  )
  const [showExtras, setShowExtras] = useState(
    () => buildFormState(initial).showExtras
  )

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const sessionKey = isOpen ? (initial?.id ?? 'new') : 'closed'
  const [lastSessionKey, setLastSessionKey] = useState(sessionKey)

  if (sessionKey !== lastSessionKey) {
    setLastSessionKey(sessionKey)
    if (isOpen) {
      const fresh = buildFormState(initial)
      setType(fresh.type)
      setAmount(fresh.amount)
      setCategoryId(fresh.categoryId)
      setWalletId(fresh.walletId)
      setDate(fresh.date)
      setDetails(fresh.details)
      setDescription(fresh.description)
      setShowExtras(fresh.showExtras)
      setShowDatePicker(false)
      setError('')
      setIsSubmitting(false)
    }
  }

  // ترتيب التصنيفات: الأكثر استخداماً أولاً (أعلى 3) ثم البقية بترتيبها الطبيعي
  const { sortedCategories, topIds } = useMemo(() => {
    const ofType = categories.filter((c) => c.type === type)
    const ranked = [...ofType]
      .filter((c) => (categoryUsage[c.id] || 0) > 0)
      .sort((a, b) => (categoryUsage[b.id] || 0) - (categoryUsage[a.id] || 0))
      .slice(0, 3)
    const topSet = new Set(ranked.map((c) => c.id))
    const rest = ofType.filter((c) => !topSet.has(c.id))
    return {
      sortedCategories: [...ranked, ...rest],
      topIds: topSet,
    }
  }, [categories, type, categoryUsage])

  const effectiveCategoryId =
    categoryId && sortedCategories.some((c) => c.id === categoryId)
      ? categoryId
      : sortedCategories[0]?.id ?? ''

  const evaluated = useMemo(() => evaluateAmountExpression(amount), [amount])

  const handleSwitchType = (nextType) => {
    if (nextType === type) return
    triggerHapticFeedback('light')
    setType(nextType)
    if (!initial) {
      setCategoryId(readLastCategory(nextType))
    }
  }

  const handleQuickAddAmount = (delta) => {
    triggerHapticFeedback('light')
    const current =
      Number.isFinite(evaluated.value) && evaluated.value > 0
        ? evaluated.value
        : 0
    const next = Math.round((current + delta) * 100) / 100
    setAmount(String(next))
    if (error) setError('')
  }

  const handleAppendPlus = () => {
    const trimmed = amount.trim()
    if (!trimmed || /[+-]$/.test(trimmed)) return
    setAmount(`${trimmed}+`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = evaluated.value

    if (numAmount === null) {
      setError('الرجاء إدخال المبلغ')
      return
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError('المبلغ يجب أن يكون رقماً موجباً (يمكنك كتابة مثل 50+35)')
      return
    }
    if (!effectiveCategoryId) {
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
      category_id: effectiveCategoryId,
      wallet_id: walletId || null,
      date,
      details: details.trim() || null,
      description: description.trim() || null,
    }

    try {
      setIsSubmitting(true)
      saveLastCategory(type, effectiveCategoryId)
      try {
        localStorage.setItem('mizan_last_wallet_v1', walletId || '')
      } catch {
        // تجاهل
      }
      triggerHapticFeedback('success')
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initial ? 'تعديل المعاملة' : 'إضافة سريعة'}
        variant="sheet"
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
              className={`${styles.segment} ${
                type === 'expense' ? styles.segmentExpense : ''
              }`}
              onClick={() => handleSwitchType('expense')}
            >
              <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" />
              <span>مصروف</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={type === 'income'}
              className={`${styles.segment} ${
                type === 'income' ? styles.segmentIncome : ''
              }`}
              onClick={() => handleSwitchType('income')}
            >
              <ArrowDownLeft size={16} strokeWidth={2.4} aria-hidden="true" />
              <span>دخل</span>
            </button>
          </div>

          {/* ─── 2. Hero Amount + Quick Calc + Chips ─── */}
          <div className={styles.amountSection}>
            <div className={styles.amountTopRow}>
              <label htmlFor="txn-amount" className={styles.amountLabel}>
                المبلغ
              </label>
              {evaluated.hasOperator && Number.isFinite(evaluated.value) ? (
                <span className={styles.calcPreview}>
                  = {evaluated.value.toLocaleString('en')} {symbol}
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.plusOpBtn}
                  onClick={handleAppendPlus}
                  disabled={!amount.trim()}
                  title="اجمع مبلغاً آخر (مثال 50+35)"
                >
                  <Plus size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span>جمع</span>
                </button>
              )}
            </div>

            <div className={styles.amountWrapper}>
              <input
                id="txn-amount"
                type="text"
                inputMode="decimal"
                dir="ltr"
                className={styles.amountInput}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (error) setError('')
                }}
                placeholder="0"
                autoFocus
              />
              <span className={styles.amountCurrency}>{symbol}</span>
            </div>

            <div className={styles.quickAmounts} aria-label="مبالغ سريعة">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={styles.quickAmountChip}
                  onClick={() => handleQuickAddAmount(q)}
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* ─── 3. Category (آخر تصنيف محفوظ + الأكثر استخداماً أولاً) ─── */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.sectionLabel}>التصنيف</label>
              {topIds.size > 0 && (
                <span className={styles.sectionHint}>الأكثر استخداماً أولاً</span>
              )}
            </div>
            {sortedCategories.length === 0 ? (
              <div className={styles.emptyCategories}>
                لا توجد تصنيفات لهذا النوع
              </div>
            ) : (
              <div className={styles.categoryGrid}>
                {sortedCategories.map((cat) => {
                  const isSelected = cat.id === effectiveCategoryId
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.catChip} ${
                        isSelected ? styles.catSelected : ''
                      }`}
                      onClick={() => {
                        triggerHapticFeedback('light')
                        setCategoryId(cat.id)
                        if (error) setError('')
                      }}
                    >
                      <CategoryIcon category={cat} size={22} />
                      <span className={styles.catName}>{cat.name}</span>
                      {isSelected && (
                        <Check
                          size={14}
                          strokeWidth={2.6}
                          className={styles.catCheck}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ─── 4. Date Quick Actions + Custom Sheet ─── */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.sectionLabel}>التاريخ</label>
            </div>
            <div className={styles.dateQuickActions}>
              <button
                type="button"
                className={`${styles.dateChip} ${
                  isToday ? styles.dateChipActive : ''
                }`}
                onClick={() => setDate(todayISO())}
              >
                اليوم
              </button>
              <button
                type="button"
                className={`${styles.dateChip} ${
                  isYesterday ? styles.dateChipActive : ''
                }`}
                onClick={() => setDate(yesterdayISO())}
              >
                أمس
              </button>
              <button
                type="button"
                className={`${styles.dateChip} ${
                  !isToday && !isYesterday ? styles.dateChipActive : ''
                }`}
                onClick={() => setShowDatePicker(true)}
              >
                <Calendar size={14} strokeWidth={2.1} aria-hidden="true" />
                <span>
                  {!isToday && !isYesterday
                    ? formatDateLabel(date)
                    : 'تاريخ آخر'}
                </span>
              </button>
            </div>
          </div>

          {/* ─── 4b. Wallet (اختياري) ─── */}
          {wallets.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <label className={styles.sectionLabel}>المحفظة</label>
                <span className={styles.sectionHint}>اختياري</span>
              </div>
              <div className={styles.dateRow}>
                <button
                  type="button"
                  className={`${styles.dateChip} ${
                    !walletId ? styles.dateChipActive : ''
                  }`}
                  onClick={() => setWalletId('')}
                >
                  عام
                </button>
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`${styles.dateChip} ${
                      walletId === w.id ? styles.dateChipActive : ''
                    }`}
                    onClick={() => {
                      triggerHapticFeedback('light')
                      setWalletId(w.id)
                    }}
                  >
                    {w.icon} {w.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── 5. Extras (Collapsible) ─── */}
          <div className={styles.extras}>
            <button
              type="button"
              className={styles.extrasToggle}
              onClick={() => setShowExtras(!showExtras)}
              aria-expanded={showExtras}
            >
              <ChevronDown
                size={16}
                strokeWidth={2.2}
                className={`${styles.extrasChevron} ${
                  showExtras ? styles.extrasChevronOpen : ''
                }`}
                aria-hidden="true"
              />
              <span>ملاحظات وتفاصيل (اختياري)</span>
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
                    placeholder="مثال: البقالة، المواصلات..."
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
              <AlertCircle size={16} strokeWidth={2.2} aria-hidden="true" />
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

      <DatePickerSheet
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={date}
        onSelect={(iso) => {
          setDate(iso)
          if (error) setError('')
        }}
        title="تاريخ المعاملة"
      />
    </>
  )
}

export default TransactionFormModal
