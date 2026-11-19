import { NavLink, useLocation } from 'react-router-dom'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './BottomNav.module.scss'

export default function BottomNav({ items, accent = 'zekr', label = 'التنقل الأساسي' }) {
  const { pathname } = useLocation()
  const activeIndex = items.findIndex((item) =>
    item.end
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`)
  )

  return (
    <nav
      className={styles.nav}
      style={{
        '--nav-accent': `var(--${accent})`,
        '--nav-accent-text': `var(--${accent}-text)`,
        '--nav-accent-soft': `var(--${accent}-soft-strong)`,
        '--nav-count': items.length,
        '--nav-index': Math.max(0, activeIndex),
      }}
      aria-label={label}
    >
      <div className={styles.inner}>
        {activeIndex >= 0 && (
          <div className={styles.sliderTrack} aria-hidden="true">
            <span className={styles.sliderPill} />
          </div>
        )}

        {items.map((item, idx) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => {
              if (idx !== activeIndex) triggerHapticFeedback('light')
            }}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.pill} aria-hidden="true">
              <span className={styles.icon}>{item.icon}</span>
            </span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
