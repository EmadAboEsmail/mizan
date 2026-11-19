import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import styles from './TopAppBar.module.scss'

export default function TopAppBar({
  title,
  subtitle,
  icon,
  accent = 'zekr',
  backTo = '/',
  backLabel = 'الرئيسية',
  actions,
  compact = false,
}) {
  return (
    <header
      className={`${styles.header} ${compact ? styles.compact : ''}`}
      style={{
        '--bar-accent': `var(--${accent})`,
        '--bar-accent-soft': `var(--${accent}-soft)`,
        '--bar-accent-border': `var(--${accent}-border)`,
      }}
    >
      <div className={styles.inner}>
        <div className={styles.start}>
          <Link
            to={backTo}
            className={styles.backBtn}
            aria-label={`الرجوع إلى ${backLabel}`}
            title={`الرجوع إلى ${backLabel}`}
          >
            <ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" />
          </Link>

          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              {icon && (
                <span className={styles.badge} aria-hidden="true">
                  {icon}
                </span>
              )}
              <h1 className={styles.title}>{title}</h1>
            </div>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
        </div>

        <div className={styles.end}>
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
