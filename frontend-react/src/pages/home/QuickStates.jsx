import { useZekrData } from '@/context/ZekrDataContext'
import styles from './QuickStats.module.scss'

function QuickStats() {
  const { allAdhkar, groups, counts, loading } = useZekrData()

  // مفيش بيانات → نخفي
  if (loading || allAdhkar.length === 0) return null

  const totalClicks = Object.values(counts).reduce((sum, c) => sum + c, 0)

  const items = [
    { icon: '📿', value: allAdhkar.length, label: 'ذكر' },
    groups.length > 0 && {
      icon: '📂',
      value: groups.length,
      label: 'مجموعة',
    },
    totalClicks > 0 && {
      icon: '✅',
      value: totalClicks,
      label: 'تسبيحة',
    },
  ].filter(Boolean)

  return (
    <div className={styles.stats} aria-label="ملخص نشاطك">
      {items.map((item, i) => (
        <span key={i} className={styles.stat}>
          <span className={styles.icon} aria-hidden="true">
            {item.icon}
          </span>
          <strong className={styles.value}>
            {item.value.toLocaleString('en')}
          </strong>
          <span className={styles.label}>{item.label}</span>
        </span>
      ))}
    </div>
  )
}

export default QuickStats
