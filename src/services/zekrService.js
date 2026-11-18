import { query, queryOne, run, transaction } from '@/db/adapter.js'
import {
  getStats as calcStats,
  getStreak as calcStreak,
} from './statsCalculator.js'
import {
  bufferClick,
  flush as flushClicks,
  getPendingForZekr,
  getPendingMap,
  clearBuffer,
  dropPendingForZekr,
} from './clickBuffer.js'

function genId(prefix) {
  const rand = Math.random().toString(16).substring(2, 14).padEnd(12, '0')
  return `${prefix}_${rand}`
}

function nowMs() {
  return Date.now()
}

// ═══════════════════════════════════════
import { buildXlsxBlob } from '@/utils/csv.js'

// Adhkar
// ═══════════════════════════════════════
export async function getAdhkar() {
  const rows = await query(
    'SELECT * FROM adhkar ORDER BY sort_order ASC, created_at ASC, id ASC'
  )
  return rows.map((r) => ({
    id: String(r.id),
    text: r.text,
    default_target: r.default_target,
    virtue: r.virtue ?? null,
    sort_order: Number(r.sort_order) || 0,
  }))
}

export async function createAdhkar(
  text,
  default_target = null,
  virtue = null
) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('النص مطلوب')
  const cleanVirtue = virtue ? String(virtue).trim() || null : null

  const maxRow = await queryOne(
    'SELECT COALESCE(MAX(sort_order), 0) AS m FROM adhkar'
  )
  const sortOrder = (Number(maxRow?.m) || 0) + 1
  const id = genId('zekr')

  await run(
    'INSERT INTO adhkar (id, text, default_target, virtue, sort_order) VALUES (?, ?, ?, ?, ?)',
    [id, trimmed, default_target, cleanVirtue, sortOrder]
  )
  await run('INSERT OR IGNORE INTO counts (zekr_id, count) VALUES (?, 0)', [id])

  return {
    id,
    text: trimmed,
    default_target,
    virtue: cleanVirtue,
    sort_order: sortOrder,
  }
}

export async function updateAdhkar(
  id,
  text,
  default_target = null,
  virtue = undefined
) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('النص مطلوب')

  const existing = await queryOne('SELECT * FROM adhkar WHERE id = ?', [id])
  if (!existing) throw new Error('الذكر غير موجود')

  const nextVirtue =
    virtue === undefined
      ? (existing.virtue ?? null)
      : String(virtue || '').trim() || null

  await run(
    'UPDATE adhkar SET text = ?, default_target = ?, virtue = ? WHERE id = ?',
    [trimmed, default_target, nextVirtue, id]
  )

  return {
    id: String(id),
    text: trimmed,
    default_target,
    virtue: nextVirtue,
    sort_order: Number(existing.sort_order) || 0,
  }
}

export async function reorderAdhkar(orderedIds = []) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { ok: true }
  const statements = orderedIds.map((id, idx) => ({
    statement: 'UPDATE adhkar SET sort_order = ? WHERE id = ?',
    values: [idx + 1, String(id)],
  }))
  await transaction(statements)
  return { ok: true }
}

export async function deleteAdhkar(id) {
  const existing = await queryOne('SELECT id FROM adhkar WHERE id = ?', [id])
  if (!existing) throw new Error('الذكر غير موجود')
  // تجاهل الضغطات المعلّقة لهذا الذكر حتى لا يفشل الحفظ لاحقًا
  dropPendingForZekr(id)
  await run('DELETE FROM adhkar WHERE id = ?', [id])
}

// ═══════════════════════════════════════
// Counts (DB + pending buffer)
// ═══════════════════════════════════════
export async function getCounts() {
  const rows = await query('SELECT zekr_id, count FROM counts')
  const result = {}
  for (const r of rows) {
    result[String(r.zekr_id)] = Number(r.count) || 0
  }

  const pending = getPendingMap()
  for (const [zekrId, count] of Object.entries(pending)) {
    result[zekrId] = (result[zekrId] || 0) + count
  }

  return result
}

