import { useState } from 'react'
import styles from './MonthlyBarChart.module.scss'

const AR_MONTHS_SHORT = [
  'ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون',
  'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس',
]

function monthLabel(yyyyMM) {
  const [, m] = yyyyMM.split('-')
  return AR_MONTHS_SHORT[parseInt(m, 10) - 1] || m
}

function formatShort(n) {
  const num = Number(n || 0)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toFixed(0)
}

/**
 * Bar chart مزدوج: دخل (أخضر) + مصروف (أحمر) لكل شهر.
 * data: [{ month: "YYYY-MM", income, expense, net }]
 */
function MonthlyBarChart({ data = [] }, highLightMonth = null) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📈</span>
        <p>لا توجد بيانات</p>
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income || 0, d.expense || 0)),
    1
  )

  const chartHeight = 160

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart} style={{ height: `${chartHeight + 40}px` }}>
        {data.map((d, i) => {
          const incomeH = ((d.income || 0) / maxValue) * chartHeight
          const expenseH = ((d.expense || 0) / maxValue) * chartHeight
          const isHovered = hoveredIndex === i
          const isSelected = highLightMonth === d.month

          return (
            <div
              key={d.month}
              className={`${styles.column} ${isHovered ? styles.hovered : ''} ${isSelected ? styles.selected : ''}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className={styles.tooltip}>
                  <div className={styles.tooltipMonth}>{d.month}</div>
                  <div className={styles.tooltipRow}>
                    <span className={styles.dotIncome} /> دخل:{' '}
                    <strong>{formatAmount(d.income)}</strong>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span className={styles.dotExpense} /> مصروف:{' '}
                    <strong>{formatAmount(d.expense)}</strong>
                  </div>
                </div>
              )}

              <div className={styles.barsArea} style={{ height: `${chartHeight}px` }}>
                <div
                  className={`${styles.bar} ${styles.barIncome}`}
                  style={{ height: `${incomeH}px` }}
                  title={`دخل: ${formatAmount(d.income)}`}
                />
                <div
                  className={`${styles.bar} ${styles.barExpense}`}
                  style={{ height: `${expenseH}px` }}
                  title={`مصروف: ${formatAmount(d.expense)}`}
                />
              </div>

              <span className={styles.label}>{monthLabel(d.month)}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDotIncome} />
          دخل
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDotExpense} />
          مصروف
        </span>
      </div>
    </div>
  )
}

function formatAmount(n) {
  const num = Number(n || 0)
  return num.toLocaleString('en', { maximumFractionDigits: 0 })
}

export default MonthlyBarChart
