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

  useEffect(() => {
    setLoading(true)
    getStats(period, zekrId)
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('فشل تحميل الإحصائيات:', err)
        setLoading(false)
      })
  }, [period, zekrId])

  return (
    <div className={styles.stats}>
      <PeriodTabs value={period} onChange={setPeriod} />

      <ZekrFilter adhkar={adhkar} value={zekrId} onChange={setZekrId} />

      {loading ? (
        <div className={styles.message}>جاري التحميل...</div>
      ) : stats ? (
        <>
          <div className={styles.total}>
            <span className={styles.totalLabel}>الإجمالي:</span>
            <span className={styles.totalValue}>{stats.total}</span>
          </div>

          <BarChart labels={stats.labels} values={stats.values} />

          {stats.breakdown && stats.breakdown.length > 0 && (
            <div className={styles.breakdown}>
              <h3 className={styles.breakdownTitle}>التفاصيل</h3>
              <ul className={styles.breakdownList}>
                {stats.breakdown.map((item) => (
                  <li key={item.zekr_id} className={styles.breakdownItem}>
                    <span className={styles.breakdownText}>{item.text}</span>
                    <span className={styles.breakdownCount}>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className={styles.message}>لا توجد بيانات</div>
      )}
    </div>
  )
}

export default StatsTab
