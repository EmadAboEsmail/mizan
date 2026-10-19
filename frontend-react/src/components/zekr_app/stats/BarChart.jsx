import { useState } from 'react'
import styles from './BarChart.module.scss'

function BarChart({ labels = [], values = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const safeLabels = Array.isArray(labels) ? labels : []
  const safeValues = Array.isArray(values) ? values : []
  const length = Math.min(safeLabels.length, safeValues.length)

  const maxValue = Math.max(...safeValues.slice(0, length), 1)

  const handleEnter = (i) => setHoveredIndex(i)
  const handleLeave = () => setHoveredIndex(null)

  return (
    <div className={styles.chartCard}>
      <div className={styles.barsContainer}>
        {safeLabels.slice(0, length).map((label, i) => {
          const value = safeValues[i] || 0
          const heightPercent = Math.round((value / maxValue) * 100)
          const isHighest = value === maxValue && value > 0
          const isHovered = hoveredIndex === i

          return (
            <div
              key={`bar-${label}-${i}`}
              className={`${styles.barColumn} ${isHovered ? styles.hovered : ''}`}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
              onFocus={() => handleEnter(i)}
              onBlur={handleLeave}
              tabIndex={0}
              role="button"
              aria-label={`${label}: ${value.toLocaleString('en')} تسبيحة`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* tooltip مخصص */}
              {isHovered && (
                <div className={styles.tooltip} role="tooltip">
                  <div className={styles.tooltipLabel}>{label}</div>
                  <div className={styles.tooltipValue}>
                    {value.toLocaleString('en')} تسبيحة
                  </div>
                </div>
              )}

              <span
                className={`${styles.barValue} ${value === 0 ? styles.zero : ''}`}
              >
                {value > 0 ? value.toLocaleString('en') : ''}
              </span>

              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isHighest ? styles.highest : ''
                    }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              <span className={styles.barLabel}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BarChart
