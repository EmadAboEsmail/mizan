// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════
export const ROW_HEIGHT = 80

export const AR_MONTHS = [
  'ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون',
  'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس',
]

// ═══════════════════════════════════════
// Formatters
// ═══════════════════════════════════════
export function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${decPart}`
}

export function formatDate(s) {
  if (!s) return '—'
  const parts = s.split('-')
  if (parts.length !== 3) return s
  const y = parts[0]
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return `${d} ${AR_MONTHS[m] || parts[1]} ${y}`
}
// ═══════════════════════════════════════
// Date Grouping Helpers
// ═══════════════════════════════════════
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function yesterdayISO() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const AR_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
]

export function formatDayHeader(dateStr) {
  if (!dateStr) return '—'
  if (dateStr === todayISO()) return 'اليوم'
  if (dateStr === yesterdayISO()) return 'أمس'

  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayName = AR_DAYS[date.getDay()]
  const monthName = AR_MONTHS[m - 1] || m
  const now = new Date()
  const isCurrentYear = now.getFullYear() === y

  if (isCurrentYear) return `${dayName} ${d} ${monthName}`
  return `${dayName} ${d} ${monthName} ${y}`
}

// ═══════════════════════════════════════
// Group transactions by date → flat items
// ═══════════════════════════════════════
export function groupTransactionsByDate(txns) {
  if (!txns || txns.length === 0) return []

  const items = []
  let currentDate = null
  let buffer = []

  const flush = () => {
    if (buffer.length === 0) return

    const dayNet = buffer.reduce((sum, t) => {
      const amount = Number(t.amount) || 0
      return sum + (t.type === 'income' ? amount : -amount)
    }, 0)

    items.push({
      type: 'header',
      date: currentDate,
      total: dayNet,
      count: buffer.length,
    })

    buffer.forEach((txn) => {
      items.push({ type: 'txn', txn })
    })
  }

  txns.forEach((txn) => {
    if (txn.date !== currentDate) {
      flush()
      currentDate = txn.date
      buffer = []
    }
    buffer.push(txn)
  })

  flush()
  return items
}
