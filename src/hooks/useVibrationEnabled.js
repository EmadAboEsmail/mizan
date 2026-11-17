import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'zekr:vibration'
const EVENT_NAME = 'zekr:vibration-changed'

/**
 * يقرأ حالة الاهتزاز من localStorage.
 * مفعّل افتراضياً (true) ما لم يوقفه المستخدم صراحةً ('off').
 */
function readValue() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function subscribe(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener(EVENT_NAME, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(EVENT_NAME, callback)
  }
}

export function useVibrationEnabled() {
  return useSyncExternalStore(subscribe, readValue, readValue)
}

export function setVibrationEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch (err) {
    console.warn('[Vibration] Failed to persist setting:', err)
  }
}
