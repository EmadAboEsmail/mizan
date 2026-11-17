import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useCurrentZekrId } from '@/contexts/ZekrDataContext'
import {
  useAdhkarQuery,
  useCountsQuery,
  useTargetsQuery,
} from '@/queries/zekr'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import styles from './ContinueCard.module.scss'

const EMPTY_LIST = []
const EMPTY_MAP = {}

function ContinueCard() {
  const { data: allAdhkar = EMPTY_LIST, isPending: adhkarLoading } =
    useAdhkarQuery()
  const { data: counts = EMPTY_MAP, isPending: countsLoading } =
    useCountsQuery()
  const { data: targets = EMPTY_MAP } = useTargetsQuery()
  const [currentZekrId] = useCurrentZekrId(allAdhkar)

  if (adhkarLoading || countsLoading || !currentZekrId) return null

  const hasAnyActivity = Object.values(counts).some((c) => c > 0)
  if (!hasAnyActivity) return null

  // نفضّل الذكر الحالي إذا كان عليه نشاط، وإلا نختار أول ذكر نشط
  const activeZekr =
    allAdhkar.find((z) => String(z.id) === String(currentZekrId) && (counts[z.id] || 0) > 0) ||
    allAdhkar.find((z) => (counts[z.id] || 0) > 0) ||
    allAdhkar.find((z) => String(z.id) === String(currentZekrId))

  if (!activeZekr) return null

  const count = counts[activeZekr.id] || 0
  const target = targets[activeZekr.id] ?? activeZekr.default_target ?? null
  const progress = target ? Math.min(100, Math.round((count / target) * 100)) : null

  return (
    <Link
      to={`/zekr/sabh?zekr=${activeZekr.id}`}
      className={styles.card}
      aria-label={`تابع ذكر: ${activeZekr.text}`}
    >
      <div className={styles.iconBox} aria-hidden="true">
        <TasbihIcon size={22} />
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.label}>تابع وردك</span>
          <span className={styles.count}>
            {count.toLocaleString('en')}
            {target ? ` / ${target.toLocaleString('en')}` : ''}
          </span>
        </div>

        <span className={styles.text}>{activeZekr.text}</span>

        {progress !== null && (
          <div className={styles.progressTrack} aria-hidden="true">
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <span className={styles.arrow} aria-hidden="true">
        <ChevronLeft size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}

export default ContinueCard
