import { useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useAdhkarQuery,
  useZekrStatsQuery,
  useZekrStreakQuery,
} from '@/queries/zekr'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { useDailyZekrGoal } from '@/hooks/useDailyZekrGoal.js'
import { useToast } from '@/hooks/useToast.js'
import { downloadCsv, getCsvFilename } from '@/utils/csv.js'
import { downloadOrShareBlob } from '@/utils/fileExport.js'
import { exportZekrStatsXlsx } from '@/services/zekrService.js'
import PeriodTabs from './PeriodTabs.jsx'
import BarChart from './BarChart.jsx'
import ZekrFilter from './ZekrFilter.jsx'
import EmptyStats from './EmptyStats.jsx'
import StreakCard from './StreakCard.jsx'
import ActivityHeatmap from './ActivityHeatmap.jsx'
import ComparisonCard from './ComparisonCard.jsx'
import styles from './StatsTab.module.scss'

const VALID_PERIODS = ['day', 'week', 'month', 'year']
const EMPTY_LIST = []

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
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const { dailyGoal } = useDailyZekrGoal()

  // ===========================
  // URL state
  // ===========================
  const rawPeriod = searchParams.get('period')
  const period = VALID_PERIODS.includes(rawPeriod) ? rawPeriod : 'day'

  const rawZekrId = searchParams.get('zekr')
  const urlZekrId = rawZekrId || null

  const setPeriod = useCallback(
    (newPeriod) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('period', newPeriod)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setZekrId = useCallback(
    (newZekrId) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (newZekrId) next.set('zekr', newZekrId)
        else next.delete('zekr')
        return next
      })
    },
    [setSearchParams]
  )

  // ===========================
  // Queries
  // ===========================
  const { data: allAdhkar = EMPTY_LIST } = useAdhkarQuery()

  // حماية فورية: لا نستعلم بذكر محذوف من الـ URL
  const zekrId = useMemo(() => {
    if (!urlZekrId) return null
    if (allAdhkar.length === 0) return null
    return allAdhkar.some((z) => z.id === urlZekrId) ? urlZekrId : null
  }, [urlZekrId, allAdhkar])

  useEffect(() => {
    if (urlZekrId && allAdhkar.length > 0 && !zekrId) {
      setZekrId(null)
    }
  }, [urlZekrId, allAdhkar.length, zekrId, setZekrId])

  const {
    data: stats = null,
    isPending,
    isFetching,
    error: statsError,
    refetch: refetchStats,
  } = useZekrStatsQuery(period, zekrId, true)

  const {
    data: streak = null,
    isPending: streakLoading,
    refetch: refetchStreak,
  } = useZekrStreakQuery()

  const error = statsError
    ? statsError.message || 'فشل تحميل الإحصائيات'
    : null

  const retry = useCallback(() => {
    refetchStats()
    refetchStreak()
  }, [refetchStats, refetchStreak])

  // ===========================
  // Animated numbers
  // ===========================
  const animatedTotal = useAnimatedNumber(stats?.total ?? 0)

  // ===========================
  // Derived data — memoized for stable references
  // ===========================
  const breakdown = useMemo(() => stats?.breakdown ?? [], [stats?.breakdown])
  const labels = useMemo(() => stats?.labels ?? [], [stats?.labels])
  const values = useMemo(() => stats?.values ?? [], [stats?.values])

  const formatNumber = (num) =>
    typeof num === 'number' ? num.toLocaleString('en') : num || 0

  const topZekr = useMemo(() => {
    if (!breakdown.length) return null
    return breakdown.reduce(
      (prev, curr) => (curr.count > prev.count ? curr : prev),
      breakdown[0]
    )
  }, [breakdown])

  const animatedTopCount = useAnimatedNumber(topZekr?.count ?? 0)

  const maxBreakdownCount = useMemo(() => {
    if (!breakdown.length) return 1
    return Math.max(...breakdown.map((i) => i.count), 1)
  }, [breakdown])

  const bestPeriod = useMemo(() => {
    if (!labels.length || !values.length) return null
    let bestIdx = -1
    let bestVal = -1
    values.forEach((val, i) => {
      if (val > bestVal) {
        bestVal = val
        bestIdx = i
      }
    })
    if (bestIdx === -1 || bestVal <= 0) return null
    return { label: labels[bestIdx], value: bestVal }
  }, [labels, values])

  const worstPeriod = useMemo(() => {
    if (!labels.length || !values.length) return null
    let worstIdx = -1
    let worstVal = Infinity
    values.forEach((val, i) => {
      if (val > 0 && val < worstVal) {
        worstVal = val
        worstIdx = i
      }
    })
    if (worstIdx === -1) return null
    return { label: labels[worstIdx], value: worstVal }
  }, [labels, values])

  const animatedBestValue = useAnimatedNumber(bestPeriod?.value ?? 0)

  const periodUnit = PERIOD_LABELS[period] || 'فترة'

  const selectedZekrName = useMemo(() => {
    if (!zekrId) return null
    const found = allAdhkar.find((z) => z.id === zekrId)
    return found?.text ?? null
  }, [zekrId, allAdhkar])

  // ===========================
  // تصدير Excel (.xlsx) و CSV
  // ===========================
  const buildExportRows = () => {
    const rows = []
    labels.forEach((label, i) => {
      rows.push(['فترة', label, values[i] ?? 0, ''])
    })
    ;(stats?.breakdown ?? []).forEach((item) => {
      rows.push(['ذكر', '', item.count, item.text])
    })
    if (rows.length === 0) {
      rows.push(['—', 'لا توجد بيانات', 0, ''])
    }
    return rows
  }

  const handleExportXlsx = async () => {
    if (!stats) return
    try {
      const headers = ['النوع', 'التسمية', 'العدد', 'الذكر']
      const blob = exportZekrStatsXlsx(headers, buildExportRows())
      const base = getCsvFilename(
        'zekr-stats',
        zekrId ? 'filtered' : period
      ).replace(/\.csv$/i, '.xlsx')
      await downloadOrShareBlob(blob, base, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        title: 'إحصائيات الذكر — مِيزان',
      })
      showToast('تم تصدير ملف Excel بنجاح')
    } catch {
      showToast('تعذّر تصدير ملف Excel', 'error')
    }
  }

  const handleExportCsv = async () => {
    if (!stats) return

    const rows = buildExportRows()
    const filename = getCsvFilename(
      'zekr-stats',
      zekrId ? 'filtered' : period
    )

    try {
      await downloadCsv(filename, ['النوع', 'التسمية', 'العدد', 'الذكر'], rows)
      showToast('تم تصدير إحصائيات الذكر بدعم كامل للعربية')
    } catch {
      showToast('تعذّر تصدير الملف', 'error')
    }
  }

  const dailyGoalPct =
    period === 'day' && !zekrId && dailyGoal > 0
      ? Math.min(100, Math.round(((stats?.total || 0) / dailyGoal) * 100))
      : null

  // ===========================
  // Render
  // ===========================
  return (
    <div className={styles.stats}>
      <PeriodTabs value={period} onChange={setPeriod} />
      <ZekrFilter adhkar={allAdhkar} value={zekrId} onChange={setZekrId} />

      {stats && stats.total > 0 && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportXlsx}
            title="تنزيل الإحصائيات كملف Excel"
          >
            <DownloadIcon />
            <span>تصدير Excel</span>
          </button>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCsv}
            title="تنزيل الإحصائيات كملف CSV"
          >
            <DownloadIcon />
            <span>CSV</span>
          </button>
        </div>
      )}

      {stats && dailyGoalPct !== null && (
        <div className={styles.dailyGoalCard}>
          <div className={styles.dailyGoalTop}>
            <span className={styles.dailyGoalLabel}>هدف الذكر اليومي</span>
            <span className={styles.dailyGoalNums}>
              {formatNumber(stats.total)} / {formatNumber(dailyGoal)} ({dailyGoalPct}%)
            </span>
          </div>
          <div
            className={styles.dailyGoalTrack}
            role="progressbar"
            aria-valuenow={dailyGoalPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.dailyGoalFill}
              style={{ width: `${dailyGoalPct}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
          <button type="button" className={styles.retryBtn} onClick={retry}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {isPending && !stats && (
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

      {stats && (
        <div
          className={`${styles.content} ${isFetching ? styles.updating : ''}`}
        >
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>إجمالي التسبيحات</span>
              <span className={styles.metricValue}>
                {formatNumber(animatedTotal)}
              </span>
              {streak && (streak.current > 0 || streak.longest > 0) && (
                <StreakCard streak={streak} loading={streakLoading} />
              )}

              {stats.comparison && (
                <ComparisonCard
                  comparison={stats.comparison}
                  loading={isFetching}
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
                <span className={styles.metricLabel}>أفضل {periodUnit}</span>
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
                <span className={styles.metricLabel}>أقل {periodUnit}</span>
                <span className={styles.metricValueTop}>
                  {worstPeriod.label}
                </span>
                <span className={styles.metricSub}>
                  {formatNumber(worstPeriod.value)} تسبيحة
                </span>
              </div>
            )}
          </div>

          <BarChart labels={labels} values={values} />

          {streak && <ActivityHeatmap dailyCounts={streak.daily_counts} />}

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
