import { useSyncExternalStore, useCallback } from 'react'

const STORAGE_KEY = 'mizan_hide_amounts'
const EVENT_NAME = 'mizan:privacy-change'

function subscribe(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener(EVENT_NAME, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(EVENT_NAME, callback)
  }
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function usePrivacyMode() {
  const isHidden = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const togglePrivacy = useCallback(() => {
    try {
      const next = !getSnapshot()
      localStorage.setItem(STORAGE_KEY, String(next))
      window.dispatchEvent(new Event(EVENT_NAME))
    } catch {
      // تجاهل
    }
  }, [])

  return [isHidden, togglePrivacy]
}

export function maskText(text, isHidden) {
  return isHidden ? '••••' : text
}
