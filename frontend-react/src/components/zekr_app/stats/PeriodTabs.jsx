import styles from './PeriodTabs.module.scss'

const PERIODS = [
  { id: 'day', label: 'يومي' },
  { id: 'week', label: 'أسبوعي' },
  { id: 'month', label: 'شهري' },
  { id: 'year', label: 'سنوي' },
]

function PeriodTabs({ value, onChange }) {
  return (
    <div className={styles.tabs}>
      {PERIODS.map((p) => (
        <button
          key={p.id}
          className={`${styles.tab} ${value === p.id ? styles.active : ''}`}
          onClick={() => onChange(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

export default PeriodTabs
