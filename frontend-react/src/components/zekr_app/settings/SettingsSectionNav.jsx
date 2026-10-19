import {
  SETTINGS_SECTIONS,
  useSettingsAccordion,
} from './SettingsAccordionContext'
import styles from './SettingsSectionNav.module.scss'

function SettingsSectionNav() {
  const { openIds, scrollTo } = useSettingsAccordion()

  return (
    <nav className={styles.nav} aria-label="التنقل بين أقسام الإعدادات">
      {SETTINGS_SECTIONS.map((section) => {
        const isOpen = openIds.includes(section.id)
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollTo(section.id)}
            className={`${styles.chip} ${isOpen ? styles.active : ''}`}
            aria-label={`الانتقال إلى ${section.label}`}
          >
            <span className={styles.chipIcon} aria-hidden="true">
              {section.icon}
            </span>
            <span className={styles.chipLabel}>{section.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default SettingsSectionNav

