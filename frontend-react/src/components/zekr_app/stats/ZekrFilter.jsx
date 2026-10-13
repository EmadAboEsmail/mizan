import styles from './ZekrFilter.module.scss'

function ZekrFilter({ adhkar, value, onChange }) {
  return (
    <div className={styles.filter}>
      <button
        className={`${styles.item} ${value === null ? styles.active : ''}`}
        onClick={() => onChange(null)}
      >
        الكل
      </button>

      {adhkar.map((z) => (
        <button
          key={z.id}
          className={`${styles.item} ${value === z.id ? styles.active : ''}`}
          onClick={() => onChange(z.id)}
        >
          {z.text}
        </button>
      ))}
    </div>
  )
}

export default ZekrFilter
