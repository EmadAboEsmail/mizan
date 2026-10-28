import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import styles from './LimitProgressCard.module.scss'

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const STATUS_LABEL = {
  safe: 'آمن',
  warning: 'تحذير',
  over: 'تجاوز',
}

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${decPart}`
}

function LimitProgressCard({
  limit,
  category,
  onEdit,
  onDelete,
  compact = false,
}) {
  if (!limit) return null

  const {
    amount = 0,
    spent = 0,
    remaining = 0,
    percent = 0,
    status = 'safe',
  } = limit

  const clampedPercent = Math.min(percent, 100)
  const statusClass = styles[status] || styles.safe
  const statusLabel = STATUS_LABEL[status] || 'آمن'

  return (
    <div
      className={`${styles.card} ${statusClass} ${compact ? styles.compact : ''
        }`}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <CategoryIcon category={category} size={compact ? 32 : 38} />
          <div className={styles.headerInfo}>
            <span className={styles.name}>
              {category?.name || 'غير محدد'}
            </span>
            <span className={styles.statusBadge}>{statusLabel}</span>
          </div>
        </div>

        {!compact && (onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && (
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.edit}`}
                onClick={() => onEdit(limit)}
                title="تعديل الميزانية"
                aria-label="تعديل"
              >
                <EditIcon />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.danger}`}
                onClick={() => onDelete(limit)}
                title="حذف الميزانية"
                aria-label="حذف"
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.progressWrapper}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>صُرف</span>
          <span className={styles.statValue}>{formatAmount(spent)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>الميزانية</span>
          <span className={styles.statValue}>{formatAmount(amount)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            {remaining >= 0 ? 'متبقي' : 'تجاوز'}
          </span>
          <span
            className={`${styles.statValue} ${remaining < 0 ? styles.negative : ''
              }`}
          >
            {formatAmount(Math.abs(remaining))}
          </span>
        </div>
      </div>

      {!compact && (
        <div className={styles.percentRow}>
          <span className={styles.percentText}>
            {percent.toFixed(1)}% مستهلك
          </span>
        </div>
      )}
    </div>
  )
}

export default LimitProgressCard
