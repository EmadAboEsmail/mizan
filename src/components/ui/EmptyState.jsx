import { Inbox } from 'lucide-react'
import styles from './EmptyState.module.scss'

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
  actionLabel,
  accent = 'budget',
}) {
  return (
    <div
      className={styles.empty}
      style={{
        '--empty-accent': `var(--${accent})`,
        '--empty-accent-soft': `var(--${accent}-soft)`,
        '--empty-accent-border': `var(--${accent}-border)`,
      }}
    >
      <div className={styles.icon} aria-hidden="true">
        {icon ?? <Inbox size={26} strokeWidth={1.8} />}
      </div>
      {title && <p className={styles.title}>{title}</p>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {action && actionLabel && (
        <button type="button" className={styles.action} onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
