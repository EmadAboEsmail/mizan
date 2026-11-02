import { query } from '@/db/adapter.js'
import { getPendingMap } from './clickBuffer'
function pad2(n) {
  return String(n).padStart(2, '0')
}

function getBucket(date, period) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  if (period === 'day') return `${y}-${pad2(m)}-${pad2(d)}`
  if (period === 'week') {
    const jan4 = new Date(y, 0, 4)
    const weekNum = Math.ceil(
      ((date - jan4) / 86400000 + jan4.getDay() + 1) / 7
    )
    return `${y}-W${pad2(weekNum)}`
  }
  if (period === 'month') return `${y}-${pad2(m)}`
  if (period === 'year') return String(y)
  throw new Error('period غير صالح')
}

function generateBuckets(now, period) {
  const buckets = []
  let start

  if (period === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      buckets.push(getBucket(d, period))
    }
    start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      buckets.push(getBucket(d, period))
    }
    start = new Date(now)
    start.setDate(start.getDate() - 21)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`)
    }
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  } else if (period === 'year') {
    for (let i = 4; i >= 0; i--) {
      buckets.push(String(now.getFullYear() - i))
    }
    start = new Date(now.getFullYear() - 4, 0, 1)
  } else {
    throw new Error('period غير صالح')
  }

  return { buckets, start }
}

export async function getStats(period = 'day', zekr_id = null, compare = false) {
  if (!['day', 'week', 'month', 'year'].includes(period)) {
    throw new Error('period يجب أن يكون day/week/month/year')
  }

  const now = new Date()
  const { buckets, start } = generateBuckets(now, period)
  const startHour = Math.floor(start.getTime() / 3600000)

  // ✅ استخدام clicks_hourly
  let rows
  if (zekr_id) {
    const exists = await query('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
    if (exists.length === 0) throw new Error('الذكر غير موجود')

    rows = await query(
      'SELECT hour, count FROM clicks_hourly WHERE hour >= ? AND zekr_id = ?',
      [startHour, zekr_id]
    )
  } else {
    rows = await query(
      'SELECT zekr_id, hour, count FROM clicks_hourly WHERE hour >= ?',
      [startHour]
    )
  }

  // ✅ زود الـ pending من Buffer
  const pending = getPendingMap()

  if (pending && Object.keys(pending).length > 0) {
    // حوّل الـ pending لـ rows شكلها زي clicks_hourly
    const hourNow = Math.floor(Date.now() / 3600000)

    // هنجمعها في countsByBucket
    for (const [zid, cnt] of Object.entries(pending)) {
      if (zekr_id && zid !== zekr_id) continue

      const label = getBucket(new Date(hourNow * 3600000), period)
      countsByBucket[label] = (countsByBucket[label] || 0) + cnt

      if (!zekr_id) {
        countsByZekr[zid] = (countsByZekr[zid] || 0) + cnt
      }
    }
  }
  // حساب لكل bucket
  const countsByBucket = {}
  const countsByZekr = {}

  for (const row of rows) {
    const date = new Date(row.hour * 3600000)
    const label = getBucket(date, period)
    const count = Number(row.count) || 0

    countsByBucket[label] = (countsByBucket[label] || 0) + count

    if (!zekr_id && row.zekr_id) {
      countsByZekr[row.zekr_id] = (countsByZekr[row.zekr_id] || 0) + count
    }
  }

  const values = buckets.map((b) => countsByBucket[b] || 0)
  const total = values.reduce((s, v) => s + v, 0)

  // Breakdown
  let breakdown = []
  if (!zekr_id && Object.keys(countsByZekr).length > 0) {
    const allAdhkar = await query('SELECT id, text FROM adhkar')
    const textMap = Object.fromEntries(
      allAdhkar.map((a) => [String(a.id), a.text])
    )
    breakdown = Object.entries(countsByZekr)
      .map(([zid, count]) => ({
        zekr_id: zid,
        text: textMap[zid] || zid,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }

  const result = { labels: buckets, values, total, breakdown }

  // Comparison
  if (compare) {
    const nowHour = Math.floor(now.getTime() / 3600000)
    const durationHours = nowHour - startHour
    const prevStartHour = startHour - durationHours
    const prevEndHour = startHour

    let prevRows
    if (zekr_id) {
      prevRows = await query(
        'SELECT SUM(count) as total FROM clicks_hourly WHERE hour >= ? AND hour < ? AND zekr_id = ?',
        [prevStartHour, prevEndHour, zekr_id]
      )
    } else {
      prevRows = await query(
        'SELECT SUM(count) as total FROM clicks_hourly WHERE hour >= ? AND hour < ?',
        [prevStartHour, prevEndHour]
      )
    }

    const prevTotal = Number(prevRows[0]?.total) || 0

    let changePercent = 0
    if (prevTotal > 0) {
      changePercent =
        Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
    } else if (total > 0) {
      changePercent = 100.0
    }

    result.comparison = {
      previous_total: prevTotal,
      current_total: total,
      change_percent: changePercent,
    }
  }

  return result
}

export async function getStreak() {
  const rows = await query(
    'SELECT hour, SUM(count) as total FROM clicks_hourly GROUP BY hour ORDER BY hour DESC'
  )

  if (rows.length === 0) {
    // ✅ حتى لو مفيش DB data، ممكن يكون فيه pending
    const pending = getPendingMap()
    if (Object.keys(pending).length === 0) {
      return { current: 0, longest: 0, total_days: 0, last_date: null }
    }
  }

  const daysSet = new Set()
  for (const r of rows) {
    if (Number(r.total) === 0) continue
    const d = new Date(r.hour * 3600000)
    daysSet.add(
      `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    )
  }

  // ✅ زود الـ pending (بتاعة "النهارده")
  const pending = getPendingMap()
  if (Object.keys(pending).length > 0) {
    const today = new Date()
    daysSet.add(
      `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
    )
  }

  if (daysSet.size === 0) {
    return { current: 0, longest: 0, total_days: 0, last_date: null }
  }

  // Current streak
  let currentStreak = 0
  if (sortedDesc[0] === todayStr || sortedDesc[0] === yesterdayStr) {
    currentStreak = 1
    let expected = new Date(sortedDesc[0])
    for (let i = 1; i < sortedDesc.length; i++) {
      expected.setDate(expected.getDate() - 1)
      const expectedStr = `${expected.getFullYear()}-${pad2(
        expected.getMonth() + 1
      )}-${pad2(expected.getDate())}`
      if (sortedDesc[i] === expectedStr) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Longest streak
  let longestStreak = 1
  const sortedAsc = Array.from(daysSet).sort()
  let current = 1
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1])
    const curr = new Date(sortedAsc[i])
    const diffDays = Math.round((curr - prev) / 86400000)
    if (diffDays === 1) {
      current++
      longestStreak = Math.max(longestStreak, current)
    } else {
      current = 1
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    total_days: daysSet.size,
    last_date: sortedDesc[0],
  }
}
