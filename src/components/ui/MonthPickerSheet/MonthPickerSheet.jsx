import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarCheck2, Layers } from 'lucide-react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './MonthPickerSheet.module.scss'

const AR_MONTHS = [
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

function getTodayYM() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  }
}

function parseYear(ym, fallbackYear) {
  if (!ym) return fallbackYear
  const y = parseInt(ym.split('-')[0], 10)
  return Number.isFinite(y) ? y : fallbackYear
}

/**
 * منتقي شهر عربي أصيل (Bottom Sheet)
 * بديل كامل لـ <input type="month"> غير المدعوم جيداً في Android WebView
 */
export default function MonthPickerSheet({
  isOpen,
  onClose,
  value,
  onSelect,
  allowAll = false,
  onSelectAll,
  maxMonth = null,
  title = 'اختر الشهر',
}) {
  const today = getTodayYM()
  const [viewYear, setViewYear] = useState(() => parseYear(value, today.year))

  // مزامنة السنة المعروضة عند فتح النافذة (أثناء الرسم بدون useEffect)
  const openKey = isOpen ? value || 'all' : 'closed'
  const [prevOpenKey, setPrevOpenKey] = useState(openKey)
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey)
    if (isOpen) {
      setViewYear(parseYear(value, today.year))
    }
  }

  const maxYear = maxMonth ? parseInt(maxMonth.split('-')[0], 10) : today.year + 5
  const minYear = 2015

  const handlePickMonth = (monthIndex) => {
    const key = `${viewYear}-${String(monthIndex + 1).padStart(2, '0')}`
    if (maxMonth && key > maxMonth) return
    onSelect(key)
    onClose()
  }

  const handlePickToday = () => {
    if (maxMonth && today.key > maxMonth) return
    onSelect(today.key)
    onClose()
  }

  const handlePickAll = () => {
    onSelectAll?.()
    onClose()
  }

  const canPickToday = !maxMonth || today.key <= maxMonth

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant="sheet">
      <div className={styles.picker}>
        {/* شريط السنة — في RTL: يمين = السابق، يسار = التالي */}
        <div className={styles.yearBar}>
          <button
            type="button"
            className={styles.yearNavBtn}
            onClick={() => setViewYear((y) => Math.max(minYear, y - 1))}
            disabled={viewYear <= minYear}
            aria-label="السنة السابقة"
          >
            <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>

          <span className={styles.yearLabel}>{viewYear}</span>

          <button
            type="button"
            className={styles.yearNavBtn}
            onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
            disabled={viewYear >= maxYear}
            aria-label="السنة التالية"
          >
            <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {/* شبكة الأشهر 3×4 */}
        <div className={styles.monthsGrid} role="listbox" aria-label="الأشهر">
          {AR_MONTHS.map((name, idx) => {
            const key = `${viewYear}-${String(idx + 1).padStart(2, '0')}`
            const isSelected = value === key
            const isCurrent = today.key === key
            const isDisabled = !!(maxMonth && key > maxMonth)

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                className={[
                  styles.monthCell,
                  isSelected ? styles.selected : '',
                  isCurrent && !isSelected ? styles.current : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handlePickMonth(idx)}
              >
                <span>{name}</span>
                {isCurrent && <span className={styles.todayDot} aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        {/* اختصارات سريعة */}
        {(canPickToday || allowAll) && (
          <div className={styles.quickRow}>
            {canPickToday && (
              <button
                type="button"
                className={`${styles.quickBtn} ${value === today.key ? styles.quickActive : ''}`}
                onClick={handlePickToday}
              >
                <CalendarCheck2 size={16} strokeWidth={2} aria-hidden="true" />
                <span>الشهر الحالي</span>
              </button>
            )}
            {allowAll && onSelectAll && (
              <button
                type="button"
                className={`${styles.quickBtn} ${!value ? styles.quickActive : ''}`}
                onClick={handlePickAll}
              >
                <Layers size={16} strokeWidth={2} aria-hidden="true" />
                <span>كل الفترات</span>
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
