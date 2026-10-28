import { Link } from 'react-router-dom'
import { useZekrData } from '@/context/ZekrDataContext'
import styles from './ContinueCard.module.scss'

const ArrowLeftIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

function ContinueCard() {
  const { currentZekrId, allAdhkar, counts, loading } = useZekrData()

  if (loading || !currentZekrId) return null

  const zekr = allAdhkar.find((z) => z.id === currentZekrId)
  if (!zekr) return null

  const count = counts[zekr.id] || 0
  const hasAnyActivity = Object.values(counts).some((c) => c > 0)

  // نظهر بس لو المستخدم بدأ فعلاً
  if (!hasAnyActivity) return null

  return (
    <Link
      to={`/zekr/sabh?zekr=${zekr.id}`}
      className={styles.card}
      aria-label={`تابع ذكر: ${zekr.text}`}
    >
      <div className={styles.content}>
        <span className={styles.label}>تابع من حيث توقفت</span>
        <span className={styles.text}>{zekr.text}</span>
        {count > 0 && (
          <span className={styles.count}>
            العدد الحالي: {count.toLocaleString('en')}
          </span>
        )}
      </div>
      <span className={styles.arrow}>
        <ArrowLeftIcon />
      </span>
    </Link>
  )
}

export default ContinueCard
