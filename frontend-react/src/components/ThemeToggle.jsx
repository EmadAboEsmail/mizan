import { useTheme } from '../context/ThemeContext.jsx'
import styles from './ThemeToggle.module.scss'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button className={styles.toggle} onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle
