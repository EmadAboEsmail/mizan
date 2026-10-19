import styles from './ComparisonCard.module.scss'

const UpIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const DownIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function ComparisonCard({ comparison, loading }) {
  if (loading) {
    return (
      <div className={`${styles.card} ${styles.loading}`}>
        <div className={styles.skeletonLine} />
      </div>
    )
  }

  if (!comparison) return null

  const {
    change_percent = 0,
    previous_total = 0,
    current_total = 0,
  } = comparison

  // لو الفترتين صفر → مفيش بيانات
  if (previous_total === 0 && current_total === 0) {
    return null
  }

  const isUp = change_percent > 0
  const isDown = change_percent < 0
  const isFlat = change_percent === 0
  const isNew = previous_total === 0 && current_total > 0

  const displayPercent = Math.abs(change_percent).toFixed(1)
  const label = isNew
    ? 'بداية جديدة 🎉'
    : isUp
      ? 'زيادة عن الفترة السابقة'
      : isDown
        ? 'انخفاض عن الفترة السابقة'
        : 'مستقر'

  return (
    <div
      className={`${styles.card} ${isUp
          ? styles.up
          : isDown
            ? styles.down
            : styles.flat
        }`}
    >
      <div className={styles.label}>{label}</div>

      <div className={styles.body}>
        {!isFlat && !isNew && (
          <span className={styles.arrow}>
            {isUp ? <UpIcon /> : <DownIcon />}
          </span>
        )}
        <span className={styles.value}>
          {isNew ? '100%' : `${displayPercent}%`}
        </span>
      </div>

      <div className={styles.footer}>
        <span>
          الفترة السابقة: <strong>{previous_total.toLocaleString('en')}</strong>
        </span>
      </div>
    </div>
  )
}

export default ComparisonCard
