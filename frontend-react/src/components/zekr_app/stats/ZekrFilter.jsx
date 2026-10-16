import styles from './ZekrFilter.module.scss'

function ZekrFilter({ adhkar = [], value, onChange }) {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.scrollArea}>
        <button
          className={`${styles.chip} ${value === null ? styles.active : ''}`}
          onClick={() => onChange(null)}
        >
          الكل
        </button>

        {adhkar.map((z) => (
          <button
            key={z.id}
            className={`${styles.chip} ${value === z.id ? styles.active : ''}`}
            onClick={() => onChange(z.id)}
          >
            {z.text}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ZekrFilter
