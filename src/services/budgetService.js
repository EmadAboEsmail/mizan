import { validateBackupSection } from './backupValidation.js'
import { query, queryOne, run, transaction } from '@/db/adapter.js'
import {
  computeSummary,
  computeMonthlyTrend,
  computeInsights,
  computeLimitsWithProgress,
  computeLimitItem,
} from './budgetCalculator.js'
import {
  encodeExcelCsvBytes,
  decodeCsvBytes,
  parseCsvRecords,
  buildXlsxBlob,
} from '@/utils/csv.js'
import { getCurrencySymbol } from '@/hooks/useCurrency.js'

function genId(prefix) {
  const rand = Math.random().toString(16).substring(2, 14).padEnd(12, '0')
  return `${prefix}_${rand}`
}

function nowMs() { return Date.now() }

// ═══════════════════════════════════════
// Categories
// ═══════════════════════════════════════
export async function getCategories(type = null) {
  const sql = type
    ? 'SELECT * FROM categories WHERE type = ? ORDER BY type, sort_order, name'
    : 'SELECT * FROM categories ORDER BY type, sort_order, name'
  return query(sql, type ? [type] : [])
}

export async function createCategory(data) {
  const name = String(data.name || '').trim()
  if (!name) throw new Error('الاسم مطلوب')
  if (!['income', 'expense'].includes(data.type)) throw new Error('نوع التصنيف غير صالح')

  const dup = await queryOne(
    'SELECT id FROM categories WHERE name = ? AND type = ?',
    [name, data.type]
  )
  if (dup) throw new Error('يوجد تصنيف بنفس الاسم بالفعل')

  const id = genId('cat')
  await run(
    `INSERT INTO categories (id, name, type, icon, color, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, data.type, data.icon || null, data.color || null, data.sort_order || 0]
  )

  return queryOne('SELECT * FROM categories WHERE id = ?', [id])
}

export async function updateCategory(id, data) {
  const existing = await queryOne('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) throw new Error('التصنيف غير موجود')

  const updates = []
  const params = []

  if (data.name !== undefined) {
    const newName = String(data.name).trim()
    if (!newName) throw new Error('الاسم مطلوب')
    if (newName !== existing.name) {
      const dup = await queryOne(
        'SELECT id FROM categories WHERE name = ? AND type = ? AND id != ?',
        [newName, existing.type, id]
      )
      if (dup) throw new Error('يوجد تصنيف بنفس الاسم بالفعل')
    }
    updates.push('name = ?'); params.push(newName)
  }

  if (data.icon !== undefined) { updates.push('icon = ?'); params.push(data.icon) }
  if (data.color !== undefined) { updates.push('color = ?'); params.push(data.color) }
  if (data.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(data.sort_order) }

  if (updates.length > 0) {
    params.push(id)
    await run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params)
  }

  return queryOne('SELECT * FROM categories WHERE id = ?', [id])
}

export async function deleteCategory(id) {
  const existing = await queryOne('SELECT id FROM categories WHERE id = ?', [id])
  if (!existing) throw new Error('التصنيف غير موجود')

  const cntRes = await queryOne(
    'SELECT COUNT(*) as c FROM transactions WHERE category_id = ?', [id]
  )
  const cnt = Number(cntRes?.c) || 0
  if (cnt > 0) {
    throw new Error(`يوجد ${cnt} معاملة مرتبطة بهذا التصنيف. احذفها أو انقلها أولاً`)
  }

  await run('DELETE FROM categories WHERE id = ?', [id])
}

export async function reorderCategories(orderedIds = []) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { ok: true }
  const stmts = orderedIds.map((id, idx) => ({
    statement: 'UPDATE categories SET sort_order = ? WHERE id = ?',
    values: [idx + 1, String(id)],
  }))
  await transaction(stmts)
  return { ok: true }
}

// ═══════════════════════════════════════
// Wallets & Transfers
// ═══════════════════════════════════════
export async function getWalletsWithBalances() {
  const wallets = await query(
    'SELECT * FROM wallets ORDER BY sort_order ASC, created_at ASC, id ASC'
  )
  const txnAgg = await query(
    `SELECT wallet_id,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS inc,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS exp
     FROM transactions
     WHERE wallet_id IS NOT NULL
     GROUP BY wallet_id`
  )
  const outAgg = await query(
    'SELECT from_wallet_id AS wid, SUM(amount) AS total FROM wallet_transfers GROUP BY from_wallet_id'
  )
  const inAgg = await query(
    'SELECT to_wallet_id AS wid, SUM(amount) AS total FROM wallet_transfers GROUP BY to_wallet_id'
  )

  const txnMap = Object.fromEntries(
    txnAgg.map((r) => [
      r.wallet_id,
      { inc: Number(r.inc) || 0, exp: Number(r.exp) || 0 },
    ])
  )
  const outMap = Object.fromEntries(
    outAgg.map((r) => [r.wid, Number(r.total) || 0])
  )
  const inMap = Object.fromEntries(
    inAgg.map((r) => [r.wid, Number(r.total) || 0])
  )

  return wallets.map((w) => {
    const init = Number(w.initial_balance) || 0
    const inc = txnMap[w.id]?.inc || 0
    const exp = txnMap[w.id]?.exp || 0
    const tIn = inMap[w.id] || 0
    const tOut = outMap[w.id] || 0
    const balance = Math.round((init + inc - exp + tIn - tOut) * 100) / 100
    return {
      id: String(w.id),
      name: w.name,
      icon: w.icon || '💳',
      color: w.color || '#2D6A4F',
      initial_balance: init,
      sort_order: Number(w.sort_order) || 0,
      balance,
    }
  })
}

export async function createWallet(data) {
  const name = String(data?.name || '').trim()
  if (!name) throw new Error('اسم المحفظة مطلوب')
  const id = genId('wallet')
  const initBal = Math.round((Number(data.initial_balance) || 0) * 100) / 100
  const maxRow = await queryOne(
    'SELECT COALESCE(MAX(sort_order), 0) AS m FROM wallets'
  )
  await run(
    `INSERT INTO wallets (id, name, icon, color, initial_balance, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      data.icon || '💳',
      data.color || '#2D6A4F',
      initBal,
      (Number(maxRow?.m) || 0) + 1,
      nowMs(),
    ]
  )
  return queryOne('SELECT * FROM wallets WHERE id = ?', [id])
}

