import { useSyncExternalStore } from 'react'
import { syncNativeReminders } from '@/utils/haptics.js'

const STORAGE_KEY = 'mizan_reminders_v1'
const EVENT_NAME = 'mizan:reminders-change'

export const DEFAULT_REMINDERS = {
  morning: {
    id: 'morning',
    enabled: false,
    time: '06:30',
    title: 'أذكار الصباح',
    body: 'ابدأ يومك بذكر الله وطمأنينة القلب',
    route: '/zekr/sabh?mode=group',
  },
  evening: {
    id: 'evening',
    enabled: false,
    time: '17:00',
    title: 'أذكار المساء',
    body: 'اختم نهارك بالذكر والسكينة',
    route: '/zekr/sabh?mode=group',
  },
  budget: {
    id: 'budget',
    enabled: false,
    time: '21:30',
    title: 'توازن يومك المالي',
    body: 'دقيقة واحدة لتسجيل مصروفات اليوم',
    route: '/budget/transactions?add=1',
  },
}

let cachedRaw = null
let cachedObj = DEFAULT_REMINDERS

export function readReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) return cachedObj
    cachedRaw = raw
    if (!raw) {
      cachedObj = DEFAULT_REMINDERS
      return cachedObj
    }
    const parsed = JSON.parse(raw)
    cachedObj = {
      morning: {
        ...DEFAULT_REMINDERS.morning,
        enabled: Boolean(parsed?.morning?.enabled),
        time: isValidTime(parsed?.morning?.time)
          ? parsed.morning.time
          : DEFAULT_REMINDERS.morning.time,
      },
      evening: {
        ...DEFAULT_REMINDERS.evening,
        enabled: Boolean(parsed?.evening?.enabled),
        time: isValidTime(parsed?.evening?.time)
          ? parsed.evening.time
          : DEFAULT_REMINDERS.evening.time,
      },
      budget: {
        ...DEFAULT_REMINDERS.budget,
        enabled: Boolean(parsed?.budget?.enabled),
        time: isValidTime(parsed?.budget?.time)
          ? parsed.budget.time
          : DEFAULT_REMINDERS.budget.time,
      },
    }
    return cachedObj
  } catch {
    return DEFAULT_REMINDERS
  }
}

function isValidTime(t) {
  return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)
}

export async function updateReminder(key, patch) {
  const current = readReminders()
  if (!current[key]) return
  const next = {
    ...current,
    [key]: {
      ...current[key],
      ...patch,
      time:
        patch.time && isValidTime(patch.time) ? patch.time : current[key].time,
    },
  }
  const serialized = JSON.stringify(next)
  localStorage.setItem(STORAGE_KEY, serialized)
  cachedRaw = serialized
  cachedObj = next
  window.dispatchEvent(new Event(EVENT_NAME))

  // مزامنة المنبّهات اليومية المحلية مع أندرويد (تعمل بدون إنترنت وتبقى بعد إعادة التشغيل)
  await syncNativeReminders(Object.values(next))
}

function subscribe(cb) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT_NAME, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT_NAME, cb)
  }
}

export function useReminders() {
  const reminders = useSyncExternalStore(
    subscribe,
    readReminders,
    () => DEFAULT_REMINDERS
  )
  return {
    reminders,
    updateReminder,
  }
}
