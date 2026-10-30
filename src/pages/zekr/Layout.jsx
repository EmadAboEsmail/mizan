import { Link, Outlet } from 'react-router-dom'
import { useZekrData } from '@/contexts/ZekrDataContext'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import BottomNav from '@/components/ui/BottomNav/BottomNav.jsx'
import styles from './Layout.module.scss'

const NAV_ITEMS = [
  { to: '/zekr/sabh', label: 'السبحة', icon: '📿' },
  { to: '/zekr/stats', label: 'الإحصائيات', icon: '📊' },
  { to: '/zekr/settings', label: 'الإعدادات', icon: '⚙️' },
]

function ZekrLayout() {
  const { loading, error, loadInitialData } = useZekrData()

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>جاري تجهيز الأذكار والبيانات...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>تعذر الاتصال بالخادم</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={loadInitialData}>
            إعادة المحاولة ↺
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.zekr}>
      <header className={styles.navHeader}>
        <Link to="/" className={styles.backBtn} title="الرجوع للرئيسية">
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <BottomNav items={NAV_ITEMS} accent="zekr" />
    </div>
  )
}

export default ZekrLayout