export async function updateWallet(id, data) {
  const existing = await queryOne('SELECT * FROM wallets WHERE id = ?', [id])
  if (!existing) throw new Error('المحفظة غير موجودة')
  const name =
    data.name !== undefined ? String(data.name).trim() : existing.name
  if (!name) throw new Error('اسم المحفظة مطلوب')
  const icon = data.icon !== undefined ? data.icon : existing.icon
  const color = data.color !== undefined ? data.color : existing.color
  const initBal =
    data.initial_balance !== undefined
      ? Math.round((Number(data.initial_balance) || 0) * 100) / 100
      : Number(existing.initial_balance) || 0
  await run(
    'UPDATE wallets SET name = ?, icon = ?, color = ?, initial_balance = ? WHERE id = ?',
    [name, icon, color, initBal, id]
  )
  return queryOne('SELECT * FROM wallets WHERE id = ?', [id])
}

export async function deleteWallet(id) {
  const countRow = await queryOne('SELECT COUNT(*) AS c FROM wallets')
  if ((Number(countRow?.c) || 0) <= 1) {
    throw new Error('يجب الإبقاء على محفظة واحدة على الأقل')
  }
  await run('DELETE FROM wallets WHERE id = ?', [id])
  return { ok: true }
}

export async function getWalletTransfers(limit = 30) {
  return query(
    `SELECT wt.*, wf.name AS from_name, wf.icon AS from_icon,
            wto.name AS to_name, wto.icon AS to_icon
     FROM wallet_transfers wt
     LEFT JOIN wallets wf ON wt.from_wallet_id = wf.id
     LEFT JOIN wallets wto ON wt.to_wallet_id = wto.id
     ORDER BY wt.date DESC, wt.created_at DESC
     LIMIT ?`,
    [limit]
  )
}

