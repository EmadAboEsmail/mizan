import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useZekrData } from '@/context/ZekrDataContext'
import Tabs from '@/components/zekr_app/zekr/Tabs.jsx'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import styles from './ZekrLayout.module.scss'

const TABS = [
  { id: 'sabh', label: 'سبحة', icon: '📿' },
  { id: 'stats', label: 'إحصائيات', icon: '📊' },
  { id: 'settings', label: 'إعدادات', icon: '⚙️' },
]
const VALID_TABS = TABS.map((t) => t.id)

function ZekrLayout() {
  const { loading, error, loadInitialData } = useZekrData()
  const location = useLocation()
  const navigate = useNavigate()

  // الـ activeTab مشتق من الـ URL
  const segment = location.pathname.split('/').filter(Boolean).pop()
  const activeTab = VALID_TABS.includes(segment) ? segment : 'sabh'

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
        <Tabs
          tabs={TABS}
          active={activeTab}
          onChange={(id) => navigate(`/zekr/${id}`)}
        />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ZekrLayout
