import styles from './InsightsGrid.module.scss'

const AR_MONTHS = [
  'ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون',
  'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس',
]

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(0)
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(s) {
  if (!s) return '—'
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${parseInt(parts[2], 10)} ${AR_MONTHS[parseInt(parts[1], 10) - 1] || parts[1]}`
}

function ChangeBadge({ value, invert = false }) {
  if (value === 0 || value === null || value === undefined) {
    return <span className={styles.changeNeutral}>—</span>
  }
  const isPositive = value > 0
  const isGood = invert ? !isPositive : isPositive
  return (
    <span className={`${styles.changeBadge} ${isGood ? styles.up : styles.down}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function InsightsGrid({ insights, compareLabel = null }) {
  if (!insights) return null

  const {
    avg_daily_expense = 0,
    avg_daily_income = 0,
    top_expense_day,
    top_expense_category,
    transaction_count = 0,
    savings_rate = 0,
    last_7_days_avg = 0,
    days_elapsed = 0,
    days_in_month = 0,
    comparison,
  } = insights

  const savingsGood = savings_rate >= 0
  const comparisonExpense = comparison?.expense_change_percent
  const comparisonIncome = comparison?.income_change_percent

  return (
    <div className={styles.wrapper}>
      {compareLabel && (
        <div className={styles.compareHeader}>
          📊 مقارنة مع <strong>{compareLabel}</strong>
        </div>
      )}

      <div className={styles.grid}>
        {/* 1. متوسط الصرف اليومي */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>📉</span>
            {comparisonExpense !== undefined && (
              <ChangeBadge value={comparisonExpense} invert />
            )}
          </div>
          <span className={styles.label}>متوسط الصرف اليومي</span>
          <span className={styles.value}>{formatAmount(avg_daily_expense)}</span>
          <span className={styles.sub}>
            خلال {days_elapsed} يوم من {days_in_month}
          </span>
        </div>

        {/* 2. متوسط الدخل اليومي */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>📈</span>
            {comparisonIncome !== undefined && (
              <ChangeBadge value={comparisonIncome} />
            )}
          </div>
          <span className={styles.label}>متوسط الدخل اليومي</span>
          <span className={`${styles.value} ${styles.success}`}>
            {formatAmount(avg_daily_income)}
          </span>
          <span className={styles.sub}>
            {transaction_count} معاملة هذا الشهر
          </span>
        </div>

        {/* 3. نسبة التوفير */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>💎</span>
          </div>
          <span className={styles.label}>نسبة التوفير</span>
          <span
            className={`${styles.value} ${savingsGood ? styles.success : styles.danger
              }`}
          >
            {savings_rate.toFixed(1)}%
          </span>
          <span className={styles.sub}>
            {savingsGood ? 'من الدخل تم توفيره' : 'صرفت أكتر من الدخل'}
          </span>
        </div>

        {/* 4. متوسط آخر 7 أيام */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>📅</span>
          </div>
          <span className={styles.label}>متوسط الصرف (آخر 7 أيام)</span>
          <span className={styles.value}>{formatAmount(last_7_days_avg)}</span>
          <span className={styles.sub}>
            {last_7_days_avg > avg_daily_expense
              ? '⬆️ أعلى من متوسط الشهر'
              : last_7_days_avg < avg_daily_expense
                ? '⬇️ أقل من متوسط الشهر'
                : '= متوسط الشهر'}
          </span>
        </div>

        {/* 5. أعلى يوم صرف */}
        {top_expense_day && (
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.icon}>🔥</span>
            </div>
            <span className={styles.label}>أعلى يوم صرف</span>
            <span className={`${styles.value} ${styles.danger}`}>
              {formatAmount(top_expense_day.amount)}
            </span>
            <span className={styles.sub}>
              {formatDate(top_expense_day.date)}
            </span>
          </div>
        )}

        {/* 6. أعلى تصنيف إنفاقاً */}
        {top_expense_category && (
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.icon}>
                {top_expense_category.category_icon || '📦'}
              </span>
              <span className={styles.percent}>
                {top_expense_category.percent.toFixed(0)}%
              </span>
            </div>
            <span className={styles.label}>أكثر تصنيف إنفاقاً</span>
            <span className={styles.valueCategory}>
              {top_expense_category.category_name}
            </span>
            <span className={styles.sub}>
              {formatAmount(top_expense_category.amount)} ج
            </span>
          </div>
        )}
      </div>
    </div>)
}

export default InsightsGrid
