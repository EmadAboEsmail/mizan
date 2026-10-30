import { Link, Outlet } from 'react-router-dom'
import { useBudget } from '@/contexts/BudgetContext'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import BottomNav from '@/components/ui/BottomNav/BottomNav.jsx'
import styles from './Layout.module.scss'

const NAV_ITEMS = [
  { to: '/budget/transactions', label: 'المعاملات', icon: '💳' },
  { to: '/budget/reports', label: 'التقارير', icon: '📊' },
  { to: '/budget/settings', label: 'الإعدادات', icon: '⚙️' },
]

function BudgetLayout() {
  const { loading, error, reload } = useBudget()

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
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <BottomNav items={NAV_ITEMS} accent="budget" />
    </div>
  )
}

export default BudgetLayout
