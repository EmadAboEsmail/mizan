import styles from './BarChart.module.scss'

function BarChart({ labels, values }) {
  const maxValue = Math.max(...values, 1)

  return (
    <div className={styles.chart}>
      {labels.map((label, i) => {
        const value = values[i]
        const heightPercent = (value / maxValue) * 100

        return (
          <div key={label + i} className={styles.bar}>
            <div className={styles.barWrapper}>
              <div
                className={styles.barFill}
                style={{ height: `${heightPercent}%` }}
                title={`${label}: ${value}`}
              />
            </div>
            <div className={styles.value}>{value}</div>
            <div className={styles.label}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart
