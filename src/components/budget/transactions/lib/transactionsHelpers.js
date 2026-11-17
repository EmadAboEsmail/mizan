export const ROW_HEIGHT = 76

export const AR_MONTHS = [
  'ينا',
  'فبر',
  'مار',
  'أبر',
  'ماي',
  'يون',
  'يول',
  'أغس',
  'سبت',
  'أكت',
  'نوف',
  'ديس',
]

export const AR_MONTHS_FULL = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

/**
 * تنسيق المبلغ بفواصل آلاف — يخفي .00 للأرقام الصحيحة ويعرض الكسور عند وجودها
 */
export function formatAmount(n) {
  const num = Number(n || 0)
  const hasDecimals = Math.abs(Math.round(num * 100) % 100) > 0
  const fixed = hasDecimals ? num.toFixed(2) : num.toFixed(0)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${withCommas}.${decPart}` : withCommas
}

export function formatDate(s) {
  if (!s) return '—'
  const parts = s.split('-')
  if (parts.length !== 3) return s
  const y = parts[0]
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return `${d} ${AR_MONTHS_FULL[m] || parts[1]} ${y}`
}

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
  const monthName = AR_MONTHS_FULL[m - 1] || m
  const now = new Date()
  const isCurrentYear = now.getFullYear() === y

  if (isCurrentYear) return `${dayName}، ${d} ${monthName}`
  return `${dayName}، ${d} ${monthName} ${y}`
}

/**
 * تجميع المعاملات في مجموعات يومية متتالية
 */
export function groupTransactionsByDay(txns) {
  if (!txns || txns.length === 0) return []

  const groups = []
  let current = null

  for (const txn of txns) {
    if (!current || current.date !== txn.date) {
      current = {
        date: txn.date,
        total: 0,
        count: 0,
        txns: [],
      }
      groups.push(current)
    }
    const amount = Number(txn.amount) || 0
    current.total += txn.type === 'income' ? amount : -amount
    current.count += 1
    current.txns.push(txn)
  }

  return groups
}

export function groupTransactionsByDate(txns) {
  const groups = groupTransactionsByDay(txns)
  const items = []
  for (const g of groups) {
    items.push({ type: 'header', date: g.date, total: g.total, count: g.count })
    for (const txn of g.txns) {
      items.push({ type: 'txn', txn })
    }
  }
  return items
}
