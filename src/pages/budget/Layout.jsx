import { Outlet, useLocation } from 'react-router-dom'
import {
  ReceiptText,
  PieChart,
  Settings,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { useBudgetUI } from '@/contexts/BudgetContext'
import { useBudgetBootstrap } from '@/queries/budget'
import TopAppBar from '@/components/ui/TopAppBar/TopAppBar.jsx'
import BottomNav from '@/components/ui/BottomNav/BottomNav.jsx'
import PageSkeleton from '@/components/ui/PageSkeleton.jsx'
import PrivacyToggle from '@/components/ui/PrivacyToggle.jsx'
import BudgetLockGate from '@/components/budget/BudgetLockGate.jsx'
import { BudgetIcon } from '@/components/ui/BrandIcons.jsx'
import styles from './Layout.module.scss'

const NAV_ITEMS = [
  {
    to: '/budget/transactions',
    label: 'المعاملات',
    icon: <ReceiptText size={20} strokeWidth={2} />,
  },
  {
    to: '/budget/reports',
    label: 'التقارير',
    icon: <PieChart size={20} strokeWidth={2} />,
  },
  {
    to: '/budget/settings',
    label: 'الإعدادات',
    icon: <Settings size={20} strokeWidth={2} />,
  },
]

const PAGE_META = {
  '/budget/reports': {
    title: 'التقارير والتحليلات',
    icon: <PieChart size={15} strokeWidth={2.2} />,
  },
  '/budget/settings': {
    title: 'إعدادات الميزانية',
    icon: <Settings size={15} strokeWidth={2.2} />,
  },
  default: {
    title: 'الميزانية',
    icon: <BudgetIcon size={16} />,
  },
}

function BudgetLayout() {
  const { pathname } = useLocation()
  const { currentMonth } = useBudgetUI()
  const { isPending, error, refetchAll } = useBudgetBootstrap(currentMonth)

  const meta = PAGE_META[pathname] || PAGE_META.default

  if (isPending && !error) {
    return <PageSkeleton variant="budget" />
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon} aria-hidden="true">
            <AlertTriangle size={28} strokeWidth={2} />
          </div>
          <h2 className={styles.errorTitle}>تعذر تحميل البيانات</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={refetchAll}
          >
            <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <BudgetLockGate>
      <div className={styles.budget}>
        <TopAppBar
          title={meta.title}
          icon={meta.icon}
          accent="budget"
          actions={<PrivacyToggle />}
        />

        <div className={styles.container}>
          <main
            key={pathname}
            className={`${styles.content} mizan-page-enter`}
          >
            <Outlet />
          </main>
        </div>

        <BottomNav items={NAV_ITEMS} accent="budget" />
      </div>
    </BudgetLockGate>
  )
}

export default BudgetLayout
