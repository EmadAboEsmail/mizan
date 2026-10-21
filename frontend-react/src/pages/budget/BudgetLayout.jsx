import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useBudget } from '@/context/BudgetContext'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import styles from './BudgetLayout.module.scss'

const TABS = [
  { id: 'transactions', label: 'المعاملات', icon: '💳' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]
const VALID_TABS = TABS.map((t) => t.id)

function BudgetLayout() {
  const { loading, error, reload } = useBudget()
  const location = useLocation()
  const navigate = useNavigate()

  const segment = location.pathname.split('/').filter(Boolean).pop()
  const activeTab = VALID_TABS.includes(segment) ? segment : 'transactions'

  if (loading && !error) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>جاري تحميل الميزانية...</p>
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
          <button type="button" className={styles.retryBtn} onClick={reload}>
            إعادة المحاولة ↺
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.budget}>
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
        <h1 className={styles.pageTitle}>💰 الميزانية</h1>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => navigate(`/budget/${tab.id}`)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default BudgetLayout

