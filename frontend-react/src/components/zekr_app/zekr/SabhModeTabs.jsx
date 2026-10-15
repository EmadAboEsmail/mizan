import styles from './SabhModeTabs.module.scss'

const MODES = [
  { id: 'normal', label: 'عادي' },
  { id: 'group', label: 'المجموعة' },
]

function SabhModeTabs({ value, onChange }) {
  return (
    <div className={styles.tabs}>
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`${styles.tab} ${value === m.id ? styles.active : ''}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

export default SabhModeTabs
