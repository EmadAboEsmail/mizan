import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Plus, Target } from 'lucide-react'
import { useZekrStreakQuery } from '@/queries/zekr'
import { useTransactionsQuery, useLimitsQuery } from '@/queries/budget'
import { getCurrentMonth } from '@/contexts/BudgetContext'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { TasbihIcon, BudgetIcon } from '@/components/ui/BrandIcons.jsx'
import styles from './TodayBalanceCard.module.scss'

const EMPTY_LIST = []

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TodayBalanceCard() {
  const thisMonth = useMemo(() => getCurrentMonth(), [])
  const today = useMemo(() => todayISO(), [])
  const { isPrivate } = usePrivacyMode()

  const { data: streak = null } = useZekrStreakQuery()
  const { data: txns = EMPTY_LIST } = useTransactionsQuery(thisMonth)
  const { data: limits = null } = useLimitsQuery(thisMonth)

  const todayCount = Number(streak?.today_count) || 0
  const streakDays = Number(streak?.current) || 0

  const todayExpense = useMemo(() => {
    let sum = 0
    for (const t of txns) {
      if (t.type === 'expense' && t.date === today) {
        sum += Number(t.amount) || 0
      }
    }
    return Math.round(sum * 100) / 100
  }, [txns, today])

  const hasLimits = Boolean(limits?.limits?.length > 0 && limits.total_limit > 0)
  const limitRemaining = hasLimits
    ? Math.round((limits.total_limit - limits.total_spent) * 100) / 100
    : null
  const limitPct = hasLimits
    ? Math.min(100, Math.round(limits.total_percent || 0))
    : 0
  const limitTone =
    !hasLimits
      ? 'safe'
      : (limits.total_percent || 0) >= 100
        ? 'over'
        : (limits.total_percent || 0) >= 80
          ? 'warn'
          : 'safe'

  const fmtMoney = (n) =>
    isPrivate
      ? maskText('ج.م')
      : `${Math.abs(n).toLocaleString('en', { maximumFractionDigits: 0 })} ج.م`

  return (
    <section className={styles.card} aria-label="توازن اليوم">
      <div className={styles.header}>
        <span className={styles.heading}>توازن اليوم</span>
        <Link to="/budget/transactions?add=1" className={styles.quickAddBtn}>
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" />
          <span>مصروف سريع</span>
        </Link>
      </div>

      <div className={styles.halves}>
        {/* كفّة الذكر */}
        <Link to="/zekr/sabh" className={`${styles.half} ${styles.zekrHalf}`}>
          <div className={styles.halfTop}>
            <span className={`${styles.badge} ${styles.badgeZekr}`} aria-hidden="true">
              <TasbihIcon size={15} />
            </span>
            <span className={styles.halfLabel}>ذِكر اليوم</span>
          </div>

          <strong className={styles.halfValue}>
            {todayCount.toLocaleString('en')}
            <span className={styles.unit}>تسبيحة</span>
          </strong>

          <span className={styles.halfMeta}>
            {streakDays > 0 ? (
              <span className={styles.streakTag}>
                <Flame size={12} strokeWidth={2.3} aria-hidden="true" />
                <span>
                  {streakDays === 1
                    ? 'يوم مداومة'
                    : `${streakDays.toLocaleString('en')} أيام متتالية`}
                </span>
              </span>
            ) : (
              'ابدأ تسبيحات يومك'
            )}
          </span>
        </Link>

        <span className={styles.divider} aria-hidden="true" />

        {/* كفّة المال */}
        <Link
          to="/budget/transactions"
          className={`${styles.half} ${styles.budgetHalf}`}
        >
          <div className={styles.halfTop}>
            <span
              className={`${styles.badge} ${styles.badgeBudget}`}
              aria-hidden="true"
            >
              <BudgetIcon size={15} />
            </span>
            <span className={styles.halfLabel}>صرف اليوم</span>
          </div>

          <strong className={styles.halfValue}>
            {isPrivate
              ? maskText('')
              : todayExpense.toLocaleString('en', { maximumFractionDigits: 0 })}
            <span className={styles.unit}>ج.م</span>
          </strong>

          <span className={styles.halfMeta}>
            {todayExpense === 0 ? 'لم يُسجّل مصروف اليوم' : 'اضغط لعرض السجل'}
          </span>
        </Link>
      </div>

      {hasLimits && (
        <Link
          to="/budget/reports"
          className={`${styles.limitFooter} ${styles[`tone_${limitTone}`]}`}
        >
          <div className={styles.limitRow}>
            <span className={styles.limitLabel}>
              <Target size={12} strokeWidth={2.3} aria-hidden="true" />
              <span>
                {limitRemaining >= 0
                  ? `متبقي من حد الشهر: ${fmtMoney(limitRemaining)}`
                  : `تجاوز حد الشهر بـ ${fmtMoney(limitRemaining)}`}
              </span>
            </span>
            <span className={styles.limitPct}>{limitPct}%</span>
          </div>
          <div className={styles.limitTrack}>
            <span
              className={styles.limitFill}
              style={{ width: `${limitPct}%` }}
            />
          </div>
        </Link>
      )}
    </section>
  )
}
