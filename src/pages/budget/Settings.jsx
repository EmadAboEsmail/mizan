import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext.jsx'
import CategoriesSection from '@/components/budget/settings/CategoriesSection.jsx'
import DataSection from '@/components/budget/settings/DataSection.jsx'
import AboutSection from '@/components/budget/settings/AboutSection.jsx'
import BudgetLimitsSection from '@/components/budget/limits/BudgetLimitsSection.jsx'
import styles from './Settings.module.scss'

function BudgetSettings() {
  const { isDark, setTheme } = useTheme()

  return (
    <div className={styles.container}>
      {/* شريط سريع لتبديل المظهر */}
      <section className={styles.appearanceCard}>
        <div className={styles.appearanceInfo}>
          <h3 className={styles.appearanceTitle}>المظهر</h3>
          <span className={styles.appearanceSub}>
            {isDark ? 'الوضع الداكن الدافئ' : 'الوضع الفاتح الدافئ'}
          </span>
        </div>
        <div className={styles.themePills} role="radiogroup" aria-label="اختيار المظهر">
          <button
            type="button"
            role="radio"
            aria-checked={!isDark}
            className={`${styles.themePill} ${!isDark ? styles.themePillActive : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={15} strokeWidth={2.2} aria-hidden="true" />
            <span>فاتح</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isDark}
            className={`${styles.themePill} ${isDark ? styles.themePillActive : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={15} strokeWidth={2.2} aria-hidden="true" />
            <span>داكن</span>
          </button>
        </div>
      </section>

      <BudgetLimitsSection />
      <CategoriesSection />
      <DataSection />
      <AboutSection />
    </div>
  )
}

export default BudgetSettings