// ═══════════════════════════════════════
// Clicks — BUFFERED (batch every 60s)
// ═══════════════════════════════════════
export async function addClick(zekr_id) {
  const zekr = await queryOne('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
  if (!zekr) throw new Error('الذكر غير موجود')

  bufferClick(zekr_id)

  const row = await queryOne('SELECT count FROM counts WHERE zekr_id = ?', [
    zekr_id,
  ])
  const dbCount = Number(row?.count) || 0
  const pending = getPendingForZekr(zekr_id)

  return { count: dbCount + pending }
}

/**
 * مزامنة التسبيحات المسجّلة أثناء قفل الشاشة (Pocket Mode) دفعة واحدة داخل SQLite.
 * @param {Array<{ zekrId: string, hour: number, count: number }>} items
 * @returns {Promise<number>} إجمالي التسبيحات المضافة
 */
export async function applyPocketClicks(items) {
  if (!Array.isArray(items) || items.length === 0) return 0

  await flushClicks()

  const existingRows = await query('SELECT id FROM adhkar')
  const validIds = new Set(existingRows.map((r) => String(r.id)))

  const statements = []
  const totalsByZekr = new Map()
  let totalInserted = 0

  for (const raw of items) {
    const zekrId = raw?.zekrId ? String(raw.zekrId) : ''
    const hour = Number(raw?.hour)
    const count = Math.floor(Number(raw?.count) || 0)

    if (!zekrId || !validIds.has(zekrId)) continue
    if (!Number.isFinite(hour) || hour <= 0 || count <= 0) continue

    statements.push({
      statement: `INSERT INTO clicks_hourly (zekr_id, hour, count) VALUES (?, ?, ?)
                  ON CONFLICT(zekr_id, hour) DO UPDATE SET count = count + excluded.count`,
      values: [zekrId, hour, count],
    })
    totalsByZekr.set(zekrId, (totalsByZekr.get(zekrId) || 0) + count)
    totalInserted += count
  }

  if (statements.length === 0) return 0

  for (const [zekrId, total] of totalsByZekr) {
    statements.push({
      statement: `INSERT INTO counts (zekr_id, count) VALUES (?, ?)
                  ON CONFLICT(zekr_id) DO UPDATE SET count = count + excluded.count`,
      values: [zekrId, total],
    })
  }

  await transaction(statements)
  return totalInserted
}

export async function resetClick(zekr_id) {
  const zekr = await queryOne('SELECT id FROM adhkar WHERE id = ?', [zekr_id])
  if (!zekr) throw new Error('الذكر غير موجود')

  await flushClicks()

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
      'SELECT text, default_target, virtue FROM adhkar WHERE id = ?',
      [item.zekr_id]
    )
    itemsResponse.push({
      id: item.id,
      zekr_id: item.zekr_id,
      text: zekr?.text ?? item.zekr_id,
      virtue: zekr?.virtue ?? null,
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

  return buildGroupResponse({
    id,
    name: trimmed,
    description,
    created_at: createdAt,
  })
}

export async function updateGroup(id, name, description = null) {
  const existing = await queryOne('SELECT * FROM groups WHERE id = ?', [id])
  if (!existing) throw new Error('المجموعة غير موجودة')

  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('الاسم لا يمكن أن يكون فارغًا')

  await run('UPDATE groups SET name = ?, description = ? WHERE id = ?', [
    trimmed,
    description,
    id,
  ])

  return buildGroupResponse({ ...existing, name: trimmed, description })
}

export async function deleteGroup(id) {
  const existing = await queryOne('SELECT id FROM groups WHERE id = ?', [id])
  if (!existing) throw new Error('المجموعة غير موجودة')
  await run('DELETE FROM groups WHERE id = ?', [id])
}

/**
 * إضافة قالب ورد جاهز (مثل أذكار الصباح/المساء/بعد الصلاة/النوم) بضغطة واحدة.
 * يعيد استخدام الأذكار الموجودة إن تطابقت، ويضيف الناقص مع فضله.
 */
export async function installPresetGroup(pack) {
  if (!pack?.name || !Array.isArray(pack.items) || pack.items.length === 0) {
    throw new Error('قالب الورد غير صالح')
  }

  const dupGroup = await queryOne('SELECT id FROM groups WHERE name = ?', [
    pack.name,
  ])
  if (dupGroup) {
    throw new Error(`مجموعة «${pack.name}» مضافة بالفعل`)
  }

  const existingAdhkar = await query('SELECT id, text, virtue FROM adhkar')
  const byText = new Map(
    existingAdhkar.map((a) => [String(a.text).trim(), a])
  )
  const maxRow = await queryOne(
    'SELECT COALESCE(MAX(sort_order), 0) AS m FROM adhkar'
  )
  let nextSort = Number(maxRow?.m) || 0

  const groupId = genId('grp')
  const createdAt = nowMs()
  const statements = [
    {
      statement:
        'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      values: [groupId, pack.name, pack.description || null, createdAt],
    },
  ]

  pack.items.forEach((item, idx) => {
    const cleanText = String(item.text || '').trim()
    if (!cleanText) return
    let zekrId
    const found = byText.get(cleanText)
    if (found) {
      zekrId = found.id
      if (!found.virtue && item.virtue) {
        statements.push({
          statement: 'UPDATE adhkar SET virtue = ? WHERE id = ?',
          values: [item.virtue, zekrId],
        })
      }
    } else {
      zekrId = genId('zekr')
      nextSort += 1
      statements.push({
        statement:
          'INSERT INTO adhkar (id, text, default_target, virtue, sort_order) VALUES (?, ?, ?, ?, ?)',
        values: [
          zekrId,
          cleanText,
          item.target ?? null,
          item.virtue || null,
          nextSort,
        ],
      })
      statements.push({
        statement: 'INSERT OR IGNORE INTO counts (zekr_id, count) VALUES (?, 0)',
        values: [zekrId],
      })
      byText.set(cleanText, { id: zekrId, text: cleanText, virtue: item.virtue })
    }

    statements.push({
      statement:
        'INSERT INTO group_items (id, group_id, zekr_id, position, target) VALUES (?, ?, ?, ?, ?)',
      values: [genId('gi'), groupId, zekrId, idx + 1, item.target ?? null],
    })
  })

  await transaction(statements)
  return buildGroupResponse({
    id: groupId,
    name: pack.name,
    description: pack.description || null,
    created_at: createdAt,
  })
}

export function exportZekrStatsXlsx(headers, rows) {
  return buildXlsxBlob({
    sheetName: 'إحصائيات الذكر',
    headers,
    rows,
    colWidths: [14, 18, 14, 44],
  })
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
    await run('UPDATE group_items SET target = ? WHERE id = ?', [
      updates.target,
      itemId,
    ])
  }
  if (updates.position !== undefined) {
    await run('UPDATE group_items SET position = ? WHERE id = ?', [
      updates.position,
      itemId,
    ])
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
  await flushClicks()
  await run('UPDATE counts SET count = 0')
  return { ok: true }
}

export async function deleteAllTargets() {
  await run('DELETE FROM targets')
  return { ok: true }
}

export async function deleteAllClicks() {
  await flushClicks()
  clearBuffer()
  await transaction([
    { statement: 'DELETE FROM clicks_hourly', values: [] },
    { statement: 'UPDATE counts SET count = 0', values: [] },
  ])
  return { ok: true }
}

export async function deleteAllData() {
  await flushClicks()
  clearBuffer()
  await transaction([
    { statement: 'DELETE FROM clicks_hourly', values: [] },
    { statement: 'DELETE FROM counts', values: [] },
    { statement: 'DELETE FROM targets', values: [] },
  ])
  return { ok: true }
}

// ═══════════════════════════════════════
// Backup / Restore
// ═══════════════════════════════════════
export async function getBackup() {
  await flushClicks()

  const adhkar = await query(
    'SELECT id, text, default_target, virtue, sort_order FROM adhkar ORDER BY sort_order ASC, id ASC'
  )
  const counts = await query('SELECT zekr_id, count FROM counts')
  const targets = await query(
    'SELECT zekr_id, target FROM targets WHERE target IS NOT NULL'
  )
  const clicks_hourly = await query(
    'SELECT zekr_id, hour, count FROM clicks_hourly'
  )
  const groups = await query(
    'SELECT id, name, description, created_at FROM groups'
  )
  const group_items = await query('SELECT * FROM group_items')

  return {
    version: '2.0',
    exported_at: nowMs(),
    adhkar,
    counts,
    targets,
    clicks_hourly,
    groups,
    group_items,
  }
}

export async function restoreBackup(data) {
  await flushClicks()
  clearBuffer()

  const statements = []

  statements.push({ statement: 'DELETE FROM group_items', values: [] })
  statements.push({ statement: 'DELETE FROM groups', values: [] })
  statements.push({ statement: 'DELETE FROM clicks_hourly', values: [] })
  statements.push({ statement: 'DELETE FROM counts', values: [] })
  statements.push({ statement: 'DELETE FROM targets', values: [] })
  statements.push({ statement: 'DELETE FROM adhkar', values: [] })

  ;(data.adhkar || []).forEach((a, idx) => {
    statements.push({
      statement:
        'INSERT INTO adhkar (id, text, default_target, virtue, sort_order) VALUES (?, ?, ?, ?, ?)',
      values: [
        a.id,
        a.text,
        a.default_target ?? null,
        a.virtue ?? null,
        a.sort_order ?? idx + 1,
      ],
    })
  })

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

  for (const cl of data.clicks_hourly || []) {
    statements.push({
      statement:
        'INSERT INTO clicks_hourly (zekr_id, hour, count) VALUES (?, ?, ?)',
      values: [cl.zekr_id, cl.hour, cl.count],
    })
  }

  for (const cl of data.clicks || []) {
    const ts = cl.clicked_at ?? cl.timestamp
    if (!ts) continue
    const hour = Math.floor(ts / 3600000)
    statements.push({
      statement: `INSERT INTO clicks_hourly (zekr_id, hour, count) VALUES (?, ?, 1)
                  ON CONFLICT(zekr_id, hour) DO UPDATE SET count = count + 1`,
      values: [cl.zekr_id, hour],
    })
  }

  for (const g of data.groups || []) {
    statements.push({
      statement:
        'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      values: [g.id, g.name, g.description, g.created_at ?? nowMs()],
    })
  }

  for (const gi of data.group_items || []) {
    statements.push({
      statement:
        'INSERT INTO group_items (id, group_id, zekr_id, position, target) VALUES (?, ?, ?, ?, ?)',
      values: [
        gi.id ?? genId('gi'),
        gi.group_id,
        gi.zekr_id,
        gi.position ?? 1,
        gi.target ?? null,
      ],
    })
  }

  await transaction(statements)
  return { ok: true, count: (data.adhkar || []).length }
}

// ═══════════════════════════════════════
// Import Legacy
// ═══════════════════════════════════════
function toInt(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}
function toStr(v) {
  return v == null ? null : String(v)
}
function toStrOr(v, fallback) {
  return v == null || v === '' ? fallback : String(v)
}

export async function importLegacy(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new Error('ملف JSON غير صالح')
  }

  await flushClicks()
  clearBuffer()

  console.log('[Legacy] Starting import...')
  console.log('[Legacy] Counts:', {
    adhkar: (legacy.adhkar || []).length,
    counts: (legacy.counts || []).length,
    targets: (legacy.targets || []).length,
    clicks: (legacy.clicks || []).length,
    groups: (legacy.groups || []).length,
    group_items: (legacy.group_items || []).length,
  })

  await run('DELETE FROM group_items')
  await run('DELETE FROM groups')
  await run('DELETE FROM clicks_hourly')
  await run('DELETE FROM counts')
  await run('DELETE FROM targets')
  await run('DELETE FROM adhkar')

  const statements = []
  const seenAdhkarIds = new Set()
  const seenGroupIds = new Set()

  for (const a of legacy.adhkar || []) {
    const id = toStrOr(a.id, genId('zekr'))
    if (!id || seenAdhkarIds.has(id)) continue
    seenAdhkarIds.add(id)

    statements.push({
      statement:
        'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?)',
      values: [id, toStrOr(a.text, '(بدون نص)'), toInt(a.default_target)],
    })
  }
  console.log(`[Legacy] Prepared ${seenAdhkarIds.size} adhkar`)

  for (const c of legacy.counts || []) {
    const zekrId = toStr(c.zekr_id)
    if (!zekrId || !seenAdhkarIds.has(zekrId)) continue

    statements.push({
      statement: 'INSERT INTO counts (zekr_id, count) VALUES (?, ?)',
      values: [zekrId, toInt(c.count) ?? 0],
    })
  }

  for (const t of legacy.targets || []) {
    const zekrId = toStr(t.zekr_id)
    const target = toInt(t.target)
    if (!zekrId || target == null || !seenAdhkarIds.has(zekrId)) continue

    statements.push({
      statement: 'INSERT INTO targets (zekr_id, target) VALUES (?, ?)',
      values: [zekrId, target],
    })
  }

  const clicksMap = new Map()
  for (const cl of legacy.clicks || []) {
    const zekrId = toStr(cl.zekr_id)
    const ts = toInt(cl.timestamp ?? cl.clicked_at)
    if (!zekrId || ts == null || !seenAdhkarIds.has(zekrId)) continue

    const hour = Math.floor(ts / 3600000)
    const key = `${zekrId}|${hour}`
    clicksMap.set(key, (clicksMap.get(key) || 0) + 1)
  }

  for (const [key, count] of clicksMap) {
    const [zekrId, hourStr] = key.split('|')
    statements.push({
      statement:
        'INSERT INTO clicks_hourly (zekr_id, hour, count) VALUES (?, ?, ?)',
      values: [zekrId, Number(hourStr), count],
    })
  }
  console.log(
    `[Legacy] Prepared ${clicksMap.size} hourly groups (from ${(legacy.clicks || []).length
    } clicks)`
  )

  for (const g of legacy.groups || []) {
    const id = toStrOr(g.id, genId('grp'))
    if (!id || seenGroupIds.has(id)) continue
    seenGroupIds.add(id)

    statements.push({
      statement:
        'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      values: [
        id,
        toStrOr(g.name, 'مجموعة'),
        toStr(g.description),
        toInt(g.created_at) ?? Date.now(),
      ],
    })
  }

  for (const gi of legacy.group_items || []) {
    const groupId = toStr(gi.group_id)
    const zekrId = toStr(gi.zekr_id)
    if (!groupId || !zekrId) continue
    if (!seenGroupIds.has(groupId)) continue
    if (!seenAdhkarIds.has(zekrId)) continue

    const id = gi.id != null ? `gi_${gi.id}` : genId('gi')

    statements.push({
      statement:
        'INSERT INTO group_items (id, group_id, zekr_id, position, target) VALUES (?, ?, ?, ?, ?)',
      values: [
        id,
        groupId,
        zekrId,
        toInt(gi.position) ?? 1,
        toInt(gi.target),
      ],
    })
  }

  console.log(`[Legacy] Total INSERTs: ${statements.length}`)

  const CHUNK_SIZE = 100
  let executed = 0
  const failed = []

  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE)
    try {
      await transaction(chunk)
      executed += chunk.length
    } catch {
      console.warn(
        `[Legacy] Chunk ${i}-${i + chunk.length} failed, retrying individually`
      )
      for (const stmt of chunk) {
        try {
          await transaction([stmt])
          executed++
        } catch (e) {
          failed.push({
            sql: stmt.statement.substring(0, 60),
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

  console.log(
    `[Legacy] Done! Imported ${executed}/${statements.length}, Failed: ${failed.length}`
  )

  return {
    adhkar: seenAdhkarIds.size,
    clicks: (legacy.clicks || []).length,
    groups: seenGroupIds.size,
    failed: failed.length,
    total: statements.length,
    imported: executed,
  }
}
