import { Sun, Moon, MoonStar } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext.jsx'
import styles from './ThemeToggle.module.scss'

const THEME_META = {
  light: {
    nextLabel: 'التبديل للوضع الداكن الدافئ',
    title: 'فاتح — اضغط للداكن الدافئ',
    icon: Moon,
  },
  dark: {
    nextLabel: 'التبديل للوضع الأسود النقي AMOLED',
    title: 'داكن دافئ — اضغط للأسود AMOLED',
    icon: MoonStar,
  },
  amoled: {
    nextLabel: 'التبديل للوضع الفاتح',
    title: 'أسود AMOLED — اضغط للوضع الفاتح',
    icon: Sun,
  },
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const meta = THEME_META[theme] || THEME_META.light
  const IconComp = meta.icon

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={meta.nextLabel}
      title={meta.title}
    >
      <span key={theme} className={styles.iconContainer}>
        <IconComp size={18} strokeWidth={2} aria-hidden="true" />
      </span>
    </button>
  )
}
