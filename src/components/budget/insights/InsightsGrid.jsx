import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  CalendarRange,
  Flame,
  ArrowLeftRight,
} from 'lucide-react'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { useCurrency } from '@/hooks/useCurrency.js'
import styles from './InsightsGrid.module.scss'

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

function formatAmount(n) {
  const num = Number(n || 0)
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
    <span
      className={`${styles.changeBadge} ${isGood ? styles.up : styles.down}`}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(0)}%
    </span>
  )
}

function InsightsGrid({ insights, compareLabel = null }) {
  const { isPrivate } = usePrivacyMode()
  const { symbol } = useCurrency()
  if (!insights) return null
  const money = (v) => (isPrivate ? maskText('') : formatAmount(v))

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
          <ArrowLeftRight size={13} strokeWidth={2.2} aria-hidden="true" />
          <span>
            مقارنة مع <strong>{compareLabel}</strong>
          </span>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span
              className={`${styles.iconBadge} ${styles.toneDanger}`}
              aria-hidden="true"
            >
              <TrendingDown size={15} strokeWidth={2.2} />
            </span>
            {comparisonExpense !== undefined && (
              <ChangeBadge value={comparisonExpense} invert />
            )}
          </div>
          <span className={styles.label}>متوسط الصرف اليومي</span>
          <span className={styles.value}>
            {money(avg_daily_expense)}
          </span>
          <span className={styles.sub}>
            خلال {days_elapsed} من {days_in_month} يوم
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span
              className={`${styles.iconBadge} ${styles.toneSuccess}`}
              aria-hidden="true"
            >
              <TrendingUp size={15} strokeWidth={2.2} />
            </span>
            {comparisonIncome !== undefined && (
              <ChangeBadge value={comparisonIncome} />
            )}
          </div>
          <span className={styles.label}>متوسط الدخل اليومي</span>
          <span className={`${styles.value} ${styles.success}`}>
            {money(avg_daily_income)}
          </span>
          <span className={styles.sub}>
            {transaction_count} معاملة مسجّلة
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span
              className={`${styles.iconBadge} ${styles.toneGold}`}
              aria-hidden="true"
            >
              <PiggyBank size={15} strokeWidth={2.1} />
            </span>
          </div>
          <span className={styles.label}>نسبة الادخار</span>
          <span
            className={`${styles.value} ${
              savingsGood ? styles.success : styles.danger
            }`}
          >
            {savings_rate.toFixed(1)}%
          </span>
          <span className={styles.sub}>
            {savingsGood ? 'تم توفيره من الدخل' : 'تجاوز الصرف الدخل'}
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span
              className={`${styles.iconBadge} ${styles.toneGold}`}
              aria-hidden="true"
            >
              <CalendarRange size={15} strokeWidth={2.1} />
            </span>
          </div>
          <span className={styles.label}>متوسط آخر 7 أيام</span>
          <span className={styles.value}>{money(last_7_days_avg)}</span>
          <span className={styles.sub}>
            {last_7_days_avg > avg_daily_expense
              ? 'أعلى من متوسط الشهر'
              : last_7_days_avg < avg_daily_expense
                ? 'أقل من متوسط الشهر'
                : 'مساوٍ لمتوسط الشهر'}
          </span>
        </div>

        {top_expense_day && (
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span
                className={`${styles.iconBadge} ${styles.toneDanger}`}
                aria-hidden="true"
              >
                <Flame size={15} strokeWidth={2.1} />
              </span>
            </div>
            <span className={styles.label}>أعلى يوم صرف</span>
            <span className={`${styles.value} ${styles.danger}`}>
              {money(top_expense_day.amount)}
            </span>
            <span className={styles.sub}>
              {formatDate(top_expense_day.date)}
            </span>
          </div>
        )}

        {top_expense_category && (
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.emojiIcon} aria-hidden="true">
                {top_expense_category.category_icon || '📦'}
              </span>
              <span className={styles.percent}>
                {top_expense_category.percent.toFixed(0)}%
              </span>
            </div>
            <span className={styles.label}>الأكثر إنفاقاً</span>
            <span className={styles.valueCategory}>
              {top_expense_category.category_name}
            </span>
            <span className={styles.sub}>
              {money(top_expense_category.amount)} {symbol}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default InsightsGrid
