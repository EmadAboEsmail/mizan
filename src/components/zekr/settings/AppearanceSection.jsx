import { useTheme } from '@/contexts/ThemeContext.jsx'
import {
  useVibrationEnabled,
  setVibrationEnabled,
} from '@/hooks/useVibrationEnabled.js'
import SettingsSection from './SettingsSection.jsx'
import styles from './AppearanceSection.module.scss'

// ═══════════════════════════════════════
// أيقونات
// ═══════════════════════════════════════
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const VibrateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="4" width="8" height="16" rx="2" />
    <line x1="4" y1="8" x2="4" y2="16" />
    <line x1="2" y1="10" x2="2" y2="14" />
    <line x1="20" y1="8" x2="20" y2="16" />
    <line x1="22" y1="10" x2="22" y2="14" />
  </svg>
)

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════
function AppearanceSection() {
  const { theme, toggleTheme, setTheme } = useTheme()
  const vibrationEnabled = useVibrationEnabled()

  const handleSelectTheme = (selectedTheme) => {
    if (theme === selectedTheme) return
    if (setTheme) {
      setTheme(selectedTheme)
    } else {
      toggleTheme()
    }
  }

  const handleToggleVibration = () => {
    const next = !vibrationEnabled
    console.log('[Vibration] toggled to:', next)
    setVibrationEnabled(next)
  }

  return (
    <SettingsSection id="appearance" title="المظهر">
      <div className={styles.container}>
        <p className={styles.hint}>
          اختر المظهر المريح لعينيك أثناء التسبيح والقراءة:
        </p>

        {/* شبكة خيارات الثيم المرئية */}
        <div className={styles.grid} role="radiogroup" aria-label="اختيار المظهر">
          {/* خيار الوضع الفاتح */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            className={`${styles.card} ${theme === 'light' ? styles.active : ''} ${styles.lightCard}`}
            onClick={() => handleSelectTheme('light')}
          >
            <div className={styles.preview}>
              <div className={styles.previewHeader} />
              <div className={styles.previewCircle} />
              <div className={styles.previewBar} />
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.cardLabel}>
                <span className={styles.icon}><SunIcon /></span>
                <span>فاتح</span>
              </div>
              {theme === 'light' && (
                <div className={styles.checkBadge}><CheckIcon /></div>
              )}
            </div>
          </button>

          {/* خيار الوضع الداكن */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            className={`${styles.card} ${theme === 'dark' ? styles.active : ''} ${styles.darkCard}`}
            onClick={() => handleSelectTheme('dark')}
          >
            <div className={styles.preview}>
              <div className={styles.previewHeader} />
              <div className={styles.previewCircle} />
              <div className={styles.previewBar} />
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.cardLabel}>
                <span className={styles.icon}><MoonIcon /></span>
                <span>داكن</span>
              </div>
              {theme === 'dark' && (
                <div className={styles.checkBadge}><CheckIcon /></div>
              )}
            </div>
          </button>
        </div>

        {/* 🆕 الاهتزاز عند التسبيح */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleIcon} aria-hidden="true">
              <VibrateIcon />
            </span>
            <div className={styles.toggleText}>
              <span className={styles.toggleLabel}>الاهتزاز عند التسبيح</span>
              <span className={styles.toggleHint}>
                اهتزاز خفيف مع كل ضغطة، وأقوى عند إكمال الهدف
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={vibrationEnabled}
            aria-label="تفعيل الاهتزاز عند التسبيح"
            className={`${styles.switch} ${vibrationEnabled ? styles.switchOn : ''}`}
            onClick={handleToggleVibration}
          >
            <span className={styles.switchThumb} aria-hidden="true" />
          </button>
        </div>
      </div>
    </SettingsSection>
  )
}

export default AppearanceSection
