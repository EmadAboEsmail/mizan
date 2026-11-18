import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './PeriodTabs.module.scss'

const PERIODS = [
  { id: 'day', label: 'يومي' },
  { id: 'week', label: 'أسبوعي' },
  { id: 'month', label: 'شهري' },
  { id: 'year', label: 'سنوي' },
]

function PeriodTabs({ value, onChange }) {
  const activeIndex = Math.max(
    0,
    PERIODS.findIndex((p) => p.id === value)
  )

  return (
    <div
      className={styles.tabsWrapper}
      role="tablist"
      aria-label="فترة الإحصائيات"
      style={{
        '--tab-count': PERIODS.length,
        '--tab-index': activeIndex,
      }}
    >
      <span className={styles.slider} aria-hidden="true" />
      {PERIODS.map((p) => {
        const isActive = value === p.id
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => {
              if (!isActive) triggerHapticFeedback('light')
              onChange(p.id)
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

export default PeriodTabs
