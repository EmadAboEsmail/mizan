import { Sun, Moon, MoonStar, Check, Smartphone, Type } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext.jsx'
import {
  useVibrationEnabled,
  setVibrationEnabled,
} from '@/hooks/useVibrationEnabled.js'
import {
  ZEKR_FONT_SCALES,
  useZekrFontPrefs,
} from '@/hooks/useZekrFontScale.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import SettingsSection from './SettingsSection.jsx'
import styles from './AppearanceSection.module.scss'

const THEME_CARDS = [
  { id: 'light', label: 'فاتح', className: 'lightCard', Icon: Sun },
  { id: 'dark', label: 'داكن دافئ', className: 'darkCard', Icon: Moon },
  { id: 'amoled', label: 'AMOLED', className: 'amoledCard', Icon: MoonStar },
]

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const vibrationEnabled = useVibrationEnabled()
  const { scaleKey, scale, fontStyle, setScaleKey, setFontStyle } =
    useZekrFontPrefs()

  const handleSelectTheme = (selectedTheme) => {
    if (theme === selectedTheme) return
    triggerHapticFeedback('light')
    setTheme(selectedTheme)
  }

  const handleToggleVibration = () => {
    const next = !vibrationEnabled
    setVibrationEnabled(next)
    if (next) {
      triggerHapticFeedback('medium')
    }
  }

  return (
    <SettingsSection id="appearance" title="المظهر والخط">
      <div className={styles.container}>
        <p className={styles.hint}>
          اختر المظهر المريح لعينيك (وضع AMOLED يطفئ بكسلات الشاشة تماماً):
        </p>

        {/* شبكة خيارات الثيم المرئية (3 أوضاع) */}
        <div
          className={styles.grid}
          role="radiogroup"
          aria-label="اختيار المظهر"
        >
          {THEME_CARDS.map(({ id, label, className, Icon }) => {
            const isActive = theme === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`${styles.card} ${isActive ? styles.active : ''} ${
                  styles[className]
                }`}
                onClick={() => handleSelectTheme(id)}
              >
                <div className={styles.preview}>
                  <div className={styles.previewHeader} />
                  <div className={styles.previewCircle} />
                  <div className={styles.previewBar} />
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardLabel}>
                    <span className={styles.icon}>
                      <Icon size={15} strokeWidth={2.1} aria-hidden="true" />
                    </span>
                    <span>{label}</span>
                  </div>
                  {isActive && (
                    <div className={styles.checkBadge}>
                      <Check size={11} strokeWidth={3} aria-hidden="true" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ═══ خط الأذكار وحجمه ═══ */}
        <div className={styles.fontCard}>
          <div className={styles.fontHeader}>
            <span className={styles.toggleIcon} aria-hidden="true">
              <Type size={17} strokeWidth={2.2} />
            </span>
            <div className={styles.toggleText}>
              <span className={styles.toggleLabel}>خط الأذكار وحجم القراءة</span>
              <span className={styles.toggleHint}>
                خط النسخ «أميري» يعمل بدون إنترنت ويبرز التشكيل بوضوح
              </span>
            </div>
          </div>

          <div
            className={styles.fontStyleRow}
            role="radiogroup"
            aria-label="نوع خط الأذكار"
          >
            {[
              { id: 'naskh', label: 'نسخ مصحفي (أميري)' },
              { id: 'modern', label: 'عصري (إسكندرية)' },
            ].map((opt) => {
              const active = fontStyle === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.stylePill} ${
                    active ? styles.stylePillActive : ''
                  }`}
                  onClick={() => {
                    triggerHapticFeedback('light')
                    setFontStyle(opt.id)
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div
            className={styles.scaleRow}
            role="radiogroup"
            aria-label="حجم خط الأذكار"
          >
            {ZEKR_FONT_SCALES.map((opt) => {
              const active = scaleKey === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.scalePill} ${
                    active ? styles.scalePillActive : ''
                  }`}
                  onClick={() => {
                    triggerHapticFeedback('light')
                    setScaleKey(opt.id)
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div className={styles.fontPreview} aria-label="معاينة خط الذكر">
            <span
              className={
                fontStyle === 'naskh'
                  ? styles.previewNaskh
                  : styles.previewModern
              }
              style={{
                fontSize: `${(
                  (fontStyle === 'naskh' ? 1.28 : 1.12) * scale
                ).toFixed(2)}rem`,
              }}
            >
              سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ
            </span>
          </div>
        </div>

        {/* ═══ الاهتزاز عند التسبيح ═══ */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleIcon} aria-hidden="true">
              <Smartphone size={17} strokeWidth={2.1} />
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
            className={`${styles.switch} ${
              vibrationEnabled ? styles.switchOn : ''
            }`}
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
