import { useLocation } from 'react-router-dom'
import { BarChart3, BookOpen, Settings, AlertTriangle, RotateCcw } from 'lucide-react'
import { useZekrBootstrap } from '@/queries/zekr'
import WorkspaceShell from '@/components/ui/WorkspaceShell.jsx'
import PageSkeleton from '@/components/ui/PageSkeleton.jsx'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import styles from './Layout.module.scss'

const NAV_ITEMS = [
  { to: '/zekr/hisn', label: 'الحصن', icon: <BookOpen size={20} /> },
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
  '/zekr/hisn': { title: 'مكتبة الذِكر', icon: <BookOpen size={16} /> },
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
    return <PageSkeleton variant="zekr" />
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
    <WorkspaceShell
      accent="zekr"
      meta={meta}
      tabs={NAV_ITEMS}
      className={styles.zekr}
      styles={styles}
    />
  )
}

export default ZekrLayout