export async function createWalletTransfer(data) {
  if (!data?.from_wallet_id || !data?.to_wallet_id) {
    throw new Error('اختر المحفظتين أولاً')
  }
  if (data.from_wallet_id === data.to_wallet_id) {
    throw new Error('لا يمكن التحويل لنفس المحفظة')
  }
  const amount = Math.round((Number(data.amount) || 0) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من صفر')
  }
  const d = new Date()
  const fallbackDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
  const id = genId('trf')
  await run(
    `INSERT INTO wallet_transfers
     (id, from_wallet_id, to_wallet_id, amount, date, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.from_wallet_id,
      data.to_wallet_id,
      amount,
      data.date || fallbackDate,
      data.note?.trim() || null,
      nowMs(),
    ]
  )
  return queryOne('SELECT * FROM wallet_transfers WHERE id = ?', [id])
}

export async function deleteWalletTransfer(id) {
  await run('DELETE FROM wallet_transfers WHERE id = ?', [id])
  return { ok: true }
}

// ═══════════════════════════════════════
// Recurring Transactions
// ═══════════════════════════════════════
function advanceIsoDate(iso, frequency, anchorDay) {
  const [y, m, d] = String(iso).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  if (frequency === 'daily') {
    dt.setDate(dt.getDate() + 1)
  } else if (frequency === 'weekly') {
    dt.setDate(dt.getDate() + 7)
  } else if (frequency === 'yearly') {
    dt.setFullYear(dt.getFullYear() + 1)
  } else {
    // شهري مع حماية نهاية الشهر (مثلاً 31 -> 28 فبراير)
    const targetMonth = dt.getMonth() + 1
    const origDay = anchorDay ?? dt.getDate()
    const nextFirst = new Date(dt.getFullYear(), targetMonth, 1)
    const maxDay = new Date(
      nextFirst.getFullYear(),
      nextFirst.getMonth() + 1,
      0
    ).getDate()
    nextFirst.setDate(Math.min(origDay, maxDay))
    return `${nextFirst.getFullYear()}-${String(
      nextFirst.getMonth() + 1
    ).padStart(2, '0')}-${String(nextFirst.getDate()).padStart(2, '0')}`
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(dt.getDate()).padStart(2, '0')}`
}

function localTodayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getRecurringTransactions() {
  return query(
    `SELECT r.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
     FROM recurring_transactions r
     LEFT JOIN categories c ON r.category_id = c.id
     ORDER BY r.active DESC, r.next_due_date ASC, r.created_at DESC`
  )
}

export async function createRecurringTransaction(data) {
  const title = String(data?.title || '').trim()
  if (!title) throw new Error('اسم المعاملة المتكررة مطلوب')
  const amount = Math.round((Number(data.amount) || 0) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من صفر')
  }
  if (!['income', 'expense'].includes(data.type)) {
    throw new Error('نوع المعاملة غير صالح')
  }
  const freq = ['daily', 'weekly', 'monthly', 'yearly'].includes(data.frequency)
    ? data.frequency
    : 'monthly'
  const nextDue = /^\d{4}-\d{2}-\d{2}$/.test(data.next_due_date || '')
    ? data.next_due_date
    : localTodayIso()
  const id = genId('rec')
  await run(
    `INSERT INTO recurring_transactions
     (id, title, amount, type, category_id, wallet_id, frequency, next_due_date, auto_apply, active, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      title,
      amount,
      data.type,
      data.category_id || null,
      data.wallet_id || null,
      freq,
      nextDue,
      data.auto_apply === false ? 0 : 1,
      data.details?.trim() || title,
      nowMs(),
    ]
  )
  return queryOne('SELECT * FROM recurring_transactions WHERE id = ?', [id])
}

export async function updateRecurringTransaction(id, patch) {
  const existing = await queryOne(
    'SELECT * FROM recurring_transactions WHERE id = ?',
    [id]
  )
  if (!existing) throw new Error('العنصر غير موجود')
  const sets = []
  const vals = []
  if (patch.active !== undefined) {
    sets.push('active = ?')
    vals.push(patch.active ? 1 : 0)
  }
  if (patch.auto_apply !== undefined) {
    sets.push('auto_apply = ?')
    vals.push(patch.auto_apply ? 1 : 0)
  }
  if (patch.amount !== undefined) {
    sets.push('amount = ?')
    vals.push(Math.round((Number(patch.amount) || 0) * 100) / 100)
  }
  if (patch.title !== undefined) {
    sets.push('title = ?')
    vals.push(String(patch.title).trim())
  }
  if (patch.next_due_date !== undefined) {
    sets.push('next_due_date = ?', 'anchor_day = NULL')
    vals.push(patch.next_due_date)
  }
  if (sets.length > 0) {
    vals.push(id)
    await run(
      `UPDATE recurring_transactions SET ${sets.join(', ')} WHERE id = ?`,
      vals
    )
  }
  return queryOne('SELECT * FROM recurring_transactions WHERE id = ?', [id])
}

export async function deleteRecurringTransaction(id) {
  await run('DELETE FROM recurring_transactions WHERE id = ?', [id])
  return { ok: true }
}

export async function applyRecurringNow(id) {
  const rec = await queryOne(
    'SELECT * FROM recurring_transactions WHERE id = ?',
    [id]
  )
  if (!rec) throw new Error('العنصر غير موجود')
  const useDate = rec.next_due_date || localTodayIso()
  const anchorDay = rec.anchor_day ?? Number(useDate.slice(-2))
  const nextDate = advanceIsoDate(useDate, rec.frequency, anchorDay)
  const txnId = genId('txn')
  await transaction([
    {
      statement: `INSERT INTO transactions
        (id, amount, type, category_id, wallet_id, date, details, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        txnId,
        rec.amount,
        rec.type,
        rec.category_id || null,
        rec.wallet_id || null,
        useDate,
        rec.details || rec.title,
        'معاملة متكررة',
        nowMs(),
      ],
    },
    {
      statement:
        'UPDATE recurring_transactions SET next_due_date = ?, last_applied_date = ?, anchor_day = ? WHERE id = ?',
      values: [nextDate, useDate, anchorDay, rec.id],
    },
  ])
  return { applied: 1, next_due_date: nextDate }
}

