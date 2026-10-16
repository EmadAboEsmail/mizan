import styles from './PeriodTabs.module.scss'

const PERIODS = [
  { id: 'day', label: 'يومي' },
  { id: 'week', label: 'أسبوعي' },
  { id: 'month', label: 'شهري' },
  { id: 'year', label: 'سنوي' },
]

function PeriodTabs({ value, onChange }) {
  return (
    <div className={styles.tabsWrapper} role="tablist">
      {PERIODS.map((p) => {
        const isActive = value === p.id
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(p.id)}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

export default PeriodTabs
