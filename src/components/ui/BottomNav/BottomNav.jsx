import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.scss'

export default function BottomNav({ items, accent = 'zekr' }) {
  return (
    <nav
      className={styles.nav}
      style={{
        '--nav-accent': `var(--${accent})`,
        '--nav-accent-soft': `var(--${accent}-soft)`,
      }}
      aria-label="التنقل الأساسي"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
