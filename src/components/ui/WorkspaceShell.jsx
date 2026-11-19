import { useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { House, Menu } from 'lucide-react'
import TopAppBar from './TopAppBar/TopAppBar.jsx'
import BottomNav from './BottomNav/BottomNav.jsx'
import Modal from './Modal.jsx'
import editorial from './WorkspaceShell.module.scss'

const todayTab = { to: '/', end: true, label: 'اليوم', icon: <House size={20} /> }

// Workspace tabs stay local; new workspaces do not crowd the bottom bar.
export default function WorkspaceShell({ accent, meta, tabs, actions, className, styles, navigation = 'bottom' }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const isDrawer = navigation === 'drawer'
  const closeMenu = () => {
    setMenuOpen(false)
    menuButton.current?.focus()
  }
  return (
    <div className={`${className} ${editorial.shell} ${isDrawer ? editorial.drawerShell : ''}`}>
      <TopAppBar {...meta} accent={accent} backLabel="اليوم" actions={<>{actions}{isDrawer && <button ref={menuButton} type="button" className={editorial.menuButton} aria-label="قائمة الذِكر" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} aria-hidden="true" /></button>}</>} />
      <div className={`${styles.container} ${isDrawer ? editorial.drawerContent : ''}`}>
        <main key={pathname} className={`${styles.content} mizan-page-enter`}>
          <Outlet />
        </main>
      </div>
      {isDrawer ? (
        <Modal isOpen={menuOpen} onClose={closeMenu} title="قائمة الذِكر" variant="drawer">
          <nav className={editorial.drawerLinks} aria-label="تنقّل الذِكر">
            {[todayTab, ...tabs].map(({ to, end, label, icon }) => (
              <NavLink key={to} to={to} end={end} onClick={closeMenu}>{icon}<span>{label}</span></NavLink>
            ))}
          </nav>
        </Modal>
      ) : <BottomNav items={[todayTab, ...tabs]} accent={accent} label="اليوم وتبويبات المساحة" />}
    </div>
  )
}
