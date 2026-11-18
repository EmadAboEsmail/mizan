import { useSyncExternalStore, useCallback } from 'react'

const SCALE_KEY = 'mizan_zekr_font_scale'
const STYLE_KEY = 'mizan_zekr_font_style'
const EVENT_NAME = 'mizan:zekr-font-change'

export const ZEKR_FONT_SCALES = [
  { id: 'sm', label: 'صغير', factor: 0.88 },
  { id: 'md', label: 'متوسط', factor: 1 },
  { id: 'lg', label: 'كبير', factor: 1.16 },
  { id: 'xl', label: 'أكبر', factor: 1.32 },
]

function subscribe(cb) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT_NAME, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT_NAME, cb)
  }
}

function getScaleSnapshot() {
  try {
    const v = localStorage.getItem(SCALE_KEY)
    return ZEKR_FONT_SCALES.some((s) => s.id === v) ? v : 'md'
  } catch {
    return 'md'
  }
}

function getStyleSnapshot() {
  try {
    return localStorage.getItem(STYLE_KEY) === 'modern' ? 'modern' : 'naskh'
  } catch {
    return 'naskh'
  }
}

export function useZekrFontPrefs() {
  const scale = useSyncExternalStore(subscribe, getScaleSnapshot, () => 'md')
  const fontStyle = useSyncExternalStore(
    subscribe,
    getStyleSnapshot,
    () => 'naskh'
  )

  const setScale = useCallback((nextId) => {
    if (!ZEKR_FONT_SCALES.some((s) => s.id === nextId)) return
    try {
      localStorage.setItem(SCALE_KEY, nextId)
      window.dispatchEvent(new Event(EVENT_NAME))
    } catch {
      // تجاهل
    }
  }, [])

  const setFontStyle = useCallback((nextStyle) => {
    const clean = nextStyle === 'modern' ? 'modern' : 'naskh'
    try {
      localStorage.setItem(STYLE_KEY, clean)
      window.dispatchEvent(new Event(EVENT_NAME))
    } catch {
      // تجاهل
    }
  }, [])

  const factor =
    ZEKR_FONT_SCALES.find((s) => s.id === scale)?.factor ?? 1

  return { scale, factor, fontStyle, setScale, setFontStyle }
}
