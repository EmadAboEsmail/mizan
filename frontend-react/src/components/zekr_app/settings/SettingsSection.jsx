import styles from './SettingsSection.module.scss'

function SettingsSection({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <section className={`${styles.section} ${className}`}>
      {/* رأس القسم */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleIndicator} />
          <div className={styles.titleTextGroup}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {/* زر أو شارة في أقصى اليسار إن وُجدت */}
        {action && <div className={styles.action}>{action}</div>}
      </div>

      {/* محتوى القسم */}
      <div className={styles.content}>{children}</div>
    </section>
  )
}

export default SettingsSection