export async function processDueRecurringTransactions() {
  const today = localTodayIso()
  const due = await query(
    `SELECT * FROM recurring_transactions
     WHERE active = 1 AND auto_apply = 1 AND next_due_date <= ?`,
    [today]
  )
  if (due.length === 0) return { applied: 0 }

  const stmts = []
  let applied = 0

  for (const rec of due) {
    let cursor = rec.next_due_date
    const anchorDay = rec.anchor_day ?? Number(cursor.slice(-2))
    let guard = 0
    let lastUsed = cursor
    // حد أمان 12 دورة متأخرة حتى لا يُنشئ مئات الصفوف لو فُتح بعد سنوات
    while (cursor <= today && guard < 12) {
      stmts.push({
        statement: `INSERT INTO transactions
          (id, amount, type, category_id, wallet_id, date, details, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          genId('txn'),
          rec.amount,
          rec.type,
          rec.category_id || null,
          rec.wallet_id || null,
          cursor,
          rec.details || rec.title,
          'معاملة متكررة تلقائية',
          nowMs(),
        ],
      })
      lastUsed = cursor
      cursor = advanceIsoDate(cursor, rec.frequency, anchorDay)
      applied += 1
      guard += 1
    }
    stmts.push({
      statement:
        'UPDATE recurring_transactions SET next_due_date = ?, last_applied_date = ?, anchor_day = ? WHERE id = ?',
      values: [cursor, lastUsed, anchorDay, rec.id],
    })
  }

  if (stmts.length > 0) await transaction(stmts)
  return { applied }
}

// ═══════════════════════════════════════
// Transactions
// ═══════════════════════════════════════
export async function getTransactions(filters = {}) {
  const conditions = []
  const params = []

  if (filters.month) {
    conditions.push('date LIKE ?')
    params.push(`${filters.month}-%`)
  }
  if (filters.from_date) { conditions.push('date >= ?'); params.push(filters.from_date) }
  if (filters.to_date) { conditions.push('date <= ?'); params.push(filters.to_date) }
  if (filters.type) { conditions.push('type = ?'); params.push(filters.type) }
  if (filters.category_id) { conditions.push('category_id = ?'); params.push(filters.category_id) }
  if (filters.wallet_id) { conditions.push('wallet_id = ?'); params.push(filters.wallet_id) }
  if (filters.search) {
    conditions.push('(details LIKE ? OR description LIKE ?)')
    const p = `%${filters.search.trim()}%`
    params.push(p, p)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = Math.min(Number(filters.limit) || 500, 5000)
  const offset = Math.max(Number(filters.offset) || 0, 0)

  return query(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  )
}

export async function createTransaction(data) {
  const cat = await queryOne('SELECT * FROM categories WHERE id = ?', [data.category_id])
  if (!cat) throw new Error('التصنيف غير موجود')
  if (cat.type !== data.type) {
    throw new Error(`نوع التصنيف (${cat.type}) لا يطابق نوع المعاملة (${data.type})`)
  }

  const id = genId('txn')
  await run(
    `INSERT INTO transactions
     (id, amount, type, category_id, wallet_id, date, details, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      Math.round(data.amount * 100) / 100,
      data.type,
      data.category_id,
      data.wallet_id || null,
      data.date,
      data.details?.trim() || null,
      data.description?.trim() || null,
      nowMs(),
    ]
  )

  return queryOne('SELECT * FROM transactions WHERE id = ?', [id])
}

export async function updateTransaction(id, data) {
  const existing = await queryOne('SELECT * FROM transactions WHERE id = ?', [id])
  if (!existing) throw new Error('المعاملة غير موجودة')

  const newType = data.type ?? existing.type
  const newCatId = data.category_id ?? existing.category_id

  const newCat = await queryOne('SELECT * FROM categories WHERE id = ?', [newCatId])
  if (!newCat) throw new Error('التصنيف غير موجود')
  if (newCat.type !== newType) {
    throw new Error(`نوع التصنيف (${newCat.type}) لا يطابق نوع المعاملة (${newType})`)
  }

  const updates = []
  const params = []

  if (data.amount !== undefined) {
    updates.push('amount = ?')
    params.push(Math.round(data.amount * 100) / 100)
  }
  if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type) }
  if (data.category_id !== undefined) { updates.push('category_id = ?'); params.push(data.category_id) }
  if (data.wallet_id !== undefined) { updates.push('wallet_id = ?'); params.push(data.wallet_id || null) }
  if (data.date !== undefined) { updates.push('date = ?'); params.push(data.date) }
  if (data.details !== undefined) { updates.push('details = ?'); params.push(data.details?.trim() || null) }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description?.trim() || null) }

  if (updates.length > 0) {
    params.push(id)
    await run(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, params)
  }

  return queryOne('SELECT * FROM transactions WHERE id = ?', [id])
}

export async function deleteTransaction(id) {
  const existing = await queryOne('SELECT id FROM transactions WHERE id = ?', [id])
  if (!existing) throw new Error('المعاملة غير موجودة')
  await run('DELETE FROM transactions WHERE id = ?', [id])
}

// ═══════════════════════════════════════
// Summary / Trend / Insights
// ═══════════════════════════════════════
export async function getSummary(month = null) {
  return computeSummary(month)
}

export async function getMonthlyTrend(months = 6, endMonth = null) {
  return computeMonthlyTrend(months, endMonth)
}

export async function getInsights(month, compareMonth = null) {
  return computeInsights(month, compareMonth)
}

