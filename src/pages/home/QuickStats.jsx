import { Layers, CheckCircle2, Flame } from 'lucide-react'
import {
  useAdhkarQuery,
  useGroupsQuery,
  useCountsQuery,
  useZekrStreakQuery,
} from '@/queries/zekr'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import styles from './QuickStats.module.scss'

const EMPTY_LIST = []
const EMPTY_MAP = {}

function QuickStats() {
  const { data: allAdhkar = EMPTY_LIST, isPending: adhkarLoading } =
    useAdhkarQuery()
  const { data: groups = EMPTY_LIST } = useGroupsQuery()
  const { data: counts = EMPTY_MAP } = useCountsQuery()
  const { data: streak = null } = useZekrStreakQuery()

  if (adhkarLoading || allAdhkar.length === 0) return null

  const totalClicks = Object.values(counts).reduce((sum, c) => sum + c, 0)
  const currentStreak = streak?.current || 0

  const items = [
    {
      key: 'adhkar',
      icon: <TasbihIcon size={15} />,
      value: allAdhkar.length,
      label: 'ذكر',
    },
    groups.length > 0 && {
      key: 'groups',
      icon: <Layers size={14} strokeWidth={2.1} />,
      value: groups.length,
      label: 'مجموعة',
    },
    totalClicks > 0 && {
      key: 'clicks',
      icon: <CheckCircle2 size={14} strokeWidth={2.1} />,
      value: totalClicks,
      label: 'تسبيحة',
    },
    currentStreak > 0 && {
      key: 'streak',
      icon: <Flame size={14} strokeWidth={2.1} />,
      value: currentStreak,
      label: currentStreak === 1 ? 'يوم متتالي' : 'أيام متتالية',
      highlight: true,
    },
  ].filter(Boolean)

  if (items.length === 0) return null

  return (
    <div className={styles.stats} aria-label="ملخص نشاطك">
      {items.map((item) => (
        <span
          key={item.key}
          className={`${styles.stat} ${item.highlight ? styles.highlight : ''}`}
        >
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
