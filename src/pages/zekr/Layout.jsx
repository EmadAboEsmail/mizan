import { Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Settings, AlertTriangle, RotateCcw } from 'lucide-react'
import { useZekrBootstrap } from '@/queries/zekr'
import TopAppBar from '@/components/ui/TopAppBar/TopAppBar.jsx'
import BottomNav from '@/components/ui/BottomNav/BottomNav.jsx'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import styles from './Layout.module.scss'

const NAV_ITEMS = [
  { to: '/zekr/sabh', label: 'السبحة', icon: <TasbihIcon size={20} /> },
  {
    to: '/zekr/stats',
    label: 'الإحصائيات',
    icon: <BarChart3 size={20} strokeWidth={2} />,
  },
  {
    to: '/zekr/settings',
    label: 'الإعدادات',
    icon: <Settings size={20} strokeWidth={2} />,
  },
]

const PAGE_META = {
  '/zekr/stats': {
    title: 'إحصائيات الذكر',
    icon: <BarChart3 size={15} strokeWidth={2.2} />,
  },
  '/zekr/settings': {
    title: 'إعدادات الذكر',
    icon: <Settings size={15} strokeWidth={2.2} />,
  },
  default: {
    title: 'ذِكر',
    icon: <TasbihIcon size={16} />,
  },
}

function ZekrLayout() {
  const { pathname } = useLocation()
  const { isPending, error, refetchAll } = useZekrBootstrap()

  const meta = PAGE_META[pathname] || PAGE_META.default

  if (isPending && !error) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>جاري تجهيز الأذكار...</p>
      </div>
    )
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
    <div className={styles.zekr}>
      <TopAppBar title={meta.title} icon={meta.icon} accent="zekr" />

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