// ═══════════════════════════════════════
// Limits
// ═══════════════════════════════════════
export async function getLimits(month) {
  return computeLimitsWithProgress(month)
}

export async function createOrUpdateLimit(data) {
  const cat = await queryOne('SELECT * FROM categories WHERE id = ?', [data.category_id])
  if (!cat) throw new Error('التصنيف غير موجود')
  if (cat.type !== 'expense') throw new Error('الميزانية للتصنيفات المصروفات فقط')

  const existing = await queryOne(
    'SELECT * FROM limits WHERE category_id = ? AND month = ?',
    [data.category_id, data.month]
  )

  const amount = Math.round(data.amount * 100) / 100

  if (existing) {
    await run('UPDATE limits SET amount = ? WHERE id = ?', [amount, existing.id])
    return computeLimitItem(existing.id)
  }

  const id = genId('lim')
  await run(
    'INSERT INTO limits (id, category_id, month, amount) VALUES (?, ?, ?, ?)',
    [id, data.category_id, data.month, amount]
  )
  return computeLimitItem(id)
}

export async function updateLimit(id, amount) {
  const existing = await queryOne('SELECT * FROM limits WHERE id = ?', [id])
  if (!existing) throw new Error('الميزانية غير موجودة')

  await run('UPDATE limits SET amount = ? WHERE id = ?', [
    Math.round(amount * 100) / 100, id,
  ])
  return computeLimitItem(id)
}

export async function deleteLimit(id) {
  const existing = await queryOne('SELECT id FROM limits WHERE id = ?', [id])
  if (!existing) throw new Error('الميزانية غير موجودة')
  await run('DELETE FROM limits WHERE id = ?', [id])
}

/**
 * نسخ حدود الميزانية من أحدث شهر سابق إلى الشهر الحالي بضغطة واحدة.
 */
export async function copyPreviousMonthLimits(targetMonth) {
  if (!/^\d{4}-\d{2}$/.test(targetMonth || '')) {
    throw new Error('اختر شهراً صالحاً أولاً')
  }
  const latestPrev = await queryOne(
    'SELECT month FROM limits WHERE month < ? ORDER BY month DESC LIMIT 1',
    [targetMonth]
  )
  if (!latestPrev?.month) {
    throw new Error('لا توجد حدود في أشهر سابقة لنسخها')
  }
  const sourceRows = await query(
    'SELECT category_id, amount FROM limits WHERE month = ?',
    [latestPrev.month]
  )
  const existingRows = await query(
    'SELECT category_id FROM limits WHERE month = ?',
    [targetMonth]
  )
  const existingCats = new Set(existingRows.map((r) => r.category_id))

  const stmts = []
  for (const row of sourceRows) {
    if (existingCats.has(row.category_id)) continue
    stmts.push({
      statement:
        'INSERT INTO limits (id, category_id, month, amount) VALUES (?, ?, ?, ?)',
      values: [genId('lim'), row.category_id, targetMonth, row.amount],
    })
  }
  if (stmts.length === 0) {
    throw new Error('جميع حدود الشهر السابق مضافة بالفعل لهذا الشهر')
  }
  await transaction(stmts)
  return { copied: stmts.length, fromMonth: latestPrev.month }
}

// ═══════════════════════════════════════
// Backup / Restore / Delete
// ═══════════════════════════════════════
export async function getBudgetBackup() {
  const cats = await query('SELECT * FROM categories')
  const wallets = await query('SELECT * FROM wallets')
  const txns = await query('SELECT * FROM transactions')
  const transfers = await query('SELECT * FROM wallet_transfers')
  const recurring = await query('SELECT * FROM recurring_transactions')
  const lims = await query('SELECT * FROM limits')

  return {
    version: '2.0',
    exported_at: nowMs(),
    categories: cats,
    wallets,
    transactions: txns,
    wallet_transfers: transfers,
    recurring_transactions: recurring,
    limits: lims,
  }
}

