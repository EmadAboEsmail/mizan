import { useState } from 'react'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './MonthlyBarChart.module.scss'

const AR_MONTHS_SHORT = [
  'ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون',
  'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس',
]

const AR_MONTHS_FULL = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function monthLabel(yyyyMM) {
  const [, m] = String(yyyyMM || '').split('-')
  return AR_MONTHS_SHORT[parseInt(m, 10) - 1] || m
}

function monthFullLabel(yyyyMM) {
  const [y, m] = String(yyyyMM || '').split('-')
  const name = AR_MONTHS_FULL[parseInt(m, 10) - 1] || m
  return y ? `${name} ${y}` : name
}

function MonthlyBarChart({ data = [], highlightMonth = null }) {
  const { isPrivate } = usePrivacyMode()
  const [selectedIndex, setSelectedIndex] = useState(null)
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

  const chartHeight = 152
  const safeSelected =
    selectedIndex !== null && selectedIndex < data.length ? selectedIndex : null
  const activeIdx = hoveredIndex !== null ? hoveredIndex : safeSelected
  const activeItem = activeIdx !== null ? data[activeIdx] : null
  const money = (v) => (isPrivate ? maskText('') : formatAmount(v))

  return (
    <div className={styles.wrapper}>
      {/* شريط تفاصيل الشهر المختار باللمس — واضح دون أن يحجبه الإصبع */}
      <div className={styles.activeBanner} aria-live="polite">
        {activeItem ? (
          <>
            <strong className={styles.bannerMonth}>
              {monthFullLabel(activeItem.month)}
            </strong>
            <span className={styles.bannerStat}>
              <span className={styles.dotIncome} />
              دخل: <strong>{money(activeItem.income)}</strong>
            </span>
            <span className={styles.bannerStat}>
              <span className={styles.dotExpense} />
              مصروف: <strong>{money(activeItem.expense)}</strong>
            </span>
          </>
        ) : (
          <span className={styles.bannerHint}>
            اضغط على أي شهر لعرض تفاصيل الدخل والمصروف
          </span>
        )}
      </div>

      <div className={styles.chart} style={{ height: `${chartHeight + 36}px` }}>
        {data.map((d, i) => {
          const incomeH = ((d.income || 0) / maxValue) * chartHeight
          const expenseH = ((d.expense || 0) / maxValue) * chartHeight
          const isActive = activeIdx === i
          const isSelected = highlightMonth === d.month

          return (
            <button
              key={d.month}
              type="button"
              className={[
                styles.column,
                isActive ? styles.hovered : '',
                isSelected || isActive ? styles.selected : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                triggerHapticFeedback('light')
                setSelectedIndex((prev) => (prev === i ? null : i))
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-pressed={safeSelected === i}
              aria-label={`${monthFullLabel(d.month)}: دخل ${money(
                d.income
              )}، مصروف ${money(d.expense)}`}
            >
              <div
                className={styles.barsArea}
                style={{ height: `${chartHeight}px` }}
              >
                <div
                  className={`${styles.bar} ${styles.barIncome}`}
                  style={{ height: `${incomeH}px` }}
                />
                <div
                  className={`${styles.bar} ${styles.barExpense}`}
                  style={{ height: `${expenseH}px` }}
                />
              </div>

              <span className={styles.label}>{monthLabel(d.month)}</span>
            </button>
          )
        })}
      </div>

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
