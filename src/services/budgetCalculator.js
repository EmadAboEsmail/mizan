import { query, queryOne } from '@/db/adapter.js'
function pad2(n) { return String(n).padStart(2, '0') }
function nowMs() { return Date.now() }

function pctChange(curr, prev) {
  if (prev === 0) return curr === 0 ? 0 : 100.0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

function limitStatus(percent) {
  if (percent >= 100) return 'over'
  if (percent >= 75) return 'warning'
  return 'safe'
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// ═══════════════════════════════════════
// Summary
// ═══════════════════════════════════════
export async function computeSummary(month) {
  const where = month ? 'WHERE date LIKE ?' : ''
  const params = month ? [`${month}-%`] : []

  const totals = await query(
    `SELECT type, COUNT(*) as c, COALESCE(SUM(amount), 0) as total
     FROM transactions ${where} GROUP BY type`,
    params
  )

  let totalIncome = 0, totalExpense = 0, totalCount = 0
  for (const t of totals) {
    if (t.type === 'income') totalIncome = Number(t.total)
    else if (t.type === 'expense') totalExpense = Number(t.total)
    totalCount += Number(t.c)
  }

  const byCatRows = await query(
    `SELECT category_id, COUNT(*) as c, SUM(amount) as total
     FROM transactions ${where}
     GROUP BY category_id ORDER BY total DESC`,
    params
  )

  const catIds = byCatRows.map((r) => r.category_id)
  let catMap = {}
  if (catIds.length > 0) {
    const ph = catIds.map(() => '?').join(',')
    const cats = await query(`SELECT * FROM categories WHERE id IN (${ph})`, catIds)
    catMap = Object.fromEntries(cats.map((c) => [c.id, c]))
  }

  const byCategory = byCatRows.map((r) => {
    const c = catMap[r.category_id]
    return {
      category_id: r.category_id,
      category_name: c?.name || 'غير محدد',
      category_icon: c?.icon || null,
      category_color: c?.color || null,
      total: Math.round(Number(r.total) * 100) / 100,
      count: Number(r.c),
    }
  })

  return {
    month: month || 'all',
    total_income: Math.round(totalIncome * 100) / 100,
    total_expense: Math.round(totalExpense * 100) / 100,
    net: Math.round((totalIncome - totalExpense) * 100) / 100,
    transaction_count: totalCount,
    by_category: byCategory,
  }
}

// ═══════════════════════════════════════
// Monthly Trend
// ═══════════════════════════════════════
export async function computeMonthlyTrend(months = 6, endMonth = null) {
  let yEnd, mEnd
  if (endMonth) {
    yEnd = parseInt(endMonth.slice(0, 4), 10)
    mEnd = parseInt(endMonth.slice(5, 7), 10)
  } else {
    const now = new Date()
    yEnd = now.getFullYear()
    mEnd = now.getMonth() + 1
  }

  const buckets = []
  for (let i = months - 1; i >= 0; i--) {
    let y = yEnd, m = mEnd - i
    while (m <= 0) { m += 12; y -= 1 }
    buckets.push(`${y}-${pad2(m)}`)
  }

  const results = []
  for (const b of buckets) {
    const rows = await query(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions WHERE date LIKE ? GROUP BY type`,
      [`${b}-%`]
    )
    let income = 0, expense = 0
    for (const r of rows) {
      if (r.type === 'income') income = Number(r.total)
      else if (r.type === 'expense') expense = Number(r.total)
    }
    results.push({
      month: b,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    })
  }
  return results
}

// ═══════════════════════════════════════
// Limits (with progress)
// ═══════════════════════════════════════
export async function computeLimitItem(limitId) {
  const lim = await queryOne('SELECT * FROM limits WHERE id = ?', [limitId])
  if (!lim) return null

  const cat = await queryOne('SELECT * FROM categories WHERE id = ?', [lim.category_id])

  const spentRes = await queryOne(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE category_id = ? AND date LIKE ? AND type = 'expense'`,
    [lim.category_id, `${lim.month}-%`]
  )
  const spent = Math.round(Number(spentRes?.total || 0) * 100) / 100
  const remaining = Math.round((lim.amount - spent) * 100) / 100
  const percent = lim.amount > 0 ? Math.round((spent / lim.amount) * 1000) / 10 : 0

  return {
    id: lim.id,
    category_id: lim.category_id,
    category_name: cat?.name || 'غير محدد',
    category_icon: cat?.icon || null,
    category_color: cat?.color || null,
    amount: Math.round(lim.amount * 100) / 100,
    spent,
    remaining,
    percent,
    status: limitStatus(percent),
  }
}

export async function computeLimitsWithProgress(month) {
  const lims = await query('SELECT * FROM limits WHERE month = ?', [month])
  const items = []
  let totalLimit = 0, totalSpent = 0

  for (const l of lims) {
    const item = await computeLimitItem(l.id)
    if (item) {
      items.push(item)
      totalLimit += item.amount
      totalSpent += item.spent
    }
  }

  const totalRemaining = totalLimit - totalSpent
  const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 1000) / 10 : 0

  return {
    month,
    limits: items,
    total_limit: Math.round(totalLimit * 100) / 100,
    total_spent: Math.round(totalSpent * 100) / 100,
    total_remaining: Math.round(totalRemaining * 100) / 100,
    total_percent: totalPercent,
  }
}

// ═══════════════════════════════════════
// Insights
// ═══════════════════════════════════════
export async function computeInsights(month, compareMonth = null) {
  const year = parseInt(month.slice(0, 4), 10)
  const mon = parseInt(month.slice(5, 7), 10)
  const dim = daysInMonth(year, mon)

  const now = new Date()
  const currentYm = { y: now.getFullYear(), m: now.getMonth() + 1 }
  const targetYm = { y: year, m: mon }

  let daysElapsed = 0
  if (targetYm.y === currentYm.y && targetYm.m === currentYm.m) {
    daysElapsed = now.getDate()
  } else if (
    targetYm.y < currentYm.y ||
    (targetYm.y === currentYm.y && targetYm.m < currentYm.m)
  ) {
    daysElapsed = dim
  }

  const totals = await query(
    `SELECT type, COUNT(*) as c, COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE date LIKE ? GROUP BY type`,
    [`${month}-%`]
  )

  let totalIncome = 0, totalExpense = 0, txnCount = 0
  for (const t of totals) {
    if (t.type === 'income') totalIncome = Number(t.total)
    else if (t.type === 'expense') totalExpense = Number(t.total)
    txnCount += Number(t.c)
  }

  const avgDailyExpense = daysElapsed > 0 ? Math.round((totalExpense / daysElapsed) * 100) / 100 : 0
  const avgDailyIncome = daysElapsed > 0 ? Math.round((totalIncome / daysElapsed) * 100) / 100 : 0

  // Top expense day
  const topDayRows = await query(
    `SELECT date, SUM(amount) as total
     FROM transactions WHERE date LIKE ? AND type = 'expense'
     GROUP BY date ORDER BY total DESC LIMIT 1`,
    [`${month}-%`]
  )
  const topExpenseDay = topDayRows.length > 0
    ? { date: topDayRows[0].date, amount: Math.round(Number(topDayRows[0].total) * 100) / 100 }
    : null

  // Top expense category
  const topCatRows = await query(
    `SELECT category_id, SUM(amount) as total
     FROM transactions WHERE date LIKE ? AND type = 'expense'
     GROUP BY category_id ORDER BY total DESC LIMIT 1`,
    [`${month}-%`]
  )
  let topExpenseCategory = null
  if (topCatRows.length > 0 && totalExpense > 0) {
    const c = await queryOne('SELECT * FROM categories WHERE id = ?', [topCatRows[0].category_id])
    const amount = Math.round(Number(topCatRows[0].total) * 100) / 100
    topExpenseCategory = {
      category_id: topCatRows[0].category_id,
      category_name: c?.name || 'غير محدد',
      category_icon: c?.icon || null,
      category_color: c?.color || null,
      amount,
      percent: Math.round((amount / totalExpense) * 1000) / 10,
    }
  }

  // Savings rate
  let savingsRate = 0
  if (totalIncome > 0) {
    savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10
  }

  // Last 7 days avg
  let last7DaysAvg = 0
  if (daysElapsed > 0) {
    let startDate, endDate
    if (targetYm.y === currentYm.y && targetYm.m === currentYm.m) {
      const end = new Date()
      const start = new Date(end); start.setDate(start.getDate() - 6)
      endDate = `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`
      startDate = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`
    } else {
      const startDay = Math.max(1, dim - 6)
      startDate = `${month}-${pad2(startDay)}`
      endDate = `${month}-${pad2(dim)}`
    }
    const res = await queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE date >= ? AND date <= ? AND date LIKE ? AND type = 'expense'`,
      [startDate, endDate, `${month}-%`]
    )
    last7DaysAvg = Math.round((Number(res?.total || 0) / 7) * 100) / 100
  }

  // Comparison
  let prevMonthStr
  if (compareMonth) {
    prevMonthStr = compareMonth
  } else {
    let py = year, pm = mon - 1
    if (pm <= 0) { pm = 12; py -= 1 }
    prevMonthStr = `${py}-${pad2(pm)}`
  }

  const prevTotals = await query(
    `SELECT type, COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE date LIKE ? GROUP BY type`,
    [`${prevMonthStr}-%`]
  )

  let prevIncome = 0, prevExpense = 0
  for (const t of prevTotals) {
    if (t.type === 'income') prevIncome = Number(t.total)
    else if (t.type === 'expense') prevExpense = Number(t.total)
  }

  const prevNet = prevIncome - prevExpense
  const currentNet = totalIncome - totalExpense

  let comparison = null
  if (prevIncome > 0 || prevExpense > 0) {
    comparison = {
      prev_month: prevMonthStr,
      prev_income: Math.round(prevIncome * 100) / 100,
      prev_expense: Math.round(prevExpense * 100) / 100,
      prev_net: Math.round(prevNet * 100) / 100,
      income_change_percent: pctChange(totalIncome, prevIncome),
      expense_change_percent: pctChange(totalExpense, prevExpense),
      net_change_percent: pctChange(currentNet, prevNet),
    }
  }

  return {
    month,
    days_elapsed: daysElapsed,
    days_in_month: dim,
    avg_daily_expense: avgDailyExpense,
    avg_daily_income: avgDailyIncome,
    top_expense_day: topExpenseDay,
    top_expense_category: topExpenseCategory,
    transaction_count: txnCount,
    savings_rate: savingsRate,
    last_7_days_avg: last7DaysAvg,
    comparison,
  }
}
