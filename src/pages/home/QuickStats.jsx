import {
  useAdhkarQuery,
  useGroupsQuery,
  useCountsQuery,
} from '@/queries/zekr'
import styles from './QuickStats.module.scss'

const EMPTY_LIST = []
const EMPTY_MAP = {}

function QuickStats() {
  const { data: allAdhkar = EMPTY_LIST, isPending: adhkarLoading } =
    useAdhkarQuery()
  const { data: groups = EMPTY_LIST } = useGroupsQuery()
  const { data: counts = EMPTY_MAP } = useCountsQuery()

  if (adhkarLoading || allAdhkar.length === 0) return null

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
