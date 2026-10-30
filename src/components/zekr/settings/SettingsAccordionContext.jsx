import { createContext, useContext, useState, useEffect } from 'react'

// سجل الأقسام — مصدر واحد للحقيقة
export const SETTINGS_SECTIONS = [
  { id: 'appearance', label: 'المظهر', icon: '🎨' },
  { id: 'groups', label: 'المجموعات', icon: '📂' },
  { id: 'adhkar', label: 'الأذكار', icon: '📿' },
  { id: 'data', label: 'البيانات', icon: '💾' },
  { id: 'about', label: 'عن التطبيق', icon: 'ℹ️' },
]

const STORAGE_KEY = 'settings-open-sections'
const DEFAULT_OPEN = ['appearance', 'adhkar']

const SettingsAccordionContext = createContext(null)

export function SettingsAccordionProvider({ children }) {
  const [openIds, setOpenIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // تجاهل — نرجع للـ default
    }
    return DEFAULT_OPEN
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openIds))
    } catch {
      // تجاهل — التخزين ممتلئ أو غير متاح
    }
  }, [openIds])

  const toggle = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const scrollTo = (id) => {
    // افتح القسم لو مقفول
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]))

    // استنى الـ DOM يترسم، بعدين اعمل scroll
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById(`settings-section-${id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    })
  }

  return (
    <SettingsAccordionContext.Provider value={{ openIds, toggle, scrollTo }}>
      {children}
    </SettingsAccordionContext.Provider>
  )
}

export function useSettingsAccordion() {
  const ctx = useContext(SettingsAccordionContext)
  if (!ctx) {
    throw new Error(
      'useSettingsAccordion must be inside SettingsAccordionProvider'
    )
  }
  return ctx
}

