import { query, queryOne, run, transaction } from '@/db/adapter.js'
import { getStats as calcStats, getStreak as calcStreak } from './statsCalculator.js'

function genId(prefix) {
  const rand = Math.random().toString(16).substring(2, 14).padEnd(12, '0')
  return `${prefix}_${rand}`
}
function nowMs() { return Date.now() }

// ═══════════════════════════════════════
// Adhkar
// ═══════════════════════════════════════
export async function getAdhkar() {
  const rows = await query('SELECT * FROM adhkar ORDER BY id ASC')
  return rows.map((r) => ({
    id: String(r.id),
    text: r.text,
    default_target: r.default_target,
  }))
}

export async function createAdhkar(text, default_target = null) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('النص مطلوب')

  const id = genId('zekr')

  await run(
    'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?)',
    [id, trimmed, default_target]
  )
  await run('INSERT OR IGNORE INTO counts (zekr_id, count) VALUES (?, 0)', [id])

  return { id, text: trimmed, default_target }
}

export async function updateAdhkar(id, text, default_target = null) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('النص مطلوب')

  const existing = await queryOne('SELECT id FROM adhkar WHERE id = ?', [id])
  if (!existing) throw new Error('الذكر غير موجود')

  await run('UPDATE adhkar SET text = ?, default_target = ? WHERE id = ?', [
    trimmed, default_target, id,
  ])

  return { id: String(id), text: trimmed, default_target }
}

export async function deleteAdhkar(id) {
  const existing = await queryOne('SELECT id FROM adhkar WHERE id = ?', [id])
  if (!existing) throw new Error('الذكر غير موجود')
  await run('DELETE FROM adhkar WHERE id = ?', [id])
}

// ═══════════════════════════════════════
// Counts
// ═══════════════════════════════════════
export async function getCounts() {
  const rows = await query('SELECT zekr_id, count FROM counts')
  const result = {}
  for (const r of rows) result[String(r.zekr_id)] = Number(r.count) || 0
  return result
}

