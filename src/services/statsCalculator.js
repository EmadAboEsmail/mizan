import { query } from '@/db/adapter.js'

function pad2(n) { return String(n).padStart(2, '0') }

function getBucket(date, period) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  if (period === 'day') return `${y}-${pad2(m)}-${pad2(d)}`
  if (period === 'week') {
    const jan4 = new Date(y, 0, 4)
    const weekNum = Math.ceil(((date - jan4) / 86400000 + jan4.getDay() + 1) / 7)
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
      const d = new Date(now); d.setDate(d.getDate() - i)
      buckets.push(getBucket(d, period))
    }
    start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i * 7)
      buckets.push(getBucket(d, period))
    }
    start = new Date(now); start.setDate(start.getDate() - 21); start.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`)
    }
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  } else if (period === 'year') {
    for (let i = 4; i >= 0; i--) buckets.push(String(now.getFullYear() - i))
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
  const startMs = start.getTime()

  let clicksQuery = 'SELECT zekr_id, clicked_at FROM clicks WHERE clicked_at >= ?'
  const params = [startMs]

  if (zekr_id) {
    const exists = await query('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
    if (exists.length === 0) throw new Error('الذكر غير موجود')
    clicksQuery += ' AND zekr_id = ?'
    params.push(zekr_id)
  }

  const clicks = await query(clicksQuery, params)

  const countsByBucket = {}
  for (const c of clicks) {
    const label = getBucket(new Date(Number(c.clicked_at)), period)
    countsByBucket[label] = (countsByBucket[label] || 0) + 1
  }

  const values = buckets.map((b) => countsByBucket[b] || 0)
  const total = values.reduce((s, v) => s + v, 0)

  let breakdown = []
  if (!zekr_id) {
    const countsByZekr = {}
    for (const c of clicks) {
      countsByZekr[c.zekr_id] = (countsByZekr[c.zekr_id] || 0) + 1
    }
    const allAdhkar = await query('SELECT id, text FROM adhkar')
    const textMap = Object.fromEntries(allAdhkar.map((a) => [String(a.id), a.text]))
    breakdown = Object.entries(countsByZekr)
      .map(([zid, count]) => ({ zekr_id: zid, text: textMap[zid] || zid, count }))
      .sort((a, b) => b.count - a.count)
  }

  const result = { labels: buckets, values, total, breakdown }

  if (compare) {
    const nowMs = now.getTime()
    const durationMs = nowMs - startMs
    const prevStartMs = startMs - durationMs
    const prevEndMs = startMs

    let prevQuery = 'SELECT COUNT(*) as c FROM clicks WHERE clicked_at >= ? AND clicked_at < ?'
    const prevParams = [prevStartMs, prevEndMs]
    if (zekr_id) {
      prevQuery += ' AND zekr_id = ?'
      prevParams.push(zekr_id)
    }

    const prevRes = await query(prevQuery, prevParams)
    const prevTotal = Number(prevRes[0]?.c) || 0

    let changePercent = 0
    if (prevTotal > 0) {
      changePercent = Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
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
  const clicks = await query('SELECT clicked_at FROM clicks')

  if (clicks.length === 0) {
    return { current: 0, longest: 0, total_days: 0, last_date: null }
  }

  const daysSet = new Set()
  for (const c of clicks) {
    const d = new Date(Number(c.clicked_at))
    daysSet.add(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
  }

  const sortedDesc = Array.from(daysSet).sort().reverse()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${pad2(yesterday.getMonth() + 1)}-${pad2(yesterday.getDate())}`

  let currentStreak = 0
  if (sortedDesc[0] === todayStr || sortedDesc[0] === yesterdayStr) {
    currentStreak = 1
    let expected = new Date(sortedDesc[0])
    for (let i = 1; i < sortedDesc.length; i++) {
      expected.setDate(expected.getDate() - 1)
      const expectedStr = `${expected.getFullYear()}-${pad2(expected.getMonth() + 1)}-${pad2(expected.getDate())}`
      if (sortedDesc[i] === expectedStr) currentStreak++
      else break
    }
  }

  let longestStreak = 0
  const sortedAsc = Array.from(daysSet).sort()
  let current = 1
  longestStreak = 1
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1])
    const curr = new Date(sortedAsc[i])
    const diffDays = Math.round((curr - prev) / 86400000)
    if (diffDays === 1) {
      current++
      longestStreak = Math.max(longestStreak, current)
    } else current = 1
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    total_days: daysSet.size,
    last_date: sortedDesc[0],
  }
}
