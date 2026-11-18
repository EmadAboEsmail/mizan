import { useState } from 'react'
import { Sun, Moon, MoonStar, Lock, Unlock, Fingerprint } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext.jsx'
import { CURRENCIES, useCurrency } from '@/hooks/useCurrency.js'
import { useBudgetLock } from '@/hooks/useBudgetLock.js'
import { useToast } from '@/hooks/useToast.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import CategoriesSection from '@/components/budget/settings/CategoriesSection.jsx'
import WalletsSection from '@/components/budget/settings/WalletsSection.jsx'
import RecurringSection from '@/components/budget/settings/RecurringSection.jsx'
import DataSection from '@/components/budget/settings/DataSection.jsx'
import AboutSection from '@/components/budget/settings/AboutSection.jsx'
import BudgetLimitsSection from '@/components/budget/limits/BudgetLimitsSection.jsx'
import RemindersCard from '@/components/common/RemindersCard.jsx'
import styles from './Settings.module.scss'

const THEME_OPTIONS = [
  { id: 'light', label: 'فاتح', desc: 'الوضع الفاتح الدافئ', Icon: Sun },
  { id: 'dark', label: 'داكن', desc: 'الوضع الداكن الدافئ', Icon: Moon },
  {
    id: 'amoled',
    label: 'AMOLED',
    desc: 'أسود نقي لتوفير البطارية',
    Icon: MoonStar,
  },
]

function BudgetSettings() {
  const { theme, setTheme } = useTheme()
  const { code, symbol, name: currencyName, setCurrency } = useCurrency()
  const {
    lockEnabled,
    biometricEnabled,
    configurePin,
    disablePin,
    setBiometricPref,
    lockNow,
  } = useBudgetLock()
  const { showToast } = useToast()

  const [pinDraft, setPinDraft] = useState('')
  const [showPinForm, setShowPinForm] = useState(false)

  const currentThemeMeta =
    THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0]

  const handleSavePin = async (e) => {
    e.preventDefault()
    try {
      await configurePin(pinDraft, true)
      setPinDraft('')
      setShowPinForm(false)
      triggerHapticFeedback('success')
      showToast('تم تفعيل قفل الميزانية بنجاح')
    } catch (err) {
      showToast(err?.message || 'أدخل 4 أرقام صحيحة', 'error')
    }
  }

  return (
    <div className={styles.container}>
      {/* 1. المظهر (فاتح · داكن · AMOLED) */}
      <section className={styles.appearanceCard}>
        <div className={styles.appearanceInfo}>
          <h3 className={styles.appearanceTitle}>المظهر</h3>
          <span className={styles.appearanceSub}>{currentThemeMeta.desc}</span>
        </div>
        <div
          className={styles.themePills}
          role="radiogroup"
          aria-label="اختيار المظهر"
        >
          {THEME_OPTIONS.map(({ id, label, Icon }) => {
            const active = theme === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.themePill} ${
                  active ? styles.themePillActive : ''
                }`}
                onClick={() => {
                  triggerHapticFeedback('light')
                  setTheme(id)
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. العملة والأمان */}
      <section className={styles.blockCard}>
        <div className={styles.rowBetween}>
          <div className={styles.appearanceInfo}>
            <h3 className={styles.appearanceTitle}>العملة</h3>
            <span className={styles.appearanceSub}>
              {currencyName} ({symbol})
            </span>
          </div>
          <select
            className={styles.currencySelect}
            aria-label="اختيار العملة"
            value={code}
            onChange={(e) => {
              setCurrency(e.target.value)
              showToast('تم تحديث العملة')
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.divider} />

        <div className={styles.rowBetween}>
          <div className={styles.appearanceInfo}>
            <h3 className={styles.appearanceTitle}>قفل الميزانية (PIN / بصمة)</h3>
            <span className={styles.appearanceSub}>
              {lockEnabled
                ? 'مفعّل — يُقفل تلقائياً عند الخروج من التطبيق'
                : 'احمِ بياناتك المالية برمز 4 أرقام أو بصمة الإصبع'}
            </span>
          </div>

          {lockEnabled ? (
            <div className={styles.lockActions}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() => {
                  lockNow()
                  triggerHapticFeedback('light')
                }}
              >
                <Lock size={14} />
                <span>قفل الآن</span>
              </button>
              <button
                type="button"
                className={`${styles.smallBtn} ${styles.dangerSmallBtn}`}
                onClick={() => {
                  disablePin()
                  showToast('تم إيقاف قفل الميزانية')
                }}
              >
                <Unlock size={14} />
                <span>إلغاء</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.primarySmallBtn}
              onClick={() => setShowPinForm((v) => !v)}
            >
              <Lock size={14} />
              <span>تفعيل القفل</span>
            </button>
          )}
        </div>

        {lockEnabled && (
          <label className={styles.bioToggle}>
            <input
              type="checkbox"
              checked={biometricEnabled}
              onChange={(e) => setBiometricPref(e.target.checked)}
            />
            <Fingerprint size={15} />
            <span>السماح بالفتح السريع عبر بصمة الإصبع (أندرويد)</span>
          </label>
        )}

        {showPinForm && !lockEnabled && (
          <form className={styles.pinForm} onSubmit={handleSavePin}>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className={styles.pinInput}
              placeholder="أدخل 4 أرقام"
              value={pinDraft}
              onChange={(e) =>
                setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              required
            />
            <button type="submit" className={styles.primarySmallBtn}>
              حفظ الرمز
            </button>
          </form>
        )}
      </section>

      {/* 3. التذكير المسائي بالمصروفات */}
      <section className={styles.blockCard}>
        <h3 className={styles.appearanceTitle}>تذكير المصروفات</h3>
        <RemindersCard filter={['budget']} />
      </section>

      <WalletsSection />
      <RecurringSection />
      <BudgetLimitsSection />
      <CategoriesSection />
      <DataSection />
      <AboutSection />
    </div>
  )
}

export default BudgetSettings
