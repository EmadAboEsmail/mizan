import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from './AppCard.module.scss'

export default function AppCard({ app, index = 0 }) {
  const isAvailable = !!app.available
  const Component = isAvailable ? Link : 'div'
  const accent = app.accent || 'zekr'

  return (
    <Component
      to={isAvailable ? app.path : undefined}
      className={`${styles.card} ${
        isAvailable ? styles.available : styles.disabled
      }`}
      style={{
        animationDelay: `${index * 0.07 + 0.08}s`,
        '--accent': `var(--${accent})`,
        '--accent-text': `var(--${accent}-text)`,
        '--accent-soft': `var(--${accent}-soft)`,
        '--accent-soft-strong': `var(--${accent}-soft-strong)`,
        '--accent-border': `var(--${accent}-border)`,
      }}
      aria-disabled={!isAvailable || undefined}
    >
      <div className={styles.accentStrip} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          {app.icon}
        </div>

        <span className={styles.category}>{app.category}</span>
      </header>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.name}>{app.name}</h2>
          <span className={styles.tagline}>{app.tagline}</span>
        </div>
        <p className={styles.description}>{app.description}</p>
      </div>

      <footer className={styles.footer}>
        {app.stat && <span className={styles.statPill}>{app.stat}</span>}

        {isAvailable ? (
          <span className={styles.openCta}>
            <span className={styles.openText}>{app.ctaLabel || 'افتح'}</span>
            <span className={styles.arrow} aria-hidden="true">
              <ArrowLeft size={15} strokeWidth={2.4} />
            </span>
          </span>
        ) : (
          <span className={styles.disabledCta}>قيد التطوير</span>
        )}
      </footer>
    </Component>
  )
}