// ═══════════════════════════════════════
// Clicks
// ═══════════════════════════════════════
export async function addClick(zekr_id) {
  const zekr = await queryOne('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
  if (!zekr) throw new Error('الذكر غير موجود')

  await transaction([
    {
      statement: 'INSERT INTO clicks (zekr_id, clicked_at) VALUES (?, ?)',
      values: [zekr_id, nowMs()],
    },
    {
      statement: `INSERT INTO counts (zekr_id, count) VALUES (?, 1)
                  ON CONFLICT(zekr_id) DO UPDATE SET count = count + 1`,
      values: [zekr_id],
    },
  ])

  const row = await queryOne('SELECT count FROM counts WHERE zekr_id = ?', [zekr_id])
  return { count: Number(row?.count) || 0 }
}

export async function resetClick(zekr_id) {
  const zekr = await queryOne('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
  if (!zekr) throw new Error('الذكر غير موجود')

  await run(
    `INSERT INTO counts (zekr_id, count) VALUES (?, 0)
     ON CONFLICT(zekr_id) DO UPDATE SET count = 0`,
    [zekr_id]
  )
  return { ok: true }
}

// ═══════════════════════════════════════
// Targets
// ═══════════════════════════════════════
export async function getTargets() {
  const rows = await query('SELECT zekr_id, target FROM targets')
  const result = {}
  for (const r of rows) {
    if (r.target != null) result[String(r.zekr_id)] = Number(r.target)
  }
  return result
}

export async function setTarget(zekr_id, target) {
  const zekr = await queryOne('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
  if (!zekr) throw new Error('الذكر غير موجود')

  await run(
    `INSERT INTO targets (zekr_id, target) VALUES (?, ?)
     ON CONFLICT(zekr_id) DO UPDATE SET target = excluded.target`,
    [zekr_id, target]
  )
  return { ok: true }
}

// ═══════════════════════════════════════
// Groups
// ═══════════════════════════════════════
async function buildGroupResponse(group) {
  const items = await query(
    'SELECT * FROM group_items WHERE group_id = ? ORDER BY position ASC',
    [group.id]
  )

  const itemsResponse = []
  for (const item of items) {
    const zekr = await queryOne(
      'SELECT text, default_target FROM adhkar WHERE id = ?',
      [item.zekr_id]
    )
    itemsResponse.push({
      id: item.id,
      zekr_id: item.zekr_id,
      text: zekr?.text ?? item.zekr_id,
      position: item.position,
      target: item.target,
      default_target: zekr?.default_target ?? null,
    })
  }

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    created_at: group.created_at,
    items: itemsResponse,
  }
}

export async function getGroups() {
  const groups = await query('SELECT * FROM groups ORDER BY created_at DESC')
  const result = []
  for (const g of groups) result.push(await buildGroupResponse(g))
  return result
}

export async function createGroup(name, description = null) {
  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('اسم المجموعة مطلوب')

  const id = genId('grp')
  const createdAt = nowMs()

  await run(
    'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
    [id, trimmed, description, createdAt]
  )

  return buildGroupResponse({ id, name: trimmed, description, created_at: createdAt })
}

export async function updateGroup(id, name, description = null) {
  const existing = await queryOne('SELECT * FROM groups WHERE id = ?', [id])
  if (!existing) throw new Error('المجموعة غير موجودة')

  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('الاسم لا يمكن أن يكون فارغًا')

  await run('UPDATE groups SET name = ?, description = ? WHERE id = ?', [
    trimmed, description, id,
  ])

  return buildGroupResponse({ ...existing, name: trimmed, description })
}

export async function deleteGroup(id) {
  const existing = await queryOne('SELECT id FROM groups WHERE id = ?', [id])
  if (!existing) throw new Error('المجموعة غير موجودة')
  await run('DELETE FROM groups WHERE id = ?', [id])
}

// ═══════════════════════════════════════
// Group Items
// ═══════════════════════════════════════
export async function addGroupItem(groupId, zekr_id, target = null) {
  const group = await queryOne('SELECT * FROM groups WHERE id = ?', [groupId])
  if (!group) throw new Error('المجموعة غير موجودة')

  const zekr = await queryOne('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
  if (!zekr) throw new Error('الذكر غير موجود')

  const last = await queryOne(
    'SELECT position FROM group_items WHERE group_id = ? ORDER BY position DESC LIMIT 1',
    [groupId]
  )
  const nextPos = (last?.position ?? 0) + 1
  const itemId = genId('gi')

  await run(
    'INSERT INTO group_items (id, group_id, zekr_id, position, target) VALUES (?, ?, ?, ?, ?)',
    [itemId, groupId, zekr_id, nextPos, target]
  )

  return buildGroupResponse(group)
}

export async function updateGroupItem(groupId, itemId, updates) {
  const item = await queryOne(
    'SELECT * FROM group_items WHERE id = ? AND group_id = ?',
    [itemId, groupId]
  )
  if (!item) throw new Error('الذكر غير موجود في المجموعة')

  if (updates.target !== undefined) {
    await run('UPDATE group_items SET target = ? WHERE id = ?', [updates.target, itemId])
  }
  if (updates.position !== undefined) {
    await run('UPDATE group_items SET position = ? WHERE id = ?', [updates.position, itemId])
  }

  const group = await queryOne('SELECT * FROM groups WHERE id = ?', [groupId])
  return buildGroupResponse(group)
}

export async function deleteGroupItem(groupId, itemId) {
  const item = await queryOne(
    'SELECT * FROM group_items WHERE id = ? AND group_id = ?',
    [itemId, groupId]
  )
  if (!item) throw new Error('الذكر غير موجود في المجموعة')

  await run('DELETE FROM group_items WHERE id = ?', [itemId])

  const remaining = await query(
    'SELECT id FROM group_items WHERE group_id = ? ORDER BY position ASC',
    [groupId]
  )
  const statements = remaining.map((r, i) => ({
    statement: 'UPDATE group_items SET position = ? WHERE id = ?',
    values: [i + 1, r.id],
  }))
  if (statements.length > 0) await transaction(statements)

  const group = await queryOne('SELECT * FROM groups WHERE id = ?', [groupId])
  return buildGroupResponse(group)
}

// ═══════════════════════════════════════
// Stats + Streak
// ═══════════════════════════════════════
export async function getStats(period = 'day', zekr_id = null, compare = false) {
  return calcStats(period, zekr_id, compare)
}

export async function getStreak() {
  return calcStreak()
}

// ═══════════════════════════════════════
// Delete All
// ═══════════════════════════════════════
export async function deleteAllCounts() {
  await run('UPDATE counts SET count = 0')
  return { ok: true }
}

export async function deleteAllTargets() {
  await run('DELETE FROM targets')
  return { ok: true }
}

export async function deleteAllClicks() {
  await transaction([
    { statement: 'DELETE FROM clicks', values: [] },
    { statement: 'UPDATE counts SET count = 0', values: [] },
  ])
  return { ok: true }
}

export async function deleteAllData() {
  await transaction([
    { statement: 'DELETE FROM clicks', values: [] },
    { statement: 'DELETE FROM counts', values: [] },
    { statement: 'DELETE FROM targets', values: [] },
  ])
  return { ok: true }
}

// ═══════════════════════════════════════
// Backup / Restore
// ═══════════════════════════════════════
export async function getBackup() {
  const adhkar = await query('SELECT id, text, default_target FROM adhkar')
  const counts = await query('SELECT zekr_id, count FROM counts')
  const targets = await query('SELECT zekr_id, target FROM targets WHERE target IS NOT NULL')
  const clicks = await query('SELECT zekr_id, clicked_at FROM clicks')
  const groups = await query('SELECT id, name, description, created_at FROM groups')
  const group_items = await query('SELECT * FROM group_items')

  return {
    version: '1.0',
    exported_at: nowMs(),
    adhkar, counts, targets, clicks, groups, group_items,
  }
}

export async function restoreBackup(data) {
  const statements = []

  statements.push({ statement: 'DELETE FROM group_items', values: [] })
  statements.push({ statement: 'DELETE FROM groups', values: [] })
  statements.push({ statement: 'DELETE FROM clicks', values: [] })
  statements.push({ statement: 'DELETE FROM counts', values: [] })
  statements.push({ statement: 'DELETE FROM targets', values: [] })
  statements.push({ statement: 'DELETE FROM adhkar', values: [] })

  for (const a of data.adhkar || []) {
    statements.push({
      statement: 'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?)',
      values: [a.id, a.text, a.default_target ?? null],
    })
  }
  for (const c of data.counts || []) {
    statements.push({
      statement: 'INSERT INTO counts (zekr_id, count) VALUES (?, ?)',
      values: [c.zekr_id, c.count],
    })
  }
  for (const t of data.targets || []) {
    if (t.target != null) {
      statements.push({
        statement: 'INSERT INTO targets (zekr_id, target) VALUES (?, ?)',
        values: [t.zekr_id, t.target],
      })
    }
  }
  for (const cl of data.clicks || []) {
    statements.push({
      statement: 'INSERT INTO clicks (zekr_id, clicked_at) VALUES (?, ?)',
      values: [cl.zekr_id, cl.clicked_at ?? cl.timestamp],
    })
  }
  for (const g of data.groups || []) {
    statements.push({
      statement: 'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      values: [g.id, g.name, g.description, g.created_at ?? nowMs()],
    })
  }
  for (const gi of data.group_items || []) {
    statements.push({
      statement: 'INSERT INTO group_items (id, group_id, zekr_id, position, target) VALUES (?, ?, ?, ?, ?)',
      values: [
        gi.id ?? genId('gi'),
        gi.group_id, gi.zekr_id,
        gi.position ?? 1, gi.target ?? null,
      ],
    })
  }

  await transaction(statements)
  return { ok: true, count: (data.adhkar || []).length }
}

// ═══════════════════════════════════════
// Import Legacy (من zekr.db القديم)
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// Type casting helpers
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// Type casting
// ═══════════════════════════════════════
function toInt(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}
function toNum(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function toStr(v) {
  return v == null ? null : String(v)
}
function toStrOr(v, fallback) {
  return v == null || v === '' ? fallback : String(v)
}

// ═══════════════════════════════════════
// Import Legacy — نسخة صلبة
// ═══════════════════════════════════════
export async function importLegacy(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new Error('ملف JSON غير صالح')
  }

  console.log('[Legacy] Starting import...')
  console.log('[Legacy] Counts:', {
    adhkar: (legacy.adhkar || []).length,
    counts: (legacy.counts || []).length,
    targets: (legacy.targets || []).length,
    clicks: (legacy.clicks || []).length,
    groups: (legacy.groups || []).length,
    group_items: (legacy.group_items || []).length,
  })

  // تحقق من شكل البيانات
  if (legacy.adhkar?.[0]) {
    console.log('[Legacy] Sample adhkar:', legacy.adhkar[0])
    console.log('[Legacy] Types:', {
      'id': typeof legacy.adhkar[0].id,
      'default_target': typeof legacy.adhkar[0].default_target,
    })
  }
  if (legacy.counts?.[0]) {
    console.log('[Legacy] Sample counts:', legacy.counts[0])
    console.log('[Legacy] count type:', typeof legacy.counts[0].count)
  }
  if (legacy.clicks?.[0]) {
    console.log('[Legacy] Sample clicks:', legacy.clicks[0])
    console.log('[Legacy] timestamp types:', {
      'timestamp': typeof legacy.clicks[0].timestamp,
      'clicked_at': typeof legacy.clicks[0].clicked_at,
    })
  }

  // ═══════════════════════════════════════
  // 1. امسح كل شيء (DELETEs منفصلة)
  // ═══════════════════════════════════════
  console.log('[Legacy] Step 1: Clearing existing data...')
  await run('DELETE FROM group_items')
  await run('DELETE FROM groups')
  await run('DELETE FROM clicks')
  await run('DELETE FROM counts')
  await run('DELETE FROM targets')
  await run('DELETE FROM adhkar')

  // ═══════════════════════════════════════
  // 2. جمع الـ INSERTs
  // ═══════════════════════════════════════
  const statements = []
  const seenAdhkarIds = new Set()
  const seenGroupIds = new Set()

  // Adhkar
  for (const a of legacy.adhkar || []) {
    const id = toStrOr(a.id, genId('zekr'))
    if (!id || seenAdhkarIds.has(id)) continue
    seenAdhkarIds.add(id)

    statements.push({
      statement: 'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?)',
      values: [id, toStrOr(a.text, '(بدون نص)'), toInt(a.default_target)],
    })
  }
  console.log(`[Legacy] Prepared ${seenAdhkarIds.size} adhkar`)

  // Counts
  let countAdded = 0
  for (const c of legacy.counts || []) {
    const zekrId = toStr(c.zekr_id)
    if (!zekrId || !seenAdhkarIds.has(zekrId)) continue

    statements.push({
      statement: 'INSERT INTO counts (zekr_id, count) VALUES (?, ?)',
      values: [zekrId, toInt(c.count) ?? 0],
    })
    countAdded++
  }
  console.log(`[Legacy] Prepared ${countAdded} counts`)

  // Targets
  for (const t of legacy.targets || []) {
    const zekrId = toStr(t.zekr_id)
    const target = toInt(t.target)
    if (!zekrId || target == null || !seenAdhkarIds.has(zekrId)) continue

    statements.push({
      statement: 'INSERT INTO targets (zekr_id, target) VALUES (?, ?)',
      values: [zekrId, target],
    })
  }

  // Clicks
  let clicksAdded = 0
  for (const cl of legacy.clicks || []) {
    const zekrId = toStr(cl.zekr_id)
    const ts = toInt(cl.timestamp ?? cl.clicked_at)
    if (!zekrId || ts == null || !seenAdhkarIds.has(zekrId)) continue

    statements.push({
      statement: 'INSERT INTO clicks (zekr_id, clicked_at) VALUES (?, ?)',
      values: [zekrId, ts],
    })
    clicksAdded++
  }
  console.log(`[Legacy] Prepared ${clicksAdded} clicks`)

  // Groups
  for (const g of legacy.groups || []) {
    const id = toStrOr(g.id, genId('grp'))
    if (!id || seenGroupIds.has(id)) continue
    seenGroupIds.add(id)

    statements.push({
      statement: 'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      values: [
        id,
        toStrOr(g.name, 'مجموعة'),
        toStr(g.description),
        toInt(g.created_at) ?? Date.now(),
      ],
    })
  }

  // Group Items
  for (const gi of legacy.group_items || []) {
    const groupId = toStr(gi.group_id)
    const zekrId = toStr(gi.zekr_id)
    if (!groupId || !zekrId) continue
    if (!seenGroupIds.has(groupId)) continue
    if (!seenAdhkarIds.has(zekrId)) continue

    const id = gi.id != null ? `gi_${gi.id}` : genId('gi')

    statements.push({
      statement: 'INSERT INTO group_items (id, group_id, zekr_id, position, target) VALUES (?, ?, ?, ?, ?)',
      values: [
        id,
        groupId,
        zekrId,
        toInt(gi.position) ?? 1,
        toInt(gi.target),
      ],
    })
  }

  console.log(`[Legacy] Total INSERTs prepared: ${statements.length}`)

  // ═══════════════════════════════════════
  // 3. تنفيذ الإدخالات — chunk + fallback
  // ═══════════════════════════════════════
  const CHUNK_SIZE = 50
  let executed = 0
  const failed = []

  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE)
    try {
      await transaction(chunk)
      executed += chunk.length
      if ((i / CHUNK_SIZE) % 5 === 0) {
        console.log(`[Legacy] ✅ ${executed}/${statements.length}`)
      }
    } catch (err) {
      console.warn(`[Legacy] ⚠️ Chunk ${i}-${i + chunk.length} failed — retrying individually`)
      // Fallback: واحد واحد
      for (const stmt of chunk) {
        try {
          await transaction([stmt])
          executed++
        } catch (e) {
          failed.push({
            sql: stmt.statement,
            values: stmt.values,
            error: e.message,
          })
          console.error('[Legacy] ❌ Skipped:', {
            sql: stmt.statement.substring(0, 60),
            values: stmt.values,
            error: e.message,
          })
        }
      }
    }
  }

  console.log(`[Legacy] Done! Imported ${executed}/${statements.length}, Failed: ${failed.length}`)

  return {
    adhkar: seenAdhkarIds.size,
    clicks: clicksAdded,
    groups: seenGroupIds.size,
    failed: failed.length,
    total: statements.length,
    imported: executed,
  }
}
