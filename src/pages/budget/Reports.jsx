import { useState, useMemo, useCallback } from 'react'
import { ArrowLeftRight, Calendar, PieChart } from 'lucide-react'
import { useBudgetUI, getCurrentMonth } from '@/contexts/BudgetContext'
import {
  useCategoriesQuery,
  useSummaryQuery,
  useLimitsQuery,
  useInsightsQuery,
  useMonthlyTrendQuery,
} from '@/queries/budget'
import DonutChart from '@/components/budget/charts/DonutChart.jsx'
import MonthlyBarChart from '@/components/budget/charts/MonthlyBarChart.jsx'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import LimitProgressCard from '@/components/budget/limits/LimitProgressCard.jsx'
import InsightsGrid from '@/components/budget/insights/InsightsGrid.jsx'
import TransactionsTopBar from '@/components/budget/transactions/TransactionsTopBar.jsx'
import TransactionsSummary from '@/components/budget/transactions/TransactionsSummary.jsx'
import MonthPickerSheet from '@/components/ui/MonthPickerSheet/MonthPickerSheet.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import {
  AR_MONTHS_FULL,
  formatAmount,
} from '@/components/budget/transactions/lib/transactionsHelpers.js'
import styles from './Reports.module.scss'

const EMPTY_LIST = []

function formatMonthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const idx = parseInt(m, 10) - 1
  return `${AR_MONTHS_FULL[idx] || m} ${y}`
}

function subtractYear(ym) {
  const [y, m] = ym.split('-')
  return `${parseInt(y, 10) - 1}-${m}`
}