export async function prepareBudgetRestore(data) {
  const extra = ['wallets', 'wallet_transfers', 'recurring_transactions', 'limits']
  const current = data?.version === '2.0'
  validateBackupSection(data, ['categories', 'transactions', ...(current ? extra : [])], current ? [] : extra)
  const hasWallets = Array.isArray(data.wallets) && data.wallets.length > 0
  const statements = [
    { statement: 'DELETE FROM limits', values: [] },
    { statement: 'DELETE FROM recurring_transactions', values: [] },
    { statement: 'DELETE FROM wallet_transfers', values: [] },
    { statement: 'DELETE FROM transactions', values: [] },
    { statement: 'DELETE FROM categories', values: [] },
  ]
  if (hasWallets) {
    statements.push({ statement: 'DELETE FROM wallets', values: [] })
  }

  const catIds = new Set()
  const walletIds = new Set()

  if (hasWallets) {
    for (const w of data.wallets) {
      walletIds.add(w.id)
      statements.push({
        statement: `INSERT INTO wallets
          (id, name, icon, color, initial_balance, sort_order, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [
          w.id,
          w.name,
          w.icon ?? '💳',
          w.color ?? '#2D6A4F',
          w.initial_balance ?? 0,
          w.sort_order ?? 0,
          w.created_at ?? nowMs(),
        ],
      })
    }
  } else {
    const curWallets = await query('SELECT id FROM wallets')
    curWallets.forEach((w) => walletIds.add(w.id))
  }

  for (const c of data.categories || []) {
    catIds.add(c.id)
    statements.push({
      statement: 'INSERT INTO categories (id, name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      values: [c.id, c.name, c.type, c.icon ?? null, c.color ?? null, c.sort_order ?? 0],
    })
  }

  let txnCount = 0
  for (const t of data.transactions || []) {
    if (t.category_id && !catIds.has(t.category_id)) continue
    const wId = t.wallet_id && walletIds.has(t.wallet_id) ? t.wallet_id : null
    statements.push({
      statement: `INSERT INTO transactions
        (id, amount, type, category_id, wallet_id, date, details, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        t.id || genId('txn'),
        t.amount,
        t.type,
        t.category_id || null,
        wId,
        t.date,
        t.details ?? null,
        t.description ?? null,
        t.created_at ?? nowMs(),
      ],
    })
    txnCount++
  }

  for (const tr of data.wallet_transfers || []) {
    if (!walletIds.has(tr.from_wallet_id) || !walletIds.has(tr.to_wallet_id)) continue
    statements.push({
      statement: `INSERT INTO wallet_transfers
        (id, from_wallet_id, to_wallet_id, amount, date, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      values: [
        tr.id || genId('trf'),
        tr.from_wallet_id,
        tr.to_wallet_id,
        tr.amount,
        tr.date,
        tr.note ?? null,
        tr.created_at ?? nowMs(),
      ],
    })
  }

  for (const r of data.recurring_transactions || []) {
    statements.push({
      statement: `INSERT INTO recurring_transactions
        (id, title, amount, type, category_id, wallet_id, frequency, next_due_date, anchor_day, auto_apply, active, details, last_applied_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        r.id || genId('rec'),
        r.title,
        r.amount,
        r.type,
        r.category_id && catIds.has(r.category_id) ? r.category_id : null,
        r.wallet_id && walletIds.has(r.wallet_id) ? r.wallet_id : null,
        r.frequency || 'monthly',
        r.next_due_date || localTodayIso(),
        r.anchor_day ?? null,
        r.auto_apply ?? 1,
        r.active ?? 1,
        r.details ?? null,
        r.last_applied_date ?? null,
        r.created_at ?? nowMs(),
      ],
    })
  }

  for (const l of data.limits || []) {
    if (!catIds.has(l.category_id)) continue
    statements.push({
      statement: 'INSERT INTO limits (id, category_id, month, amount) VALUES (?, ?, ?, ?)',
      values: [l.id || genId('lim'), l.category_id, l.month, l.amount],
    })
  }

  return { statements, result: { ok: true, categories: catIds.size, transactions: txnCount } }
}

export async function restoreBudgetBackup(data) {
  const { statements, result } = await prepareBudgetRestore(data)
  await transaction(statements)
  return result
}

export async function deleteAllBudgetData(keepCategories = false) {
  const statements = [
    { statement: 'DELETE FROM transactions', values: [] },
    { statement: 'DELETE FROM wallet_transfers', values: [] },
    { statement: 'DELETE FROM recurring_transactions', values: [] },
    { statement: 'DELETE FROM limits', values: [] },
    { statement: 'UPDATE wallets SET initial_balance = 0', values: [] },
  ]
  if (!keepCategories) {
    statements.push({ statement: 'DELETE FROM categories', values: [] })
  }
  await transaction(statements)
  return { ok: true }
}

// ═══════════════════════════════════════
// CSV & Excel (.xlsx) Export / Import (شهر محدد أو كل الفترات)
// ═══════════════════════════════════════
async function fetchExportRows(month = null) {
  const hasMonth = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)
  return query(
    `SELECT t.date, t.type, t.amount,
            c.name AS category, c.icon AS category_icon, c.color AS category_color,
            w.name AS wallet_name,
            t.details, t.description
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     ${hasMonth ? 'WHERE t.date LIKE ?' : ''}
     ORDER BY t.date DESC, t.created_at DESC`,
    hasMonth ? [`${month}-%`] : []
  )
}

export async function exportBudgetCsv(month = null) {
  const rows = await fetchExportRows(month)
  const sym = getCurrencySymbol()

  const headers = [
    'التاريخ',
    'النوع',
    `المبلغ (${sym})`,
    'التصنيف',
    'المحفظة',
    'الأيقونة',
    'اللون',
    'التفاصيل',
    'الملاحظات',
  ]

  const dataRows = rows.map((r) => [
    r.date || '',
    r.type === 'income' ? 'دخل' : 'مصروف',
    r.amount ?? 0,
    r.category || '',
    r.wallet_name || '',
    r.category_icon || '',
    r.category_color || '',
    r.details || '',
    r.description || '',
  ])

  const bytes = encodeExcelCsvBytes(headers, dataRows)
  return new Blob([bytes], { type: 'text/csv;charset=utf-16le' })
}

