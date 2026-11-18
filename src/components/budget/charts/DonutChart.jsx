import { useState, useMemo } from 'react'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './DonutChart.module.scss'

function DonutChart({
  data = [],
  size = 200,
  thickness = 38,
  centerLabel = 'الإجمالي',
}) {
  const { isPrivate } = usePrivacyMode()
  const [selectedIndex, setSelectedIndex] = useState(null)
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
      const gap = segmentsLengthGap(data.length)
      const offset = -(cumulative * circumference) + circumference / 4
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

  const safeSelected =
    selectedIndex !== null && selectedIndex < segments.length
      ? selectedIndex
      : null
  const activeIndex = hoveredIndex !== null ? hoveredIndex : safeSelected
  const activeSeg = activeIndex !== null ? segments[activeIndex] : null
  const money = (v) => (isPrivate ? maskText('') : formatAmount(v))

  const handleToggleIndex = (idx) => {
    triggerHapticFeedback('light')
    setSelectedIndex((prev) => (prev === idx ? null : idx))
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={styles.svg}
          role="img"
          aria-label="توزيع المصاريف حسب التصنيف — اضغط على أي شريحة للتفاصيل"
        >
          {segments.map((seg, i) => {
            const isActive = activeIndex === i
            return (
              <circle
                key={seg.key}
                cx={seg.cx}
                cy={seg.cy}
                r={seg.middleR}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? thickness + 5 : thickness}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={seg.offset}
                className={styles.segment}
                onClick={() => handleToggleIndex(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  transition: 'stroke-width 220ms ease, opacity 200ms ease',
                  opacity: activeIndex === null || isActive ? 1 : 0.42,
                }}
              />
            )
          })}
        </svg>

        {/* الوسط التفاعلي: يعرض القسم المختار (اسم + مبلغ + نسبة) أو الإجمالي */}
        <button
          type="button"
          className={styles.center}
          onClick={() => {
            if (safeSelected !== null) {
              triggerHapticFeedback('light')
              setSelectedIndex(null)
            }
          }}
          aria-label={
            activeSeg ? 'إظهار الإجمالي الكلي' : `${centerLabel}: ${money(total)}`
          }
        >
          {activeSeg ? (
            <>
              <span
                className={styles.centerPercent}
                style={{ color: activeSeg.color }}
              >
                {(activeSeg.percent * 100).toFixed(1)}%
              </span>
              <span className={styles.centerValue}>
                {money(activeSeg.value)}
              </span>
              <span className={styles.centerLabel}>{activeSeg.label}</span>
            </>
          ) : (
            <>
              <span className={styles.centerValue}>{money(total)}</span>
              <span className={styles.centerLabel}>{centerLabel}</span>
            </>
          )}
        </button>
      </div>

      {/* Legend تفاعلي باللمس */}
      <ul className={styles.legend}>
        {segments.map((seg, i) => {
          const isActive = activeIndex === i
          return (
            <li
              key={seg.key}
              role="button"
              tabIndex={0}
              aria-pressed={safeSelected === i}
              className={`${styles.legendItem} ${
                isActive ? styles.legendActive : ''
              }`}
              onClick={() => handleToggleIndex(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleToggleIndex(i)
                }
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className={styles.legendDot}
                style={{ backgroundColor: seg.color }}
              />
              <span className={styles.legendLabel}>{seg.label}</span>
              <span className={styles.legendPct}>
                {Math.round(seg.percent * 100)}%
              </span>
              <span className={styles.legendValue}>{money(seg.value)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function segmentsLengthGap(len) {
  return len <= 1 ? 0 : 2.2
}

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(0)
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default DonutChart
