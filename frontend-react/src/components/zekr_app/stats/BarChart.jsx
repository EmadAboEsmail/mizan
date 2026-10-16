import styles from './BarChart.module.scss'

function BarChart({ labels = [], values = [] }) {
  const maxValue = Math.max(...values, 1)

  return (
    <div className={styles.chartCard}>
      <div className={styles.barsContainer}>
        {labels.map((label, i) => {
          const value = values[i] || 0
          const heightPercent = Math.round((value / maxValue) * 100)
          const isHighest = value === maxValue && value > 0

          return (
            <div key={label + i} className={styles.barColumn}>
              {/* القيمة المنبثقة فوق العمود */}
              <span className={`${styles.barValue} ${value === 0 ? styles.zero : ''}`}>
                {value > 0 ? value.toLocaleString('en') : ''}
              </span>

              {/* مسار العمود والخلفية */}
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isHighest ? styles.highest : ''}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* اسم اليوم / الفترة */}
              <span className={styles.barLabel}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BarChart
