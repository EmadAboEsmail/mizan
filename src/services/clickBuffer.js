import { transaction } from '@/db/adapter.js'

// ═══════════════════════════════════════
// Buffer في الذاكرة
// ═══════════════════════════════════════
const buffer = new Map() // key: "zekrId|hour" → count
let flushTimer = null
let isFlushing = false
let isInitialized = false

const FLUSH_INTERVAL = 60 * 1000 // 60 ثانية

function getKey(zekrId, hour) {
  return `${zekrId}|${hour}`
}

// ═══════════════════════════════════════
// Buffer a click
// ═══════════════════════════════════════
export function bufferClick(zekrId) {
  if (!zekrId) return

  const hour = Math.floor(Date.now() / 3600000)
  const key = getKey(zekrId, hour)
  buffer.set(key, (buffer.get(key) || 0) + 1)

  scheduleFlush()
}

// ═══════════════════════════════════════
// Scheduling
// ═══════════════════════════════════════
function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush().catch((err) =>
      console.error('[ClickBuffer] Auto-flush failed:', err)
    )
  }, FLUSH_INTERVAL)
}

// ═══════════════════════════════════════
// Flush to DB
// ═══════════════════════════════════════
export async function flush() {
  if (isFlushing || buffer.size === 0) return

  isFlushing = true

  const entries = Array.from(buffer.entries())
  buffer.clear()

  try {
    const statements = []

    for (const [key, count] of entries) {
      const [zekrId, hourStr] = key.split('|')
      statements.push({
        statement: `INSERT INTO clicks_hourly (zekr_id, hour, count) VALUES (?, ?, ?)
                    ON CONFLICT(zekr_id, hour) DO UPDATE SET count = count + excluded.count`,
        values: [zekrId, Number(hourStr), count],
      })
    }

    const zekrTotals = new Map()
    for (const [key, count] of entries) {
      const zekrId = key.split('|')[0]
      zekrTotals.set(zekrId, (zekrTotals.get(zekrId) || 0) + count)
    }

    for (const [zekrId, total] of zekrTotals) {
      statements.push({
        statement: `INSERT INTO counts (zekr_id, count) VALUES (?, ?)
                    ON CONFLICT(zekr_id) DO UPDATE SET count = count + excluded.count`,
        values: [zekrId, total],
      })
    }

    await transaction(statements)

    const totalClicks = entries.reduce((s, [, c]) => s + c, 0)
    console.log(
      `[ClickBuffer] Flushed ${totalClicks} clicks (${entries.length} hourly groups)`
    )
  } catch (err) {
    console.error('[ClickBuffer] Flush failed:', err)
    for (const [key, count] of entries) {
      buffer.set(key, (buffer.get(key) || 0) + count)
    }
  } finally {
    isFlushing = false
    if (buffer.size > 0) scheduleFlush()
  }
}

// ═══════════════════════════════════════
// Query pending
// ═══════════════════════════════════════
export function getPendingCount() {
  let total = 0
  for (const count of buffer.values()) total += count
  return total
}

export function getPendingForZekr(zekrId) {
  let total = 0
  for (const [key, count] of buffer.entries()) {
    if (key.startsWith(`${zekrId}|`)) total += count
  }
  return total
}

export function getPendingMap() {
  const map = {}
  for (const [key, count] of buffer.entries()) {
    const zekrId = key.split('|')[0]
    map[zekrId] = (map[zekrId] || 0) + count
  }
  return map
}

// ═══════════════════════════════════════
// Clear
// ═══════════════════════════════════════
export function clearBuffer() {
  buffer.clear()
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
}

// ═══════════════════════════════════════
// Init
// ═══════════════════════════════════════
export function initClickBuffer() {
  if (isInitialized) return
  isInitialized = true

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush().catch((err) =>
        console.error('[ClickBuffer] Hidden flush failed:', err)
      )
    }
  })

  window.addEventListener('beforeunload', () => {
    flush().catch(() => { })
  })

  window.addEventListener('pagehide', () => {
    flush().catch(() => { })
  })

  console.log('[ClickBuffer] Initialized (auto-flush every 60s)')
}
