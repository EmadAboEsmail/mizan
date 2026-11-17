import { Pencil, Trash2 } from 'lucide-react'
import CategoryIcon from '../CategoryIcon.jsx'
import { formatAmount } from '@/components/budget/transactions/lib/transactionsHelpers.js'
import styles from './LimitProgressCard.module.scss'

function LimitProgressCard({
  limit,
  category,
  onEdit,
  onDelete,
  compact = false,
}) {
  const { category_name, monthly_limit, spent, remaining, percent, status } =
    limit

  const barWidth = Math.min(percent, 100)

  const statusText = {
    safe: `متبقي ${formatAmount(remaining)} ج.م`,
    warning: `متبقي ${formatAmount(remaining)} ج.م · قريب من الحد`,
    over: `تجاوز بمقدار ${formatAmount(Math.abs(remaining))} ج.م`,
  }[status]

  return (
    <div
      className={`${styles.card} ${styles[status]} ${
        compact ? styles.compact : ''
      }`}
    >
      <div className={styles.header}>
        <div className={styles.catInfo}>
          <CategoryIcon category={category} size={compact ? 32 : 38} />
          <div className={styles.catText}>
            <span className={styles.catName}>{category_name}</span>
            <span className={styles.amounts}>
              <strong>{formatAmount(spent)}</strong> من{' '}
              {formatAmount(monthly_limit)} ج.م
            </span>
          </div>
        </div>

        <div className={styles.right}>
          <span className={`${styles.percent} ${styles[`percent_${status}`]}`}>
            {percent.toFixed(0)}%
          </span>
          {(onEdit || onDelete) && (
            <div className={styles.actions}>
              {onEdit && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => onEdit(limit)}
                  aria-label="تعديل الحد"
                  title="تعديل الحد"
                >
                  <Pencil size={15} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => onDelete(limit)}
                  aria-label="حذف الحد"
                  title="حذف الحد"
                >
                  <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${styles[`fill_${status}`]}`}
          style={{ width: `${barWidth}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {!compact && (
        <div className={`${styles.footer} ${styles[`footer_${status}`]}`}>
          {statusText}
        </div>
      )}
    </div>
  )
}

export default LimitProgressCard
