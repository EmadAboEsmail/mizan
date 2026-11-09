import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'zekr:vibration'
const EVENT_NAME = 'zekr:vibration-changed'

/**
 * دالة خالصة — تقرأ القيمة من localStorage مباشرة.
 * القيمة الافتراضية: false (مطفأ)، يعني المستخدم يضغط لتفعيل الاهتزاز بوعي.
 */
function readValue() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

/**
 * subscribe Function — تخبر React بأي تغيير في الـ store.
 * تغطي تغييرات من تبويب آخر (`storage`) ونفس التبويب (custom event).
 */
function subscribe(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener(EVENT_NAME, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(EVENT_NAME, callback)
  }
}

/**
 * Hook React — يستخدم useSyncExternalStore لضمان تحديث فوري
 * بدون تأخير أو مشاكل إعادة mount.
 */
export function useVibrationEnabled() {
  return useSyncExternalStore(subscribe, readValue, readValue)
}

/**
 * يحدّث localStorage + يخبّر كل hooks (نفس التبويب وتبويبات أخرى).
 */
export function setVibrationEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch (err) {
    console.warn('[Vibration] Failed to persist setting:', err)
  }
}