import { useTheme } from '@/context/ThemeContext.jsx'
import SettingsSection from './SettingsSection.jsx'
import styles from './AppearanceSection.module.scss'

function AppearanceSection() {
  const { theme, toggleTheme } = useTheme()

  return (
    <SettingsSection title="المظهر">
      <div className={styles.row}>
        <span className={styles.label}>الثيم الحالي</span>
        <span className={styles.value}>
          {theme === 'dark' ? 'داكن 🌙' : 'فاتح ☀️'}
        </span>
      </div>

      <button className={styles.toggleBtn} onClick={toggleTheme}>
        التبديل إلى {theme === 'dark' ? 'الفاتح' : 'الداكن'}
      </button>
    </SettingsSection>
  )
}

export default AppearanceSection
