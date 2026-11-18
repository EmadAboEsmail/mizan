import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'mizan_daily_zekr_goal_v1'
const EVENT_NAME = 'mizan:daily-goal-change'

export const DAILY_GOAL_PRESETS = [
  { value: 0, label: 'إيقاف' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
  { value: 500, label: '500' },
  { value: 1000, label: '1,000' },
]

function subscribe(cb) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT_NAME, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT_NAME, cb)
  }
}

export function getDailyZekrGoal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return 300
    const n = parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100000) return n
  } catch {
    // تجاهل
  }
  return 300
}

export function setDailyZekrGoal(val) {
  const n = Math.max(0, Math.min(100000, parseInt(val, 10) || 0))
  try {
    localStorage.setItem(STORAGE_KEY, String(n))
  } catch {
    // تجاهل
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME))
  }
}

export function useDailyZekrGoal() {
  const goal = useSyncExternalStore(subscribe, getDailyZekrGoal, () => 300)
  return {
    dailyGoal: goal,
    setDailyGoal: setDailyZekrGoal,
  }
}
