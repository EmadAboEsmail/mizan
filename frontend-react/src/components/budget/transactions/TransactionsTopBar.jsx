import { useRef } from 'react'
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './transactionsIcons.jsx'
import { AR_MONTHS } from './transactionsHelpers.js'
import styles from './TransactionsTopBar.module.scss'

// ─── Helpers ───
function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(currentMonth) {
  if (!currentMonth) return 'كل الفترات'
  const [y, m] = currentMonth.split('-').map(Number)
  return `${AR_MONTHS[m - 1] || m} ${y}`
}

export default function TransactionsTopBar({
  currentMonth,
  onMonthChange,
  onToggleAll,
  onAdd,
}) {
  const monthInputRef = useRef(null)

  const monthLabel = getMonthLabel(currentMonth)
  const todayKey = getMonthKey(new Date())
  const isTodayMonth = currentMonth === todayKey
  const isAllMode = !currentMonth

  const handlePrev = () => {
    if (!currentMonth) {
      onMonthChange(todayKey)
      return
    }
    const [y, m] = currentMonth.split('-').map(Number)
    const prev = new Date(y, m - 2, 1)
    onMonthChange(getMonthKey(prev))
  }

  const handleNext = () => {
    if (!currentMonth) {
      onMonthChange(todayKey)
      return
    }
    const [y, m] = currentMonth.split('-').map(Number)
    const next = new Date(y, m, 1)
    onMonthChange(getMonthKey(next))
  }

  // ✅ فتح Date Picker عند الضغط على اسم الشهر
  const handleMonthClick = () => {
    const input = monthInputRef.current
    if (!input) return

    // ✅ لو في وضع "الكل"، نضبط الشهر الافتراضي لليوم قبل الفتح
    if (isAllMode) {
      input.value = todayKey
    } else {
      input.value = currentMonth
    }

    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker()
      } else {
        input.click()
      }
    } catch (err) {
      try {
        input.click()
      } catch (e) {
        console.warn('[MonthPicker] not supported:', e)
      }
    }
  }

  const handleMonthInputChange = (e) => {
    const value = e.target.value
    if (value) onMonthChange(value)
  }

  return (
    <div className={styles.topBar}>
      {/* ═══════ Header Row ═══════ */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">
            💵
          </span>
          <div className={styles.titleText}>
            <h2 className={styles.title}>المعاملات</h2>
            <p className={styles.subtitle}>{monthLabel}</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={onAdd}
          title="إضافة معاملة جديدة"
        >
          <PlusIcon />
          <span className={styles.addLabel}>إضافة</span>
        </button>
      </div>

      {/* ═══════ Month Navigator ═══════ */}
      <div className={styles.monthNav}>
        <div className={styles.navGroup}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={handlePrev}
            aria-label="الشهر السابق"
            title="الشهر السابق"
          >
            <ChevronLeftIcon />
          </button>

          {/* ✅ زر اسم الشهر — يفتح date picker */}
          <button
            type="button"
            className={styles.monthBtn}
            onClick={handleMonthClick}
            title="اضغط لاختيار أي شهر"
            aria-label={`اختيار شهر، الحالي: ${monthLabel}`}
          >
            <span className={styles.monthLabel}>{monthLabel}</span>
            <span className={styles.monthIcon} aria-hidden="true">
              📅
            </span>
          </button>

          <button
            type="button"
            className={styles.navBtn}
            onClick={handleNext}
            aria-label="الشهر التالي"
            title="الشهر التالي"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <button
          type="button"
          className={`${styles.allBtn} ${!currentMonth ? styles.allActive : ''}`}
          onClick={onToggleAll}
          title={!currentMonth ? 'العودة للشهر الحالي' : 'عرض كل الفترات'}
        >
          {!currentMonth ? '📅 شهر' : '🗓️ الكل'}
        </button>
      </div>

      {/* ✅ Hidden month input — يفتح date picker */}
      <input
        ref={monthInputRef}
        type="month"
        className={styles.hiddenMonthInput}
        onChange={handleMonthInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
