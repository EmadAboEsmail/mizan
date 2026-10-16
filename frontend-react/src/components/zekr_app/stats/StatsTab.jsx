import { useState, useEffect } from 'react'
import { getStats } from '@/api/client.js'
import PeriodTabs from './PeriodTabs.jsx'
import BarChart from './BarChart.jsx'
import ZekrFilter from './ZekrFilter.jsx'
import styles from './StatsTab.module.scss'

function StatsTab({ adhkar }) {
  const [period, setPeriod] = useState('day')
  const [zekrId, setZekrId] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)

    getStats(period, zekrId)
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
  }, [period, zekrId])

  const formatNumber = (num) => {
    return typeof num === 'number' ? num.toLocaleString('en') : num || 0
  }

  // حساب أعلى ذكر تم قراءته
  const topZekr = stats?.breakdown?.length
    ? stats.breakdown.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), stats.breakdown[0])
    : null

  const maxBreakdownCount = stats?.breakdown?.length
    ? Math.max(...stats.breakdown.map((i) => i.count), 1)
    : 1

  return (
    <div className={styles.stats}>
      {/* 1. التبويبات والفلاتر */}
      <PeriodTabs value={period} onChange={setPeriod} />
      <ZekrFilter adhkar={adhkar} value={zekrId} onChange={setZekrId} />

      {/* 2. رسالة الخطأ */}
      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️ {error}</span>
          <button className={styles.retryBtn} onClick={() => setPeriod((p) => p)}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* 3. هيكل التحميل (Skeleton Loader) */}
      {loading && !stats && (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonCards}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
          <div className={styles.skeletonChart} />
        </div>
      )}

      {/* 4. عرض المحتوى الإحصائي */}
      {stats && (
        <div className={`${styles.content} ${loading ? styles.updating : ''}`}>

          {/* كروت الأرقام السريعة (Metrics) */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>إجمالي التسبيحات</span>
              <span className={styles.metricValue}>{formatNumber(stats.total)}</span>
            </div>

            {topZekr && topZekr.count > 0 && (
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>أعلى ذكر تكراراً</span>
                <span className={styles.metricValueTop} title={topZekr.text}>
                  {topZekr.text}
                </span>
                <span className={styles.metricSub}>{formatNumber(topZekr.count)} مرة</span>
              </div>
            )}
          </div>

          {/* الرسم البياني */}
          <BarChart
            labels={stats.labels ?? []}
            values={stats.values ?? []}
          />

          {/* تفاصيل كل ذكر بأشرطة ملونة */}
          {stats.breakdown && stats.breakdown.length > 0 ? (
            <div className={styles.breakdownSection}>
              <h3 className={styles.sectionTitle}>تفاصيل الأذكار</h3>
              <ul className={styles.breakdownList}>
                {stats.breakdown.map((item) => {
                  const percentage = Math.round((item.count / maxBreakdownCount) * 100)
                  return (
                    <li key={item.zekr_id} className={styles.breakdownItem}>
                      {/* شريط التقدم الخلفي */}
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
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>📿</div>
              <p className={styles.emptyTitle}>لا توجد تسبيحات في هذه الفترة</p>
              <p className={styles.emptySub}>ابدأ بالذكر وسيظهر تقدمك هنا مباشرة.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default StatsTab
