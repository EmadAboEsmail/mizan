import styles from './EmptyState.module.scss'

export default function EmptyState({
  icon = '📭',
  title,
  subtitle,
  action,
  actionLabel,
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
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