function subtractMonth(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  const date = new Date(y, m - 1 - n, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function resolveCompareMonth(currentMonth, mode, customMonth) {
  if (!currentMonth) return null
  if (mode === 'prev_year') return subtractYear(currentMonth)
  if (mode === 'custom') return customMonth || null
  return null
}

const TREND_OPTIONS = [
  { id: 6, label: '6 أشهر' },
  { id: 12, label: '12 شهر' },
]

const COMPARE_OPTIONS = [
  { id: 'prev', label: 'الشهر السابق' },
  { id: 'prev_year', label: 'العام الماضي' },
  { id: 'custom', label: 'مخصص' },
]

function BudgetReports() {
  const { currentMonth, setCurrentMonth, setCompareMonth } = useBudgetUI()
  const { isPrivate } = usePrivacyMode()

  const [compareMode, setCompareMode] = useState('prev')
  const [customCompareMonth, setCustomCompareMonth] = useState('')
  const [isComparePickerOpen, setIsComparePickerOpen] = useState(false)
  const [trendMonths, setTrendMonths] = useState(6)

  const effectiveCompareMonth = useMemo(
    () => resolveCompareMonth(currentMonth, compareMode, customCompareMonth),
    [currentMonth, compareMode, customCompareMonth]
  )

  // ─── Queries ───
  const { data: categories = EMPTY_LIST } = useCategoriesQuery()
  const { data: summary = null } = useSummaryQuery(currentMonth)
  const { data: limits = null } = useLimitsQuery(currentMonth)
  const { data: insights = null } = useInsightsQuery(
    currentMonth,
    effectiveCompareMonth
  )
  const { data: trend = EMPTY_LIST, isPending: trendLoading } =
    useMonthlyTrendQuery(trendMonths, currentMonth)

  // ─── Handlers ───
  const handleMonthChange = useCallback(
    (nextMonth) => {
      setCurrentMonth(nextMonth)
      setCompareMonth(
        resolveCompareMonth(
          nextMonth === 'all' ? null : nextMonth,
          compareMode,
          customCompareMonth
        )
      )
    },
    [compareMode, customCompareMonth, setCurrentMonth, setCompareMonth]
  )

  const handleCompareModeChange = useCallback(
    (mode) => {
      setCompareMode(mode)
      if (mode === 'custom' && !customCompareMonth) {
        setIsComparePickerOpen(true)
      }
      setCompareMonth(
        resolveCompareMonth(currentMonth, mode, customCompareMonth)
      )
    },
    [currentMonth, customCompareMonth, setCompareMonth]
  )

  const handleCustomCompareChange = useCallback(
    (val) => {
      setCustomCompareMonth(val)
      setCompareMonth(resolveCompareMonth(currentMonth, 'custom', val))
    },
    [currentMonth, setCompareMonth]
  )

  const handleToggleMonthMode = useCallback(() => {
    if (currentMonth === null) {
      handleMonthChange(getCurrentMonth())
    } else {
      handleMonthChange('all')
    }
  }, [currentMonth, handleMonthChange])

  // ─── Derived data ───
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  )

  const donutData = useMemo(() => {
    if (!summary?.by_category?.length) return []
    return summary.by_category
      .map((item) => {
        const cat = expenseCategories.find((c) => c.id === item.category_id)
        if (!cat) return null
        return {
          label: item.category_name,
          value: item.total,
          color: item.category_color || '#C68B3C',
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)
  }, [summary, expenseCategories])

  const topCategories = useMemo(() => {
    if (!summary?.by_category?.length) return []
    return summary.by_category
      .filter((item) =>
        expenseCategories.some((c) => c.id === item.category_id)
      )
      .slice(0, 5)
  }, [summary, expenseCategories])

  const maxCategoryValue = useMemo(
    () => Math.max(...topCategories.map((c) => c.total), 1),
    [topCategories]
  )

  if (!summary) {
    return (
      <EmptyState
        accent="budget"
        icon={<PieChart size={26} strokeWidth={1.8} />}
        title="لا توجد بيانات لعرضها"
        subtitle="ابدأ بإضافة معاملات لتظهر هنا تحليلات مفصلة."
      />
    )
  }

  const hasData = summary.transaction_count > 0

  return (
    <div className={styles.container}>
      {/* شريط الشهر الموحد (Bottom Sheet بدون input[type=month]) */}
      <TransactionsTopBar
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onToggleAll={handleToggleMonthMode}
      />

      {/* شريط المقارنة المدمج */}
      {currentMonth && (
        <div className={styles.compareBar}>
          <span className={styles.compareLabel}>
            <ArrowLeftRight size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>قارن بـ</span>
          </span>

          <div
            className={styles.comparePills}
            role="radiogroup"
            aria-label="فترة المقارنة"
          >
            {COMPARE_OPTIONS.map((opt) => {
              const active = compareMode === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.comparePill} ${
                    active ? styles.comparePillActive : ''
                  }`}
                  onClick={() => {
                    triggerHapticFeedback('light')
                    handleCompareModeChange(opt.id)
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {compareMode === 'custom' && (
            <button
              type="button"
              className={styles.customMonthBtn}
              onClick={() => setIsComparePickerOpen(true)}
            >
              <Calendar size={13} strokeWidth={2.1} aria-hidden="true" />
              <span>
                {customCompareMonth
                  ? formatMonthLabel(customCompareMonth)
                  : 'اختر الشهر'}
              </span>
            </button>
          )}
        </div>
      )}

      {!hasData ? (
        <EmptyState
          accent="budget"
          icon={<PieChart size={26} strokeWidth={1.8} />}
          title="لا توجد معاملات في هذه الفترة"
          subtitle={
            currentMonth === null
              ? 'ابدأ بإضافة معاملات لتظهر تحليلاتك هنا.'
              : 'جرّب اختيار شهر آخر أو عرض كل الفترات.'
          }
        />
      ) : (
        <>
          <TransactionsSummary
            summary={summary}
            insights={insights}
            isAllMonths={currentMonth === null}
          />

          {insights && (
            <InsightsGrid
              insights={insights}
              compareLabel={
                insights.comparison
                  ? formatMonthLabel(insights.comparison.prev_month)
                  : null
              }
            />
          )}

          {/* توزيع المصاريف */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>توزيع المصاريف</h3>
              <span className={styles.sectionHint}>
                {donutData.length} تصنيف
              </span>
            </div>

            {donutData.length === 0 ? (
              <div className={styles.noData}>
                لا توجد مصاريف في هذه الفترة
              </div>
            ) : (
              <DonutChart
                data={donutData}
                size={210}
                thickness={34}
                centerLabel="إجمالي المصروف"
              />
            )}
          </section>

          {/* تقدم الميزانية */}
          {limits && limits.limits.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>حدود الميزانية</h3>
                <span className={styles.sectionHint}>
                  {limits.limits.length} تصنيف
                </span>
              </div>
              <div className={styles.limitsList}>
                {limits.limits.map((limit) => (
                  <LimitProgressCard
                    key={limit.id}
                    limit={limit}
                    category={categories.find(
                      (c) => c.id === limit.category_id
                    )}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          {/* أعلى التصنيفات */}
          {topCategories.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>أعلى التصنيفات إنفاقاً</h3>
              </div>

              <ul className={styles.topList}>
                {topCategories.map((cat, i) => {
                  const catObj = categories.find(
                    (c) => c.id === cat.category_id
                  )
                  const pct = Math.round((cat.total / maxCategoryValue) * 100)

                  return (
                    <li key={cat.category_id} className={styles.topItem}>
                      <span className={styles.topRank}>{i + 1}</span>
                      <CategoryIcon category={catObj} size={34} />
                      <div className={styles.topInfo}>
                        <div className={styles.topRow}>
                          <span className={styles.topName}>
                            {cat.category_name}
                          </span>
                          <span className={styles.topAmount}>
                            {isPrivate ? maskText('') : formatAmount(cat.total)}
                          </span>
                        </div>
                        <div className={styles.topBarWrapper}>
                          <div
                            className={styles.topBar}
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                cat.category_color || 'var(--budget)',
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* الاتجاه الشهري */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>الاتجاه الشهري</h3>
          <div className={styles.trendTabs}>
            {TREND_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`${styles.trendTab} ${
                  trendMonths === opt.id ? styles.trendTabActive : ''
                }`}
                onClick={() => setTrendMonths(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <Skeleton width="100%" height="196px" borderRadius="14px" />
        ) : (
          <MonthlyBarChart data={trend} highlightMonth={currentMonth} />
        )}
      </section>

      {currentMonth && (
        <MonthPickerSheet
          isOpen={isComparePickerOpen}
          onClose={() => setIsComparePickerOpen(false)}
          value={customCompareMonth || subtractMonth(currentMonth, 1)}
          onSelect={handleCustomCompareChange}
          maxMonth={subtractMonth(currentMonth, 1)}
          title="اختر شهر المقارنة"
        />
      )}
    </div>
  )
}

export default BudgetReports
