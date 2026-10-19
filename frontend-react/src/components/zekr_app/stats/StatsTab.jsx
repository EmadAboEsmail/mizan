import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useZekrData } from '@/context/ZekrDataContext'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { getStats, getStreak } from '@/api/client.js'
import { downloadCsv, getCsvFilename } from '@/utils/csv.js'
import PeriodTabs from './PeriodTabs.jsx'
import BarChart from './BarChart.jsx'
import ZekrFilter from './ZekrFilter.jsx'
import EmptyStats from './EmptyStats.jsx'
import StreakCard from './StreakCard.jsx'
import ComparisonCard from './ComparisonCard.jsx'
import styles from './StatsTab.module.scss'
const VALID_PERIODS = ['day', 'week', 'month', 'year']

// تسمية الفترة حسب الـ period
const PERIOD_LABELS = {
  day: 'ساعة',
  week: 'يوم',
  month: 'يوم',
  year: 'شهر',
}

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

function StatsTab() {
  const { allAdhkar } = useZekrData()
  const [searchParams, setSearchParams] = useSearchParams()
  // Streak state
  const [streak, setStreak] = useState(null)
  const [streakLoading, setStreakLoading] = useState(true)
  // ===========================
  // URL state
  // ===========================
  const rawPeriod = searchParams.get('period')
  const period = VALID_PERIODS.includes(rawPeriod) ? rawPeriod : 'day'

  const rawZekrId = searchParams.get('zekr')
  const zekrId = rawZekrId || null

  const setPeriod = (newPeriod) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('period', newPeriod)
        return next
      },
      { replace: true }
    )
  }

  const setZekrId = (newZekrId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newZekrId) next.set('zekr', newZekrId)
      else next.delete('zekr')
      return next
    })
  }

  // ===========================
  // Data state
  // ===========================
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // حماية: لو zekrId في URL غير موجود في adhkar
  useEffect(() => {
    if (
      zekrId &&
      allAdhkar.length > 0 &&
      !allAdhkar.some((z) => z.id === zekrId)
    ) {
      setZekrId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zekrId, allAdhkar])

  // Fetch stats
  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)

    getStats(period, zekrId, true)
      .then((data) => {
        if (isCurrent) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error('فشل تحميل الإحصائيات:', err)
          setError(err.message || 'فشل تحميل الإحصائيات')
          setLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [period, zekrId, refreshTick])
  // Fetch streak
  useEffect(() => {
    let isCurrent = true
    setStreakLoading(true)

    getStreak()
      .then((data) => {
        if (isCurrent) {
          setStreak(data)
          setStreakLoading(false)
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error('فشل تحميل السلسلة:', err)
          setStreakLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [refreshTick]) // ✅ يتحدث مع كل retry
  const retry = () => setRefreshTick((t) => t + 1)

  // ===========================
  // Animated numbers
  // ===========================
  const animatedTotal = useAnimatedNumber(stats?.total ?? 0)

  // ===========================
  // Derived data
  // ===========================
  const formatNumber = (num) =>
    typeof num === 'number' ? num.toLocaleString('en') : num || 0

  const topZekr = useMemo(() => {
    if (!stats?.breakdown?.length) return null
    return stats.breakdown.reduce(
      (prev, curr) => (curr.count > prev.count ? curr : prev),
      stats.breakdown[0]
    )
  }, [stats?.breakdown])

  const animatedTopCount = useAnimatedNumber(topZekr?.count ?? 0)

  const maxBreakdownCount = useMemo(() => {
    if (!stats?.breakdown?.length) return 1
    return Math.max(...stats.breakdown.map((i) => i.count), 1)
  }, [stats?.breakdown])

  // ✅ أفضل/أسوأ فترة (من labels/values)
  const bestPeriod = useMemo(() => {
    if (!stats?.labels?.length || !stats?.values?.length) return null
    let bestIdx = -1
    let bestVal = -1
    stats.values.forEach((val, i) => {
      if (val > bestVal) {
        bestVal = val
        bestIdx = i
      }
    })
    if (bestIdx === -1 || bestVal <= 0) return null
    return { label: stats.labels[bestIdx], value: bestVal }
  }, [stats?.labels, stats?.values])

  const worstPeriod = useMemo(() => {
    if (!stats?.labels?.length || !stats?.values?.length) return null
    // نبحث عن أقل قيمة > 0 (تجاهل الأيام اللي مفيش فيها تسبيح)
    let worstIdx = -1
    let worstVal = Infinity
    stats.values.forEach((val, i) => {
      if (val > 0 && val < worstVal) {
        worstVal = val
        worstIdx = i
      }
    })
    if (worstIdx === -1) return null
    return { label: stats.labels[worstIdx], value: worstVal }
  }, [stats?.labels, stats?.values])

  const animatedBestValue = useAnimatedNumber(bestPeriod?.value ?? 0)

  const periodUnit = PERIOD_LABELS[period] || 'فترة'

  // اسم الذكر المختار
  const selectedZekrName = useMemo(() => {
    if (!zekrId) return null
    const found = allAdhkar.find((z) => z.id === zekrId)
    return found?.text ?? null
  }, [zekrId, allAdhkar])

  // ===========================
  // تصدير CSV
  // ===========================
  const handleExportCsv = () => {
    if (!stats) return

    const rows = []

    // 1. صفوف الفترات (labels/values)
    const labels = stats.labels ?? []
    const values = stats.values ?? []
    labels.forEach((label, i) => {
      rows.push(['فترة', label, values[i] ?? 0, ''])
    })

      // 2. صفوف تفاصيل الأذكار
      ; (stats.breakdown ?? []).forEach((item) => {
        rows.push(['ذكر', '', item.count, item.text])
      })

    // لو مفيش بيانات
    if (rows.length === 0) {
      rows.push(['—', 'لا توجد بيانات', 0, ''])
    }

    const filename = getCsvFilename(
      'zekr-stats',
      zekrId ? 'filtered' : period
    )

    downloadCsv(filename, ['النوع', 'التسمية', 'العدد', 'الذكر'], rows)
  }

  // ===========================
  // Render
  // ===========================
  return (
    <div className={styles.stats}>
      <PeriodTabs value={period} onChange={setPeriod} />
      <ZekrFilter adhkar={allAdhkar} value={zekrId} onChange={setZekrId} />

      {/* شريط الأدوات */}
      {stats && stats.total > 0 && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCsv}
            title="تنزيل الإحصائيات كملف CSV"
          >
            <DownloadIcon />
            <span>تصدير CSV</span>
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️ {error}</span>
          <button type="button" className={styles.retryBtn} onClick={retry}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && !stats && (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonCards}>
            <div className={styles.skeletonCard}>
              <div
                className={styles.skeletonLine}
                style={{ width: '50%', height: '10px' }}
              />
              <div
                className={styles.skeletonLine}
                style={{ width: '70%', height: '24px', marginTop: '0.6rem' }}
              />
            </div>
            <div className={styles.skeletonCard}>
              <div
                className={styles.skeletonLine}
                style={{ width: '50%', height: '10px' }}
              />
              <div
                className={styles.skeletonLine}
                style={{ width: '85%', height: '18px', marginTop: '0.6rem' }}
              />
            </div>
          </div>

          <div className={styles.skeletonChart}>
            <div className={styles.skeletonBars}>
              {[40, 65, 30, 85, 55, 70, 45].map((h, i) => (
                <div
                  key={i}
                  className={styles.skeletonBar}
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {stats && (
        <div className={`${styles.content} ${loading ? styles.updating : ''}`}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>إجمالي التسبيحات</span>
              <span className={styles.metricValue}>
                {formatNumber(animatedTotal)}
              </span>
              {/* 🔥 Streak */}
              {streak && (streak.current > 0 || streak.longest > 0) && (
                <StreakCard streak={streak} loading={streakLoading} />
              )}

              {/* 📈 Comparison */}
              {stats.comparison && (
                <ComparisonCard
                  comparison={stats.comparison}
                  loading={loading}
                />
              )}
            </div>

            {topZekr && topZekr.count > 0 && (
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>أعلى ذكر تكراراً</span>
                <span className={styles.metricValueTop} title={topZekr.text}>
                  {topZekr.text}
                </span>
                <span className={styles.metricSub}>
                  {formatNumber(animatedTopCount)} مرة
                </span>
              </div>
            )}

            {bestPeriod && (
              <div className={`${styles.metricCard} ${styles.highlight}`}>
                <span className={styles.metricLabel}>
                  أفضل {periodUnit}
                </span>
                <span className={styles.metricValueTop}>
                  {bestPeriod.label}
                </span>
                <span className={styles.metricSub}>
                  {formatNumber(animatedBestValue)} تسبيحة
                </span>
              </div>
            )}

            {worstPeriod && worstPeriod.label !== bestPeriod?.label && (
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>
                  أقل {periodUnit}
                </span>
                <span className={styles.metricValueTop}>
                  {worstPeriod.label}
                </span>
                <span className={styles.metricSub}>
                  {formatNumber(worstPeriod.value)} تسبيحة
                </span>
              </div>
            )}
          </div>

          <BarChart labels={stats.labels ?? []} values={stats.values ?? []} />

          {stats.breakdown && stats.breakdown.length > 0 ? (
            <div className={styles.breakdownSection}>
              <h3 className={styles.sectionTitle}>تفاصيل الأذكار</h3>
              <ul className={styles.breakdownList}>
                {stats.breakdown.map((item) => {
                  const percentage = Math.round(
                    (item.count / maxBreakdownCount) * 100
                  )
                  return (
                    <li key={item.zekr_id} className={styles.breakdownItem}>
                      <div
                        className={styles.itemProgressFill}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className={styles.itemContent}>
                        <span className={styles.itemText}>{item.text}</span>
                        <span className={styles.itemBadge}>
                          {formatNumber(item.count)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : stats.total === 0 ? (
            <EmptyStats
              hasAnyAdhkar={allAdhkar.length > 0}
              selectedZekrName={selectedZekrName}
              onClearFilter={() => setZekrId(null)}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

export default StatsTab
