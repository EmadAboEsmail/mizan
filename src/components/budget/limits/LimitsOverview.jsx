import { Link } from 'react-router-dom'
import { Target, ChevronLeft } from 'lucide-react'
import { useBudgetUI } from '@/contexts/BudgetContext'
import { useLimitsQuery } from '@/queries/budget'
import styles from './LimitsOverview.module.scss'

function formatCompact(n) {
  return Number(n || 0).toLocaleString('en', { maximumFractionDigits: 0 })
}

function LimitsOverview() {
  const { currentMonth } = useBudgetUI()
  const { data: limits } = useLimitsQuery(currentMonth)

  if (!currentMonth || !limits || limits.limits.length === 0) return null

  const { total_limit, total_spent, total_percent } = limits
  const status =
    total_percent >= 100 ? 'over' : total_percent >= 75 ? 'warning' : 'safe'

  const statusLabel = {
    safe: 'ضمن الحد',
    warning: 'قريب من الحد',
    over: 'تجاوز الحد',
  }[status]

  return (
    <Link
      to="/budget/settings"
      className={`${styles.card} ${styles[status]}`}
      title="إدارة حدود الميزانية الشهرية"
    >
      <span className={styles.icon} aria-hidden="true">
        <Target size={17} strokeWidth={2.1} />
      </span>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.label}>
            حد الميزانية · <strong className={styles.status}>{statusLabel}</strong>
          </span>
          <span className={styles.numbers}>
            <strong>{formatCompact(total_spent)}</strong>
            <span> / {formatCompact(total_limit)}</span>
          </span>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(total_percent, 100)}%` }}
          />
        </div>
      </div>

      <ChevronLeft
        size={16}
        strokeWidth={2.2}
        className={styles.arrow}
        aria-hidden="true"
      />
    </Link>
  )
}

export default LimitsOverview
