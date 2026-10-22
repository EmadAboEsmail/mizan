import { useState, useEffect, useMemo, useCallback } from 'react'
import { useBudget } from '@/context/BudgetContext'
import { getMonthlyTrend } from '@/api/budgetClient.js'
import DonutChart from '@/components/budget/charts/DonutChart.jsx'
import MonthlyBarChart from '@/components/budget/charts/MonthlyBarChart.jsx'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import LimitProgressCard from '@/components/budget/limits/LimitProgressCard.jsx'
import styles from './BudgetReports.module.scss'
const TREND_OPTIONS = [
  { id: 6, label: '6 أشهر' },
  { id: 12, label: '12 شهر' },
]

function BudgetReports() {
  const {
    summary,
    categories,
    limits,          // ← جديد
    currentMonth,
    setCurrentMonth,
    loading,
  } = useBudget()
  const [trendMonths, setTrendMonths] = useState(6)
  const [trend, setTrend] = useState([])
  const [trendLoading, setTrendLoading] = useState(true)

  // تحميل الـ trend — مرتبط بالشهر المختار
  useEffect(() => {
    let cancelled = false
    setTrendLoading(true)

    getMonthlyTrend(trendMonths, currentMonth) // ← currentMonth كـ endMonth
      .then((data) => {
        if (!cancelled) {
          setTrend(data)
          setTrendLoading(false)
        }
      })
      .catch((err) => {
        console.error('فشل تحميل الـ trend:', err)
        if (!cancelled) setTrendLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [trendMonths, currentMonth]) // ← أضفنا currentMonth
  // تصنيفات المصاريف بس
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  )

  // بيانات الـ donut (توزيع المصاريف)
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

  // أعلى 5 تصنيفات
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

  // ✅ تبديل بين شهر / كل الفترات
  const handleToggleMonthMode = useCallback(() => {
    if (currentMonth === null) {
      const d = new Date()
      setCurrentMonth(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      )
    } else {
      setCurrentMonth('all')
    }
  }, [currentMonth, setCurrentMonth])

  // Empty state — بس لو مفيش أي بيانات خالص
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

  return (
    <div className={styles.container}>
      {/* ✅ شريط اختيار الشهر/الفترة */}
      <div className={styles.periodBar}>
        <div className={styles.monthControls}>
          <input
            type="month"
            value={currentMonth || ''}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className={styles.monthInput}
            disabled={currentMonth === null}
            aria-label="اختيار الشهر"
          />
          <button
            type="button"
            className={`${styles.allBtn} ${currentMonth === null ? styles.allActive : ''
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
            : new Date(currentMonth + '-01').toLocaleDateString('ar-EG', {
              month: 'long',
              year: 'numeric',
            })}
        </span>
      </div>

      {/* Empty state للفترة المختارة */}
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
          {/* بطاقات ملخص سريعة */}
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
              className={`${styles.card} ${summary.net >= 0 ? styles.positive : styles.negative
                }`}
            >
              <span className={styles.cardLabel}>الصافي</span>
              <span className={styles.cardValue}>
                {summary.net >= 0 ? '+' : ''}
                {formatAmount(summary.net)}
              </span>
            </div>
          </div>

          {/* توزيع المصاريف */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                الاتجاه الشهري
                {currentMonth && trend.length > 0 && (
                  <span className={styles.trendPeriod}>
                    ({trend[0].month} → {trend[trend.length - 1].month})
                  </span>
                )}
              </h3>              <span className={styles.sectionHint}>
                {summary.transaction_count} معاملة
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
          {/* ✅ تقدم الميزانية */}
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
                    category={categories.find((c) => c.id === limit.category_id)}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
          {/* أعلى 5 تصنيفات */}
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
                  const pct = Math.round(
                    (cat.total / maxCategoryValue) * 100
                  )

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
                              backgroundColor:
                                cat.category_color || '#059669',
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

      {/* الرسم البياني الشهري — مستقل عن الشهر المختار (دائمًا يعرض آخر N شهر) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>الاتجاه الشهري</h3>
          <div className={styles.trendTabs}>
            {TREND_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`${styles.trendTab} ${trendMonths === opt.id ? styles.trendTabActive : ''
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
          <MonthlyBarChart
            data={trend}
            highLightMonth={currentMonth}
          />

        )}
      </section>
    </div>
  )
}

export default BudgetReports
