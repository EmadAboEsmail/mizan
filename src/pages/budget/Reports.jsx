import { useState, useMemo, useCallback } from 'react'
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
import styles from './Reports.module.scss'

// ===========================
// Helpers (outside component)
// ===========================
const AR_MONTHS_FULL = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

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

// ===========================
// Component
// ===========================
function BudgetReports() {
  const { currentMonth, setCurrentMonth, setCompareMonth } = useBudgetUI()

  const [compareMode, setCompareMode] = useState('prev')
  const [customCompareMonth, setCustomCompareMonth] = useState('')
  const [trendMonths, setTrendMonths] = useState(6)

  // ✅ شهر المقارنة مشتق مباشرة بدون useEffect
  const effectiveCompareMonth = useMemo(
    () => resolveCompareMonth(currentMonth, compareMode, customCompareMonth),
    [currentMonth, compareMode, customCompareMonth]
  )

  // ===========================
  // Queries
  // ===========================
  const { data: categories = EMPTY_LIST } = useCategoriesQuery()
  const { data: summary = null } = useSummaryQuery(currentMonth)
  const { data: limits = null } = useLimitsQuery(currentMonth)
  const { data: insights = null } = useInsightsQuery(
    currentMonth,
    effectiveCompareMonth
  )
  const { data: trend = EMPTY_LIST, isPending: trendLoading } =
    useMonthlyTrendQuery(trendMonths, currentMonth)

  // ===========================
  // Handlers
  // ===========================
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

  // ===========================
  // Derived data
  // ===========================
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
          color: item.category_color || '#94a3b8',
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

  const formatAmount = (n) =>
    Number(n || 0).toLocaleString('en', { maximumFractionDigits: 0 })

  // ===========================
  // Empty (no summary at all)
  // ===========================
  if (!summary) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📊</div>
        <p className={styles.emptyTitle}>لا توجد بيانات لعرضها</p>
        <p className={styles.emptySub}>
          ابدأ بإضافة معاملات لتظهر هنا تحليلات مفصلة
        </p>
      </div>
    )
  }

  const hasData = summary.transaction_count > 0

  // ===========================
  // Render
  // ===========================
  return (
    <div className={styles.container}>
      {/* شريط اختيار الشهر */}
      <div className={styles.periodBar}>
        <div className={styles.monthControls}>
          <input
            type="month"
            value={currentMonth || ''}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={styles.monthInput}
            disabled={currentMonth === null}
            aria-label="اختيار الشهر"
          />
          <button
            type="button"
            className={`${styles.allBtn} ${
              currentMonth === null ? styles.allActive : ''
            }`}
            onClick={handleToggleMonthMode}
            title={
              currentMonth === null ? 'العودة للشهر الحالي' : 'عرض كل الفترات'
            }
          >
            {currentMonth === null ? '📅 شهر' : '🗓️ الكل'}
          </button>
        </div>

        <span className={styles.periodLabel}>
          {currentMonth === null
            ? 'كل الفترات'
            : formatMonthLabel(currentMonth)}
        </span>
      </div>

      {/* شريط اختيار فترة المقارنة */}
      {currentMonth && (
        <div className={styles.compareBar}>
          <label className={styles.compareLabel}>
            <span className={styles.compareIcon}>🔄</span>
            <span>قارن مع:</span>
          </label>

          <select
            className={styles.compareSelect}
            value={compareMode}
            onChange={(e) => handleCompareModeChange(e.target.value)}
          >
            <option value="prev">الشهر السابق</option>
            <option value="prev_year">نفس الشهر السنة الماضية</option>
            <option value="custom">شهر مخصص...</option>
          </select>

          {compareMode === 'custom' && (
            <input
              type="month"
              className={styles.compareMonthInput}
              value={customCompareMonth}
              onChange={(e) => handleCustomCompareChange(e.target.value)}
              max={subtractMonth(currentMonth, 1)}
              aria-label="اختر شهر المقارنة"
            />
          )}

          {insights?.comparison && (
            <span className={styles.compareCurrent}>
              📊 مقارنة مع{' '}
              <strong>{formatMonthLabel(insights.comparison.prev_month)}</strong>
            </span>
          )}
        </div>
      )}

      {/* Empty state للفترة */}
      {!hasData ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyTitle}>لا توجد معاملات في هذه الفترة</p>
          <p className={styles.emptySub}>
            {currentMonth === null
              ? 'ابدأ بإضافة معاملات'
              : 'جرّب اختيار فترة أخرى أو عرض كل الفترات'}
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={`${styles.card} ${styles.income}`}>
              <span className={styles.cardLabel}>إجمالي الدخل</span>
              <span className={styles.cardValue}>
                {formatAmount(summary.total_income)}
              </span>
            </div>
            <div className={`${styles.card} ${styles.expense}`}>
              <span className={styles.cardLabel}>إجمالي المصروف</span>
              <span className={styles.cardValue}>
                {formatAmount(summary.total_expense)}
              </span>
            </div>
            <div
              className={`${styles.card} ${
                summary.net >= 0 ? styles.positive : styles.negative
              }`}
            >
              <span className={styles.cardLabel}>الصافي</span>
              <span className={styles.cardValue}>
                {summary.net >= 0 ? '+' : ''}
                {formatAmount(summary.net)}
              </span>
            </div>
          </div>

          {/* KPIs */}
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

          {/* توزيع المصاريف (Donut) */}
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
                size={220}
                thickness={36}
                centerLabel="إجمالي المصروف"
              />
            )}
          </section>

          {/* تقدم الميزانية */}
          {limits && limits.limits.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>تقدم الميزانية</h3>
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
                <h3 className={styles.sectionTitle}>
                  أعلى التصنيفات إنفاقاً
                </h3>
              </div>

              <ul className={styles.topList}>
                {topCategories.map((cat, i) => {
                  const catObj = categories.find(
                    (c) => c.id === cat.category_id
                  )
                  const pct = Math.round((cat.total / maxCategoryValue) * 100)

                  return (
                    <li key={cat.category_id} className={styles.topItem}>
                      <span className={styles.topRank}>#{i + 1}</span>
                      <CategoryIcon category={catObj} size={32} />
                      <div className={styles.topInfo}>
                        <span className={styles.topName}>
                          {cat.category_name}
                        </span>
                        <div className={styles.topBarWrapper}>
                          <div
                            className={styles.topBar}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cat.category_color || '#059669',
                            }}
                          />
                        </div>
                      </div>
                      <span className={styles.topAmount}>
                        {formatAmount(cat.total)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* الاتجاه الشهري (Trend) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            الاتجاه الشهري
            {currentMonth && trend.length > 0 && (
              <span className={styles.trendPeriod}>
                ({trend[0].month} → {trend[trend.length - 1].month})
              </span>
            )}
          </h3>
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
          <div className={styles.skeletonChart} />
        ) : (
          <MonthlyBarChart data={trend} highlightMonth={currentMonth} />
        )}
      </section>
    </div>
  )
}

export default BudgetReports
