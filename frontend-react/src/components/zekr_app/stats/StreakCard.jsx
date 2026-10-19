import styles from './StreakCard.module.scss'

const FlameIcon = () => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 23c-4.97 0-9-4.03-9-9 0-1.66.36-3.34 1.05-4.86.09-.2.32-.3.53-.25.21.05.37.22.4.44.17 1.5.83 2.85 1.87 3.83-.36-2.53.24-5.16 1.67-7.26.09-.13.25-.2.41-.18.16.02.3.12.37.27.55 1.28 1.46 2.36 2.6 3.1-.08-1.15.1-2.32.53-3.4.06-.14.19-.23.34-.25.15-.01.3.05.4.16 2.42 2.75 3.79 6.24 3.79 9.9 0 4.97-4.03 9-9 9z" />
  </svg>
)

function StreakCard({ streak, loading }) {
  if (loading) {
    return (
      <div className={`${styles.card} ${styles.loading}`}>
        <div className={styles.skeletonLine} />
      </div>
    )
  }

  if (!streak) return null

  const { current = 0, longest = 0, total_days = 0 } = streak
  const isActive = current > 0
  const isRecord = current > 0 && current === longest && current > 1

  return (
    <div
      className={`${styles.card} ${isActive ? styles.active : styles.inactive}`}
    >
      <div className={styles.header}>
        <span className={styles.flameWrapper}>
          <FlameIcon />
        </span>
        <span className={styles.label}>
          {isActive ? 'سلسلة متتالية' : 'ابدأ سلسلة جديدة'}
        </span>
      </div>

      <div className={styles.body}>
        <span className={styles.bigNumber}>{current}</span>
        <span className={styles.unit}>
          {current === 1 ? 'يوم' : current === 2 ? 'يومان' : 'أيام'}
        </span>
      </div>

      {isRecord && (
        <div className={styles.recordBadge}>🏆 رقم قياسي!</div>
      )}

      <div className={styles.footer}>
        <span>
          أطول سلسلة: <strong>{longest}</strong>
        </span>
        <span className={styles.dot}>•</span>
        <span>
          إجمالي: <strong>{total_days}</strong> يوم
        </span>
      </div>
    </div>
  )
}

export default StreakCard
