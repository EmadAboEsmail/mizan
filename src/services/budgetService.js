import { query, queryOne, run, transaction } from '@/db/adapter.js'
import {
  computeSummary,
  computeMonthlyTrend,
  computeInsights,
  computeLimitsWithProgress,
  computeLimitItem,
} from './budgetCalculator.js'

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
     (id, amount, type, category_id, date, details, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      Math.round(data.amount * 100) / 100,
      data.type,
      data.category_id,
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

// ═══════════════════════════════════════
// Backup / Restore / Delete
// ═══════════════════════════════════════
export async function getBudgetBackup() {
  const cats = await query('SELECT * FROM categories')
  const txns = await query('SELECT * FROM transactions')
  const lims = await query('SELECT * FROM limits')

  return {
    version: '1.0',
    exported_at: nowMs(),
    categories: cats,
    transactions: txns,
    limits: lims,
  }
}

export async function restoreBudgetBackup(data) {
  const statements = [
    { statement: 'DELETE FROM limits', values: [] },
    { statement: 'DELETE FROM transactions', values: [] },
    { statement: 'DELETE FROM categories', values: [] },
  ]

  const catIds = new Set()

  for (const c of data.categories || []) {
    catIds.add(c.id)
    statements.push({
      statement: 'INSERT INTO categories (id, name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      values: [c.id, c.name, c.type, c.icon ?? null, c.color ?? null, c.sort_order ?? 0],
    })
  }

  let txnCount = 0
  for (const t of data.transactions || []) {
    if (!catIds.has(t.category_id)) continue
    statements.push({
      statement: `INSERT INTO transactions
        (id, amount, type, category_id, date, details, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        t.id || genId('txn'), t.amount, t.type, t.category_id, t.date,
        t.details ?? null, t.description ?? null, t.created_at ?? nowMs(),
      ],
    })
    txnCount++
  }

  for (const l of data.limits || []) {
    if (!catIds.has(l.category_id)) continue
    statements.push({
      statement: 'INSERT INTO limits (id, category_id, month, amount) VALUES (?, ?, ?, ?)',
      values: [l.id || genId('lim'), l.category_id, l.month, l.amount],
    })
  }

  await transaction(statements)
  return { ok: true, categories: catIds.size, transactions: txnCount }
}

export async function deleteAllBudgetData(keepCategories = false) {
  const statements = [
    { statement: 'DELETE FROM transactions', values: [] },
    { statement: 'DELETE FROM limits', values: [] },
  ]
  if (!keepCategories) {
    statements.push({ statement: 'DELETE FROM categories', values: [] })
  }
  await transaction(statements)
  return { ok: true }
}

// ═══════════════════════════════════════
// CSV Export / Import
// ═══════════════════════════════════════
export async function exportBudgetCsv() {
  const rows = await query(`
    SELECT t.date, t.type, t.amount,
           c.name AS category, c.icon AS category_icon, c.color AS category_color,
           t.details, t.description
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC, t.created_at DESC
  `)

  const esc = (v) => {
    const s = String(v ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const header = ['date', 'type', 'amount', 'category', 'category_icon', 'category_color', 'details', 'description']
  const lines = [header.join(',')]

  for (const r of rows) {
    lines.push([
      esc(r.date), esc(r.type), esc(r.amount),
      esc(r.category || ''), esc(r.category_icon || ''), esc(r.category_color || ''),
      esc(r.details || ''), esc(r.description || ''),
    ].join(','))
  }

  const text = '\ufeff' + lines.join('\n')
  return new Blob([text], { type: 'text/csv;charset=utf-8' })
}

export async function importBudgetCsv(file, clearExisting = false) {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) throw new Error('الملف فاضي أو غير صالح')

  const parseLine = (line) => {
    const result = []
    let current = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current); current = ''
      } else current += ch
    }
    result.push(current)
    return result
  }

  const header = parseLine(lines[0]).map((h) => h.trim().replace(/^\ufeff/, ''))
  const idx = {
    date: header.indexOf('date'),
    type: header.indexOf('type'),
    amount: header.indexOf('amount'),
    category: header.indexOf('category'),
    category_icon: header.indexOf('category_icon'),
    category_color: header.indexOf('category_color'),
    details: header.indexOf('details'),
    description: header.indexOf('description'),
  }

  if (idx.date === -1 || idx.type === -1 || idx.amount === -1 || idx.category === -1) {
    throw new Error('أعمدة مفقودة: date, type, amount, category')
  }

  const existingCats = await query('SELECT * FROM categories')
  const catMap = new Map()
  for (const c of existingCats) catMap.set(`${c.name}|${c.type}`, c)

  const newCats = []
  const txnStatements = []

  let imported = 0, createdCats = 0, skipped = 0

  for (let i = 1; i < lines.length; i++) {
    try {
      const vals = parseLine(lines[i])
      const type = (vals[idx.type] || '').trim()
      if (!['income', 'expense'].includes(type)) { skipped++; continue }

      const amount = parseFloat((vals[idx.amount] || '').replace(/,/g, ''))
      if (!Number.isFinite(amount) || amount <= 0) { skipped++; continue }

      const date = (vals[idx.date] || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; continue }

      const catName = (vals[idx.category] || '').trim() || 'غير محدد'
      const key = `${catName}|${type}`
      let cat = catMap.get(key)

      if (!cat) {
        cat = {
          id: genId('cat'), name: catName, type,
          icon: (vals[idx.category_icon] || '📦').trim(),
          color: (vals[idx.category_color] || '#64748b').trim(),
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
          genId('txn'), Math.round(amount * 100) / 100, type, cat.id, date,
          vals[idx.details]?.trim() || null,
          vals[idx.description]?.trim() || null,
          nowMs(),
        ],
      })
      imported++
    } catch { skipped++ }
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
    } catch (err) {
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
