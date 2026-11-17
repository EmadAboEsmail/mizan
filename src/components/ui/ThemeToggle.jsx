import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext.jsx'
import styles from './ThemeToggle.module.scss'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      <span key={theme} className={styles.iconContainer}>
        {isDark ? (
          <Sun size={18} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={2} aria-hidden="true" />
        )}
      </span>
    </button>
  )
}