export async function exportBudgetXlsx(month = null) {
  const rows = await fetchExportRows(month)
  const sym = getCurrencySymbol()

  const headers = [
    'التاريخ',
    'النوع',
    `المبلغ (${sym})`,
    'التصنيف',
    'المحفظة',
    'التفاصيل',
    'الملاحظات',
  ]

  const dataRows = rows.map((r) => [
    r.date || '',
    r.type === 'income' ? 'دخل' : 'مصروف',
    Number(r.amount) || 0,
    r.category || 'غير محدد',
    r.wallet_name || '—',
    r.details || '',
    r.description || '',
  ])

  return buildXlsxBlob({
    sheetName: month ? `معاملات ${month}` : 'معاملات ميزان',
    headers,
    rows: dataRows,
  })
}

function findHeaderIndex(headers, aliases) {
  for (const alias of aliases) {
    const i = headers.indexOf(alias)
    if (i !== -1) return i
  }
  // مطابقة مرنة للعناوين مثل "المبلغ (ر.س)" أو "المبلغ ($)"
  for (const alias of aliases) {
    const i = headers.findIndex((h) => h.startsWith(`${alias} (`))
    if (i !== -1) return i
  }
  return -1
}

function normalizeTxnType(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (s === 'income' || s === 'دخل' || s === 'إيراد' || s === 'ايراد') {
    return 'income'
  }
  if (s === 'expense' || s === 'مصروف' || s === 'نفقة' || s === 'مصروفات') {
    return 'expense'
  }
  return null
}

function toWesternDigits(str) {
  return String(str || '').replace(/[٠-٩]/g, (d) =>
    String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  )
}

