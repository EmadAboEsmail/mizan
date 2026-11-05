import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCsvFilename } from './csv.js'

describe('getCsvFilename', () => {
  beforeEach(() => {
    // نثبّت الساعة، فلا يتغير الناتج باختلاف يوم التشغيل
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T10:00:00Z'))
  })

  afterEach(() => {
    // نعيد الساعة الحقيقية حتى لا تتأثر ملفات اختبار أخرى
    vi.useRealTimers()
  })

  it('defaults to "stats" followed by today', () => {
    expect(getCsvFilename()).toBe('stats-2026-11-05.csv')
  })

  it('puts the base name first', () => {
    expect(getCsvFilename('budget')).toBe('budget-2026-11-05.csv')
  })

  it('inserts the suffix between the name and the date', () => {
    expect(getCsvFilename('stats', 'week')).toBe('stats-week-2026-11-05.csv')
  })

  it('ignores an empty suffix', () => {
    expect(getCsvFilename('stats', '')).toBe('stats-2026-11-05.csv')
  })

  it('uses the UTC date, not the local one', () => {
    // 23:30 بتوقيت UTC = 01:30 من اليوم التالي في القاهرة، والملف يحمل تاريخ UTC
    vi.setSystemTime(new Date('2026-11-05T23:30:00Z'))
    expect(getCsvFilename()).toBe('stats-2026-11-05.csv')
  })
})
