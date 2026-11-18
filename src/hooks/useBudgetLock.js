import { useSyncExternalStore } from 'react'

const HASH_KEY = 'mizan_budget_pin_hash_v1'
const SALT_KEY = 'mizan_budget_pin_salt_v1'
const BIO_KEY = 'mizan_budget_bio_enabled_v1'
const EVENT_NAME = 'mizan:budget-lock-change'

// حالة فك القفل تعيش في الذاكرة فقط وتُغلق تلقائياً عند الخروج للخلفية
let sessionUnlocked = false
let listenersSetup = false

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME))
  }
}

function ensureBackgroundAutoLock() {
  if (listenersSetup || typeof window === 'undefined') return
  listenersSetup = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isPinConfigured()) {
      sessionUnlocked = false
      notify()
    }
  })
}

async function sha256Hex(input) {
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const bytes = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // احتياطي بسيط للبيئات التي لا تدعم WebCrypto
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function randomSalt() {
  const arr = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < arr.length; i += 1) {
      arr[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function isPinConfigured() {
  try {
    return Boolean(localStorage.getItem(HASH_KEY))
  } catch {
    return false
  }
}

export function isBiometricEnabled() {
  try {
    return localStorage.getItem(BIO_KEY) === '1'
  } catch {
    return false
  }
}

export async function configureBudgetPin(pin, enableBiometric = true) {
  const clean = String(pin || '').trim()
  if (!/^\d{4}$/.test(clean)) {
    throw new Error('رمز القفل يجب أن يتكوّن من 4 أرقام')
  }
  const salt = randomSalt()
  const hash = await sha256Hex(`${salt}:${clean}`)
  localStorage.setItem(SALT_KEY, salt)
  localStorage.setItem(HASH_KEY, hash)
  localStorage.setItem(BIO_KEY, enableBiometric ? '1' : '0')
  sessionUnlocked = true
  notify()
}

export function setBiometricPref(enabled) {
  try {
    localStorage.setItem(BIO_KEY, enabled ? '1' : '0')
  } catch {
    // تجاهل
  }
  notify()
}

export function disableBudgetPin() {
  try {
    localStorage.removeItem(HASH_KEY)
    localStorage.removeItem(SALT_KEY)
    localStorage.removeItem(BIO_KEY)
  } catch {
    // تجاهل
  }
  sessionUnlocked = false
  notify()
}

export async function verifyAndUnlockPin(pin) {
  const clean = String(pin || '').trim()
  if (!/^\d{4}$/.test(clean)) return false
  const salt = localStorage.getItem(SALT_KEY) || ''
  const expected = localStorage.getItem(HASH_KEY) || ''
  if (!expected) return true
  const actual = await sha256Hex(`${salt}:${clean}`)
  if (actual === expected) {
    sessionUnlocked = true
    notify()
    return true
  }
  return false
}

export function markBiometricUnlocked() {
  sessionUnlocked = true
  notify()
}

export function lockBudgetNow() {
  sessionUnlocked = false
  notify()
}

function subscribe(cb) {
  ensureBackgroundAutoLock()
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT_NAME, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT_NAME, cb)
  }
}

function getSnapshot() {
  const enabled = isPinConfigured()
  const bio = isBiometricEnabled()
  const locked = enabled && !sessionUnlocked
  return `${enabled ? 1 : 0}|${bio ? 1 : 0}|${locked ? 1 : 0}`
}

export function useBudgetLock() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => '0|0|0')
  const [e, b, l] = snap.split('|')
  return {
    lockEnabled: e === '1',
    biometricEnabled: b === '1',
    isLocked: l === '1',
    configurePin: configureBudgetPin,
    disablePin: disableBudgetPin,
    verifyPin: verifyAndUnlockPin,
    unlockViaBiometric: markBiometricUnlocked,
    setBiometricPref,
    lockNow: lockBudgetNow,
  }
}