export async function importBudgetCsv(file, clearExisting = false) {
  const buffer = file.arrayBuffer
    ? await file.arrayBuffer()
    : new TextEncoder().encode(await file.text()).buffer
  const text = decodeCsvBytes(buffer)
  const records = parseCsvRecords(text)

  if (records.length < 2) throw new Error('الملف فارغ أو غير صالح')

  const header = records[0].map((h) =>
    h.trim().replace(/^\ufeff/, '').toLowerCase()
  )
  const idx = {
    date: findHeaderIndex(header, ['date', 'التاريخ', 'تاريخ']),
    type: findHeaderIndex(header, ['type', 'النوع', 'نوع']),
    amount: findHeaderIndex(header, [
      'amount',
      'المبلغ',
      'المبلغ (ج.م)',
      'مبلغ',
      'القيمة',
    ]),
    category: findHeaderIndex(header, [
      'category',
      'التصنيف',
      'تصنيف',
      'الفئة',
    ]),
    category_icon: findHeaderIndex(header, [
      'category_icon',
      'الأيقونة',
      'الايقونة',
      'icon',
    ]),
    category_color: findHeaderIndex(header, ['category_color', 'اللون', 'color']),
    details: findHeaderIndex(header, ['details', 'التفاصيل', 'تفاصيل']),
    description: findHeaderIndex(header, [
      'description',
      'الملاحظات',
      'ملاحظات',
      'الوصف',
    ]),
  }

  if (
    idx.date === -1 ||
    idx.type === -1 ||
    idx.amount === -1 ||
    idx.category === -1
  ) {
    throw new Error('أعمدة مفقودة: التاريخ، النوع، المبلغ، التصنيف')
  }

  const existingCats = await query('SELECT * FROM categories')
  const catMap = new Map()
  for (const c of existingCats) catMap.set(`${c.name}|${c.type}`, c)

  const newCats = []
  const txnStatements = []

  let imported = 0,
    createdCats = 0,
    skipped = 0

  for (let i = 1; i < records.length; i++) {
    try {
      const vals = records[i]
      const type = normalizeTxnType(vals[idx.type])
      if (!type) {
        skipped++
        continue
      }

      const rawAmount = toWesternDigits(vals[idx.amount] || '').replace(/,/g, '')
      const amount = parseFloat(rawAmount)
      if (!Number.isFinite(amount) || amount <= 0) {
        skipped++
        continue
      }

      const date = toWesternDigits(vals[idx.date] || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        skipped++
        continue
      }

      const catName = (vals[idx.category] || '').trim() || 'غير محدد'
      const key = `${catName}|${type}`
      let cat = catMap.get(key)

      if (!cat) {
        cat = {
          id: genId('cat'),
          name: catName,
          type,
          icon:
            (idx.category_icon !== -1 ? vals[idx.category_icon] : '')?.trim() ||
            '📦',
          color:
            (idx.category_color !== -1
              ? vals[idx.category_color]
              : ''
            )?.trim() || '#C68B3C',
          sort_order: 0,
        }
        catMap.set(key, cat)
        newCats.push(cat)
        createdCats++
      }

      txnStatements.push({
        statement: `INSERT INTO transactions
          (id, amount, type, category_id, date, details, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          genId('txn'),
          Math.round(amount * 100) / 100,
          type,
          cat.id,
          date,
          (idx.details !== -1 ? vals[idx.details] : '')?.trim() || null,
          (idx.description !== -1 ? vals[idx.description] : '')?.trim() || null,
          nowMs(),
        ],
      })
      imported++
    } catch {
      skipped++
    }
  }

  const statements = []
  if (clearExisting) {
    statements.push({ statement: 'DELETE FROM transactions', values: [] })
  }
  for (const c of newCats) {
    statements.push({
      statement: 'INSERT INTO categories (id, name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      values: [c.id, c.name, c.type, c.icon, c.color, c.sort_order],
    })
  }
  statements.push(...txnStatements)

  await transaction(statements)
  return { ok: true, imported, created_categories: createdCats, skipped }
}
// ═══════════════════════════════════════
// Import Legacy (من FastAPI القديم)
// ═══════════════════════════════════════
function toIntL(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}
function toNumL(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function toStrL(v) {
  return v == null ? null : String(v)
}
function toStrOrL(v, fallback) {
  return v == null || v === '' ? fallback : String(v)
}

export async function importLegacyBudget(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new Error('ملف JSON غير صالح')
  }

  console.log('[Legacy Budget Import] Starting...')
  console.log('[Legacy Budget Import] Categories:', (legacy.categories || []).length)
  console.log('[Legacy Budget Import] Transactions:', (legacy.transactions || []).length)
  console.log('[Legacy Budget Import] Limits:', (legacy.limits || []).length)

  // امسح كل شيء أول
  await run('DELETE FROM limits')
  await run('DELETE FROM transactions')
  await run('DELETE FROM categories')

  const statements = []
  const seenCatIds = new Set()

  // Categories
  for (const c of legacy.categories || []) {
    const id = toStrOrL(c.id, `cat_${Math.random().toString(16).slice(2, 14)}`)
    if (seenCatIds.has(id)) continue
    const type = String(c.type || '').toLowerCase()
    if (!['income', 'expense'].includes(type)) continue
    seenCatIds.add(id)

    statements.push({
      statement: 'INSERT INTO categories (id, name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      values: [
        id,
        toStrOrL(c.name, 'بدون اسم'),
        type,
        toStrL(c.icon),
        toStrL(c.color),
        toIntL(c.sort_order) ?? 0,
      ],
    })
  }

  // Transactions
  let txnCount = 0
  for (const t of legacy.transactions || []) {
    const catId = toStrL(t.category_id)
    if (!catId || !seenCatIds.has(catId)) continue
    const type = String(t.type || '').toLowerCase()
    if (!['income', 'expense'].includes(type)) continue
    const amount = toNumL(t.amount)
    if (amount == null || amount <= 0) continue

    statements.push({
      statement: `INSERT INTO transactions
        (id, amount, type, category_id, date, details, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        toStrOrL(t.id, `txn_${Math.random().toString(16).slice(2, 14)}`),
        Math.round(amount * 100) / 100,
        type,
        catId,
        toStrOrL(t.date, '2024-01-01'),
        toStrL(t.details),
        toStrL(t.description),
        toIntL(t.created_at) ?? Date.now(),
      ],
    })
    txnCount++
  }

  // Limits
  let limitCount = 0
  for (const l of legacy.limits || []) {
    const catId = toStrL(l.category_id)
    if (!catId || !seenCatIds.has(catId)) continue
    const amount = toNumL(l.amount)
    if (amount == null || amount <= 0) continue

    statements.push({
      statement: 'INSERT INTO limits (id, category_id, month, amount) VALUES (?, ?, ?, ?)',
      values: [
        toStrOrL(l.id, `lim_${Math.random().toString(16).slice(2, 14)}`),
        catId,
        toStrOrL(l.month, '2024-01'),
        Math.round(amount * 100) / 100,
      ],
    })
    limitCount++
  }

  console.log(`[Legacy Budget Import] Executing ${statements.length} statements...`)

  // نفذ على chunks
  const CHUNK = 50
  let executed = 0
  const failed = []

  for (let i = 0; i < statements.length; i += CHUNK) {
    const chunk = statements.slice(i, i + CHUNK)
    try {
      await transaction(chunk)
      executed += chunk.length
    } catch {
      console.warn(`[Legacy Budget Import] Chunk ${i} failed, retrying individually`)
      for (const stmt of chunk) {
        try {
          await transaction([stmt])
          executed++
        } catch (e) {
          failed.push({ sql: stmt.statement.substring(0, 50), values: stmt.values, error: e.message })
          console.error('[Legacy Budget Import] ❌ Skipped:', stmt, e.message)
        }
      }
    }
  }

  console.log(`[Legacy Budget Import] Done! Imported ${executed}/${statements.length}, Failed: ${failed.length}`)

  return {
    categories: seenCatIds.size,
    transactions: txnCount,
    limits: limitCount,
    failed: failed.length,
    imported: executed,
  }
}
