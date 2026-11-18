import { useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import Modal from '@/components/ui/Modal.jsx'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './DatePickerSheet.module.scss'

const MONTH_NAMES = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

// الأسبوع يبدأ بالسبت (الأكثر ألفة في مصر والعالم العربي)
const WEEKDAY_NAMES = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']

function toDateStr(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')}`
}

function getOffsetDateStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseIsoDate(str) {
  const m = String(str || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    }
  }
  return {
    year: Number(m[1]),
    month: Number(m[2]) - 1,
    day: Number(m[3]),
  }
}

function DatePickerContent({ value, onSelect, onClose }) {
  const initial = parseIsoDate(value)
  const [viewYear, setViewYear] = useState(initial.year)
  const [viewMonth, setViewMonth] = useState(initial.month)

  const today = getOffsetDateStr(0)
  const yesterday = getOffsetDateStr(-1)
  const twoDaysAgo = getOffsetDateStr(-2)

  const cells = useMemo(() => {
    // getDay(): 0=Sun..6=Sat -> تحويل لبداية السبت: (day + 1) % 7
    const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 1) % 7
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const list = []
    for (let i = 0; i < firstDow; i += 1) {
      list.push(null)
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push({
        day: d,
        iso: toDateStr(viewYear, viewMonth, d),
      })
    }
    return list
  }, [viewYear, viewMonth])

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const pick = (iso) => {
    triggerHapticFeedback('light')
    onSelect(iso)
    onClose()
  }

  return (
    <div className={styles.sheet}>
      {/* اختصارات سريعة */}
      <div className={styles.shortcuts}>
        {[
          { label: 'اليوم', iso: today },
          { label: 'أمس', iso: yesterday },
          { label: 'أول أمس', iso: twoDaysAgo },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            className={`${styles.shortcutChip} ${
              value === s.iso ? styles.shortcutActive : ''
            }`}
            onClick={() => pick(s.iso)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* شريط الشهر والسنة */}
      <div className={styles.monthHeader}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => shiftMonth(-1)}
          aria-label="الشهر السابق"
        >
          <ChevronRight size={18} strokeWidth={2.3} />
        </button>

        <span className={styles.monthTitle}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          className={styles.navBtn}
          onClick={() => shiftMonth(1)}
          aria-label="الشهر التالي"
        >
          <ChevronLeft size={18} strokeWidth={2.3} />
        </button>
      </div>

      {/* أسماء الأيام */}
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAY_NAMES.map((w) => (
          <span key={w} className={styles.weekday}>
            {w}
          </span>
        ))}
      </div>

      {/* شبكة الأيام */}
      <div className={styles.grid} role="grid" aria-label="التقويم">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <span key={`empty-${idx}`} className={styles.emptyCell} />
          }
          const isSelected = cell.iso === value
          const isToday = cell.iso === today
          return (
            <button
              key={cell.iso}
              type="button"
              className={`${styles.dayCell} ${
                isSelected ? styles.daySelected : ''
              } ${isToday && !isSelected ? styles.dayToday : ''}`}
              onClick={() => pick(cell.iso)}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DatePickerSheet({
  isOpen,
  onClose,
  value,
  onSelect,
  title = 'اختر التاريخ',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant="sheet">
      {isOpen && (
        <DatePickerContent
          value={value}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}
