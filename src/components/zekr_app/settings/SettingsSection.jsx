import { useSettingsAccordion } from './SettingsAccordionContext'
import styles from './SettingsSection.module.scss'

const ChevronIcon = () => (
  <svg
    className={styles.chevron}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function SettingsSection({
  id,
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  const { openIds, toggle } = useSettingsAccordion()
  const isOpen = openIds.includes(id)

  return (
    <section
      id={`settings-section-${id}`}
      className={`${styles.section} ${className}`}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.headerToggle}
          onClick={() => toggle(id)}
          aria-expanded={isOpen}
          aria-controls={`settings-content-${id}`}
        >
          <div className={styles.titleIndicator} aria-hidden="true" />
          <div className={styles.titleTextGroup}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <span
            className={`${styles.chevronWrapper} ${isOpen ? styles.chevronOpen : ''
              }`}
          >
            <ChevronIcon />
          </span>
        </button>

        {action && <div className={styles.action}>{action}</div>}
      </div>

      {isOpen && (
        <div id={`settings-content-${id}`} className={styles.content}>
          {children}
        </div>
      )}
    </section>
  )
}

export default SettingsSection

