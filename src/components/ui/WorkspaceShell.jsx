import { Outlet, useLocation } from 'react-router-dom'
import { House } from 'lucide-react'
import TopAppBar from './TopAppBar/TopAppBar.jsx'
import BottomNav from './BottomNav/BottomNav.jsx'
import editorial from './WorkspaceShell.module.scss'

const todayTab = { to: '/', end: true, label: 'اليوم', icon: <House size={20} /> }

// Workspace tabs stay local; new workspaces do not crowd the bottom bar.
export default function WorkspaceShell({ accent, meta, tabs, actions, className, styles }) {
  const { pathname } = useLocation()
  return (
    <div className={`${className} ${editorial.shell}`}>
      <TopAppBar {...meta} accent={accent} backLabel="اليوم" actions={actions} />
      <div className={styles.container}>
        <main key={pathname} className={`${styles.content} mizan-page-enter`}>
          <Outlet />
        </main>
      </div>
      <BottomNav items={[todayTab, ...tabs]} accent={accent} label="اليوم وتبويبات المساحة" />
    </div>
  )
}
