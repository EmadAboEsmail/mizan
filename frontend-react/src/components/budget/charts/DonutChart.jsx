import { useState, useMemo } from 'react'
import styles from './DonutChart.module.scss'

/**
 * Donut chart بسيط بـ SVG — بدون مكتبات.
 * data: [{ label, value, color }]
 */
function DonutChart({ data = [], size = 200, thickness = 38, centerLabel = 'الإجمالي' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const total = useMemo(
    () => data.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [data]
  )

  const segments = useMemo(() => {
    if (total <= 0) return []
    const cx = size / 2
    const cy = size / 2
    const middleR = (size - thickness) / 2
    const circumference = 2 * Math.PI * middleR

    let cumulative = 0
    return data.map((seg, i) => {
      const value = Number(seg.value) || 0
      const percent = value / total
      const dash = percent * circumference
      const gap = 2 // فجوة صغيرة بين الأجزاء
      const offset = -(cumulative * circumference) + circumference / 4 // يبدأ من فوق
      cumulative += percent

      return {
        key: i,
        color: seg.color || '#94a3b8',
        label: seg.label,
        value,
        percent,
        cx,
        cy,
        middleR,
        dash: Math.max(0, dash - gap),
        gap: circumference - Math.max(0, dash - gap),
        offset,
      }
    })
  }, [data, total, size, thickness])

  if (total <= 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📊</span>
        <p>لا توجد بيانات لعرضها</p>
      </div>
    )
  }

  const hoveredSeg = hoveredIndex !== null ? segments[hoveredIndex] : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={styles.svg}
          role="img"
          aria-label="توزيع المصاريف حسب التصنيف"
        >
          {segments.map((seg, i) => (
            <circle
              key={seg.key}
              cx={seg.cx}
              cy={seg.cy}
              r={seg.middleR}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === i ? thickness + 4 : thickness}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={seg.offset}
              className={styles.segment}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                transition: 'stroke-width 0.2s ease',
                opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.5,
              }}
            />
          ))}
        </svg>

        {/* الوسط: إما الإجمالي أو القسم المرّر عليه */}
        <div className={styles.center}>
          {hoveredSeg ? (
            <>
              <span className={styles.centerValue}>
                {hoveredSeg.percent > 0
                  ? `${(hoveredSeg.percent * 100).toFixed(1)}%`
                  : '0%'}
              </span>
              <span className={styles.centerLabel}>{hoveredSeg.label}</span>
            </>
          ) : (
            <>
              <span className={styles.centerValue}>{formatAmount(total)}</span>
              <span className={styles.centerLabel}>{centerLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <ul className={styles.legend}>
        {segments.map((seg, i) => (
          <li
            key={seg.key}
            className={`${styles.legendItem} ${hoveredIndex === i ? styles.legendActive : ''
              }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className={styles.legendDot}
              style={{ backgroundColor: seg.color }}
            />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendValue}>
              {formatAmount(seg.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(0)
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default DonutChart
