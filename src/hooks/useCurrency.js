import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'mizan_currency_v1'
const EVENT_NAME = 'mizan:currency-change'

export const CURRENCIES = [
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' },
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي' },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي' },
  { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري' },
  { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني' },
  { code: 'MAD', symbol: 'د.م', name: 'درهم مغربي' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', name: 'يورو' },
  { code: 'GBP', symbol: '£', name: 'جنيه إسترليني' },
]

function subscribe(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener(EVENT_NAME, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(EVENT_NAME, callback)
  }
}

export function getCurrencyCode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (CURRENCIES.some((c) => c.code === saved)) return saved
  } catch {
    // تجاهل
  }
  return 'EGP'
}

export function getCurrencySymbol() {
  const code = getCurrencyCode()
  return CURRENCIES.find((c) => c.code === code)?.symbol || 'ج.م'
}

export function setCurrencyCode(code) {
  if (!CURRENCIES.some((c) => c.code === code)) return
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // تجاهل
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME))
  }
}

export function useCurrency() {
  const code = useSyncExternalStore(subscribe, getCurrencyCode, () => 'EGP')
  const meta = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
  return {
    code: meta.code,
    symbol: meta.symbol,
    name: meta.name,
    setCurrency: setCurrencyCode,
  }
}
