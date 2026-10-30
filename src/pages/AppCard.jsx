import { Link } from 'react-router-dom'
import styles from './AppCard.module.scss'

const ArrowIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

export default function AppCard({ app, index = 0 }) {
  const isAvailable = !!app.available
  const Component = isAvailable ? Link : 'div'
  const accentVar = `var(--${app.accent || 'zekr'})`

  return (
    <Component
      to={isAvailable ? app.path : undefined}
      className={`${styles.card} ${isAvailable ? styles.available : styles.disabled
        }`}
      style={{
        animationDelay: `${index * 0.08 + 0.15}s`,
        '--accent': accentVar,
        '--accent-soft': `var(--${app.accent}-soft)`,
        '--accent-border': `var(--${app.accent}-border)`,
      }}
      aria-disabled={!isAvailable}
      aria-label={`${app.name} — ${isAvailable ? 'افتح' : 'قريباً'}`}
    >
      <div className={styles.accentStrip} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.iconWrap}>
          <span className={styles.icon} aria-hidden="true">
            {app.icon}
          </span>
        </div>

        <div className={styles.headerMeta}>
          <span className={styles.category}>{app.category}</span>
          {!isAvailable && (
            <span className={styles.soonBadge}>قريباً</span>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <h2 className={styles.name}>{app.name}</h2>
        <span className={styles.tagline}>{app.tagline}</span>
        <p className={styles.description}>{app.description}</p>
      </div>

      <footer className={styles.footer}>
        {isAvailable ? (
          <span className={styles.openCta}>
            <span>افتح</span>
            <span className={styles.arrow}>
              <ArrowIcon />
            </span>
          </span>
        ) : (
          <span className={styles.disabledCta}>قيد التطوير</span>
        )}
      </footer>
    </Component>
  )
}
