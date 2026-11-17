import { useState } from 'react'
import { ChevronRight, ChevronLeft, Calendar, Plus } from 'lucide-react'
import MonthPickerSheet from '@/components/ui/MonthPickerSheet/MonthPickerSheet.jsx'
import { AR_MONTHS_FULL } from './lib/transactionsHelpers.js'
import styles from './TransactionsTopBar.module.scss'

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(currentMonth) {
  if (!currentMonth) return 'كل الفترات'
  const [y, m] = currentMonth.split('-').map(Number)
  return `${AR_MONTHS_FULL[m - 1] || m} ${y}`
}

export default function TransactionsTopBar({
  currentMonth,
  onMonthChange,
  onToggleAll,
  onAdd,
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const monthLabel = getMonthLabel(currentMonth)
  const todayKey = getMonthKey(new Date())
  const isAllMode = !currentMonth

  const handlePrev = () => {
    if (!currentMonth) {
      onMonthChange(todayKey)
      return
    }
    const [y, m] = currentMonth.split('-').map(Number)
    onMonthChange(getMonthKey(new Date(y, m - 2, 1)))
  }

  const handleNext = () => {
    if (!currentMonth) {
      onMonthChange(todayKey)
      return
    }
    const [y, m] = currentMonth.split('-').map(Number)
    onMonthChange(getMonthKey(new Date(y, m, 1)))
  }

  return (
    <>
      <div className={styles.bar}>
        {/* في RTL: الزر الأيمن (ChevronRight) = السابق، والأيسر (ChevronLeft) = التالي */}
        <div className={styles.monthStepper}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={handlePrev}
            aria-label="الشهر السابق"
            title="الشهر السابق"
          >
            <ChevronRight size={18} strokeWidth={2.3} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.monthBtn}
            onClick={() => setIsPickerOpen(true)}
            aria-label={`اختيار الفترة، الحالي: ${monthLabel}`}
          >
            <Calendar
              size={15}
              strokeWidth={2.1}
              className={styles.calIcon}
              aria-hidden="true"
            />
            <span className={styles.monthLabel}>{monthLabel}</span>
          </button>

          <button
            type="button"
            className={styles.navBtn}
            onClick={handleNext}
            aria-label="الشهر التالي"
            title="الشهر التالي"
          >
            <ChevronLeft size={18} strokeWidth={2.3} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className={`${styles.allBtn} ${isAllMode ? styles.allActive : ''}`}
          onClick={onToggleAll}
          title={isAllMode ? 'العودة للشهر الحالي' : 'عرض كل الفترات'}
        >
          {isAllMode ? 'الشهر' : 'الكل'}
        </button>

        {onAdd && (
          <button
            type="button"
            className={styles.desktopAddBtn}
            onClick={onAdd}
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>إضافة</span>
          </button>
        )}
      </div>

      <MonthPickerSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        value={currentMonth}
        onSelect={onMonthChange}
        allowAll
        onSelectAll={() => onMonthChange('all')}
        title="اختر شهر المعاملات"
      />
    </>
  )
}
