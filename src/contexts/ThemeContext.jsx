import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { setNativeSystemBarTheme } from '@/utils/haptics.js'

const ThemeContext = createContext()

const THEME_BG = {
  light: '#FAF6F0',
  dark: '#131210',
  amoled: '#000000',
}

const VALID_THEMES = ['light', 'dark', 'amoled']

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (VALID_THEMES.includes(saved)) return saved
  } catch {
    // التخزين غير متاح
  }
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

function syncNativeStatusBar(mode) {
  if (!Capacitor.isNativePlatform()) return
  const isDark = mode === 'dark' || mode === 'amoled'
  const isAmoled = mode === 'amoled'
  setNativeSystemBarTheme(isDark, isAmoled)
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(
    () => {}
  )
  StatusBar.setBackgroundColor({
    color: THEME_BG[mode] || THEME_BG.light,
  }).catch(() => {})
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    const isDark = theme === 'dark' || theme === 'amoled'
    const isAmoled = theme === 'amoled'
    document.body.classList.toggle('dark', isDark)
    document.body.classList.toggle('amoled', isAmoled)
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', THEME_BG[theme] || THEME_BG.light)
    }

    syncNativeStatusBar(theme)

    try {
      localStorage.setItem('theme', theme)
    } catch {
      // تجاهل
    }
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(VALID_THEMES.includes(next) ? next : 'light')
  }, [])

  // التبديل المتدرج: فاتح ← داكن دافئ ← أسود AMOLED ← فاتح
  const toggleTheme = useCallback(() => {
    setThemeState((t) => {
      if (t === 'light') return 'dark'
      if (t === 'dark') return 'amoled'
      return 'light'
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
