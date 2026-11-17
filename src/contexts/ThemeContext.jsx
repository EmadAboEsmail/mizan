import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const ThemeContext = createContext()

const LIGHT_BG = '#FAF6F0'
const DARK_BG = '#131210'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
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

function syncNativeStatusBar(isDark) {
  if (!Capacitor.isNativePlatform()) return
  // Style.Light = أيقونات داكنة لخلفية فاتحة، Style.Dark = أيقونات فاتحة لخلفية داكنة
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(
    () => {}
  )
  StatusBar.setBackgroundColor({ color: isDark ? DARK_BG : LIGHT_BG }).catch(
    () => {}
  )
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    const isDark = theme === 'dark'
    document.body.classList.toggle('dark', isDark)
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', isDark ? DARK_BG : LIGHT_BG)
    }

    syncNativeStatusBar(isDark)

    try {
      localStorage.setItem('theme', theme)
    } catch {
      // تجاهل — التخزين غير متاح
    }
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next === 'dark' ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
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
