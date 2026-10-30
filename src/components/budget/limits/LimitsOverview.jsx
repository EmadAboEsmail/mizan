import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBudget } from '@/contexts/BudgetContext'
import styles from './LimitsOverview.module.scss'

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(0)
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function LimitsOverview() {
  const { limits, currentMonth } = useBudget()

  if (!currentMonth || !limits || limits.limits.length === 0) return null

  const { total_limit, total_spent, total_remaining, total_percent } = limits
  const status =
    total_percent >= 100 ? 'over' : total_percent >= 75 ? 'warning' : 'safe'

  const statusLabel = {
    safe: 'آمن',
    warning: 'قريب من الحد',
    over: 'تجاوز الميزانية',
  }[status]

  return (
    <Link
      to="/budget/settings"
      className={`${styles.card} ${styles[status]}`}
      title="انتقل لإدارة الميزانية"
    >
      <div className={styles.left}>
        <span className={styles.icon}>💰</span>
        <div className={styles.info}>
          <span className={styles.label}>الميزانية الشهرية</span>
          <span className={styles.status}>{statusLabel}</span>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(total_percent, 100)}%` }}
          />
        </div>
        <span className={styles.percent}>{total_percent.toFixed(1)}%</span>
      </div>

      <div className={styles.right}>
        <span className={styles.spent}>{formatAmount(total_spent)}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.limit}>{formatAmount(total_limit)}</span>
      </div>
    </Link>
  )
}

export default LimitsOverview
