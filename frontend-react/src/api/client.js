import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const DB_NAME = 'zekr_db'
let dbInstance = null
let sqliteConn = null

// =================================================================
// 1. Schema + Seed Data
// =================================================================

const INIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS adhkar (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  default_target INTEGER
);

CREATE TABLE IF NOT EXISTS counts (
  zekr_id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS targets (
  zekr_id TEXT PRIMARY KEY,
  target INTEGER
);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zekr_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS group_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  zekr_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  target INTEGER
);

CREATE INDEX IF NOT EXISTS idx_clicks_zekr ON clicks(zekr_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_group_items_group ON group_items(group_id);
`

const SEED_ADHKAR = [
  { id: 'zekr_1', text: 'سبحان الله وبحمده، سبحان الله العظيم', default_target: 100 },
  { id: 'zekr_2', text: 'أستغفر الله العظيم وأتوب إليه', default_target: 100 },
  { id: 'zekr_3', text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', default_target: 100 },
  { id: 'zekr_4', text: 'اللهم صلِّ وسلِّم وبارك على نبينا محمد', default_target: 10 },
  { id: 'zekr_5', text: 'سبحان الله', default_target: 33 },
  { id: 'zekr_6', text: 'الحمد لله', default_target: 33 },
  { id: 'zekr_7', text: 'الله أكبر', default_target: 34 },
  { id: 'zekr_8', text: 'لا حول ولا قوة إلا بالله العلي العظيم', default_target: 33 },
]

const DEFAULT_GROUPS = [
  {
    id: 'grp_after_prayer',
    name: 'أذكار ما بعد الصلاة',
    description: 'التسبيح والتحميد والتكبير بعد الصلاة',
    created_at: 1700000000000,
    items: [
      { id: 1, zekr_id: 'zekr_5', position: 1, target: 33 },
      { id: 2, zekr_id: 'zekr_6', position: 2, target: 33 },
      { id: 3, zekr_id: 'zekr_7', position: 3, target: 34 },
    ],
  },
]

// =================================================================
// 2. Helpers
// =================================================================

const uid = (prefix = '') => {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').substring(0, 12)
      : Date.now().toString(36) + Math.random().toString(36).substring(2, 12)
  return `${prefix}${rand}`
}

// تنفيذ داخل transaction — يرجع rollback لو حصل خطأ
async function withTransaction(db, fn) {
  await db.execute('BEGIN TRANSACTION;')
  try {
    const result = await fn()
    await db.execute('COMMIT;')
    return result
  } catch (err) {
    try {
      await db.execute('ROLLBACK;')
    } catch (rollbackErr) {
      console.error('فشل rollback:', rollbackErr)
    }
    throw err
  }
}

// =================================================================
// 3. تهيئة قاعدة البيانات
// =================================================================

async function getDB() {
  if (dbInstance) return dbInstance

  const isNative = Capacitor.isNativePlatform()

  if (!isNative) {
    // Web preview — localStorage
    return null
  }

  if (!sqliteConn) {
    sqliteConn = new SQLiteConnection(CapacitorSQLite)
  }

  const ret = await sqliteConn.checkConnectionsConsistency()
  const isConn = (await sqliteConn.isConnection(DB_NAME, false)).result

  if (ret.result && isConn) {
    dbInstance = await sqliteConn.retrieveConnection(DB_NAME, false)
  } else {
    dbInstance = await sqliteConn.createConnection(
      DB_NAME,
      false,
      'no-encryption',
      1,
      false
    )
  }

  await dbInstance.open()
  await dbInstance.execute(INIT_SCHEMA)

  // Seed أول مرة
  const res = await dbInstance.query('SELECT COUNT(*) as count FROM adhkar;')
  if ((res.values?.[0]?.count || 0) === 0) {
    await withTransaction(dbInstance, async () => {
      for (const a of SEED_ADHKAR) {
        await dbInstance.run(
          'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?);',
          [a.id, a.text, a.default_target]
        )
      }
      const now = Date.now()
      await dbInstance.run(
        'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?);',
        [DEFAULT_GROUPS[0].id, DEFAULT_GROUPS[0].name, DEFAULT_GROUPS[0].description, now]
      )
      for (const it of DEFAULT_GROUPS[0].items) {
        await dbInstance.run(
          'INSERT INTO group_items (group_id, zekr_id, position, target) VALUES (?, ?, ?, ?);',
          [DEFAULT_GROUPS[0].id, it.zekr_id, it.position, it.target]
        )
      }
    })
  }

  return dbInstance
}

// التحقق من وجود ذكر
async function assertZekrExists(db, zekr_id) {
  const check = await db.query('SELECT id FROM adhkar WHERE id = ?;', [zekr_id])
  if (!check.values?.length) {
    throw new Error('الذكر غير موجود')
  }
}

// =================================================================
// 4. Adhkar
// =================================================================

export async function getAdhkar() {
  const db = await getDB()
  if (db) {
    const res = await db.query('SELECT * FROM adhkar;')
    return res.values || []
  }
  const data = localStorage.getItem('zekr_adhkar')
  return data ? JSON.parse(data) : SEED_ADHKAR
}

export async function createAdhkar(text, default_target = null) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('النص مطلوب')

  const db = await getDB()
  const id = uid('zekr_')
  const target = default_target ? Number(default_target) : null

  if (db) {
    await db.run(
      'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?);',
      [id, trimmed, target]
    )
    return { id, text: trimmed, default_target: target }
  }

  const adhkar = await getAdhkar()
  const newZekr = { id, text: trimmed, default_target: target }
  adhkar.push(newZekr)
  localStorage.setItem('zekr_adhkar', JSON.stringify(adhkar))
  return newZekr
}

export async function updateAdhkar(id, text, default_target = null) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('النص مطلوب')

  const db = await getDB()
  const target = default_target ? Number(default_target) : null

  if (db) {
    await db.run(
      'UPDATE adhkar SET text = ?, default_target = ? WHERE id = ?;',
      [trimmed, target, id]
    )
    return { id, text: trimmed, default_target: target }
  }

  const adhkar = await getAdhkar()
  const idx = adhkar.findIndex((z) => z.id === id)
  if (idx === -1) throw new Error('الذكر غير موجود')
  adhkar[idx] = { id, text: trimmed, default_target: target }
  localStorage.setItem('zekr_adhkar', JSON.stringify(adhkar))
  return adhkar[idx]
}

export async function deleteAdhkar(id) {
  const db = await getDB()

  if (db) {
    return withTransaction(db, async () => {
      await db.run('DELETE FROM clicks WHERE zekr_id = ?;', [id])
      await db.run('DELETE FROM counts WHERE zekr_id = ?;', [id])
      await db.run('DELETE FROM targets WHERE zekr_id = ?;', [id])
      await db.run('DELETE FROM group_items WHERE zekr_id = ?;', [id])
      await db.run('DELETE FROM adhkar WHERE id = ?;', [id])
      return { ok: true }
    })
  }

  let adhkar = await getAdhkar()
  adhkar = adhkar.filter((z) => z.id !== id)
  localStorage.setItem('zekr_adhkar', JSON.stringify(adhkar))
  return { ok: true }
}

// =================================================================
// 5. Counts & Targets
// =================================================================

export async function getCounts() {
  const db = await getDB()
  if (db) {
    const res = await db.query('SELECT zekr_id, count FROM counts;')
    const map = {}
      ; (res.values || []).forEach((row) => {
        map[row.zekr_id] = row.count
      })
    return map
  }
  const data = localStorage.getItem('zekr_counts')
  return data ? JSON.parse(data) : {}
}

export async function getTargets() {
  const db = await getDB()
  if (db) {
    const res = await db.query('SELECT zekr_id, target FROM targets;')
    const map = {}
      ; (res.values || []).forEach((row) => {
        map[row.zekr_id] = row.target
      })
    return map
  }
  const data = localStorage.getItem('zekr_targets')
  return data ? JSON.parse(data) : {}
}

export async function setTarget(zekr_id, target) {
  const db = await getDB()
  const numTarget = target ? Number(target) : null

  if (db) {
    if (numTarget === null) {
      await db.run('DELETE FROM targets WHERE zekr_id = ?;', [zekr_id])
    } else {
      await db.run(
        'INSERT OR REPLACE INTO targets (zekr_id, target) VALUES (?, ?);',
        [zekr_id, numTarget]
      )
    }
    return { ok: true }
  }

  const targets = await getTargets()
  if (numTarget === null) delete targets[zekr_id]
  else targets[zekr_id] = numTarget
  localStorage.setItem('zekr_targets', JSON.stringify(targets))
  return { ok: true }
}

// =================================================================
// 6. Clicks
// =================================================================

export async function addClick(zekr_id) {
  const db = await getDB()
  const timestamp = Date.now()

  if (db) {
    return withTransaction(db, async () => {
      await assertZekrExists(db, zekr_id)

      await db.run(
        'INSERT INTO clicks (zekr_id, timestamp) VALUES (?, ?);',
        [zekr_id, timestamp]
      )

      const countRes = await db.query(
        'SELECT count FROM counts WHERE zekr_id = ?;',
        [zekr_id]
      )
      const current = countRes.values?.[0]?.count || 0
      const nextCount = current + 1

      await db.run(
        'INSERT OR REPLACE INTO counts (zekr_id, count) VALUES (?, ?);',
        [zekr_id, nextCount]
      )

      return { count: nextCount }
    })
  }

  // Fallback
  const counts = await getCounts()
  const nextCount = (counts[zekr_id] || 0) + 1
  counts[zekr_id] = nextCount
  localStorage.setItem('zekr_counts', JSON.stringify(counts))

  const clicks = JSON.parse(localStorage.getItem('zekr_clicks') || '[]')
  clicks.push({ zekr_id, timestamp })
  localStorage.setItem('zekr_clicks', JSON.stringify(clicks))

  return { count: nextCount }
}

export async function resetClick(zekr_id) {
  const db = await getDB()
  if (db) {
    await db.run(
      'INSERT OR REPLACE INTO counts (zekr_id, count) VALUES (?, 0);',
      [zekr_id]
    )
    return { ok: true }
  }
  const counts = await getCounts()
  counts[zekr_id] = 0
  localStorage.setItem('zekr_counts', JSON.stringify(counts))
  return { ok: true }
}

// =================================================================
// 7. Stats
// =================================================================

function getBucketKey(date, period) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  if (period === 'day') return `${y}-${m}-${d}`
  if (period === 'month') return `${y}-${m}`
  if (period === 'year') return `${y}`
  if (period === 'week') {
    const tempDate = new Date(date.getTime())
    tempDate.setHours(0, 0, 0, 0)
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7))
    const week1 = new Date(tempDate.getFullYear(), 0, 4)
    const weekNum =
      1 +
      Math.round(
        ((tempDate.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
        7
      )
    return `${y}-W${String(weekNum).padStart(2, '0')}`
  }
  return `${y}-${m}-${d}`
}

export async function getStats(period = 'day', zekr_id = null) {
  const db = await getDB()
  const now = new Date()
  const buckets = []
  let startDate = new Date()

  if (period === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      buckets.push(getBucketKey(d, 'day'))
    }
    startDate.setDate(startDate.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      buckets.push(getBucketKey(d, 'week'))
    }
    startDate.setDate(startDate.getDate() - 21)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push(getBucketKey(d, 'month'))
    }
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  } else if (period === 'year') {
    for (let i = 4; i >= 0; i--) {
      buckets.push(String(now.getFullYear() - i))
    }
    startDate = new Date(now.getFullYear() - 4, 0, 1)
  }

  const startMs = startDate.getTime()
  let clicks = []

  if (db) {
    let sql = 'SELECT zekr_id, timestamp FROM clicks WHERE timestamp >= ?;'
    const params = [startMs]
    if (zekr_id) {
      sql =
        'SELECT zekr_id, timestamp FROM clicks WHERE timestamp >= ? AND zekr_id = ?;'
      params.push(zekr_id)
    }
    const res = await db.query(sql, params)
    clicks = res.values || []
  } else {
    const raw = JSON.parse(localStorage.getItem('zekr_clicks') || '[]')
    clicks = raw.filter(
      (c) => c.timestamp >= startMs && (!zekr_id || c.zekr_id === zekr_id)
    )
  }

  const bucketCounts = {}
  clicks.forEach((c) => {
    const key = getBucketKey(new Date(c.timestamp), period)
    bucketCounts[key] = (bucketCounts[key] || 0) + 1
  })

  const values = buckets.map((b) => bucketCounts[b] || 0)

  let breakdown = []
  if (!zekr_id) {
    const countsByZekr = {}
    clicks.forEach((c) => {
      countsByZekr[c.zekr_id] = (countsByZekr[c.zekr_id] || 0) + 1
    })

    const adhkar = await getAdhkar()
    const textMap = {}
    adhkar.forEach((a) => {
      textMap[a.id] = a.text
    })

    breakdown = Object.keys(countsByZekr)
      .map((zid) => ({
        zekr_id: zid,
        text: textMap[zid] || 'ذكر',
        count: countsByZekr[zid],
      }))
      .sort((a, b) => b.count - a.count)
  }

  return {
    labels: buckets,
    values,
    total: values.reduce((sum, v) => sum + v, 0),
    breakdown,
  }
}

// =================================================================
// 8. Groups
// =================================================================

export async function getGroups() {
  const db = await getDB()
  const adhkar = await getAdhkar()
  const textMap = {}
  const targetMap = {}
  adhkar.forEach((a) => {
    textMap[a.id] = a.text
    targetMap[a.id] = a.default_target
  })

  if (db) {
    const gRes = await db.query('SELECT * FROM groups ORDER BY created_at DESC;')
    const groups = gRes.values || []
    const iRes = await db.query('SELECT * FROM group_items ORDER BY position ASC;')
    const items = iRes.values || []

    return groups.map((g) => ({
      ...g,
      items: items
        .filter((it) => it.group_id === g.id)
        .map((it) => ({
          ...it,
          text: textMap[it.zekr_id] || 'ذكر',
          default_target: targetMap[it.zekr_id] || null,
        })),
    }))
  }

  const raw = localStorage.getItem('zekr_groups')
  const groups = raw ? JSON.parse(raw) : DEFAULT_GROUPS

  return groups.map((g) => ({
    ...g,
    items: (g.items || []).map((it) => ({
      ...it,
      text: textMap[it.zekr_id] || 'ذكر',
      default_target: targetMap[it.zekr_id] || null,
    })),
  }))
}

export async function createGroup(name, description = null) {
  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('الاسم مطلوب')

  const db = await getDB()
  const id = uid('grp_')
  const now = Date.now()

  if (db) {
    await db.run(
      'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?);',
      [id, trimmed, description ? description.trim() : null, now]
    )
    return {
      id,
      name: trimmed,
      description: description ? description.trim() : null,
      created_at: now,
      items: [],
    }
  }

  const groups = await getGroups()
  const newG = {
    id,
    name: trimmed,
    description: description ? description.trim() : null,
    created_at: now,
    items: [],
  }
  groups.unshift(newG)
  localStorage.setItem('zekr_groups', JSON.stringify(groups))
  return newG
}

export async function updateGroup(id, name, description = null) {
  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('الاسم مطلوب')

  const db = await getDB()

  if (db) {
    await db.run(
      'UPDATE groups SET name = ?, description = ? WHERE id = ?;',
      [trimmed, description ? description.trim() : null, id]
    )
    // نرجع المجموعة كاملة مع items
    const groups = await getGroups()
    return groups.find((g) => g.id === id)
  }

  const groups = await getGroups()
  const g = groups.find((item) => item.id === id)
  if (!g) throw new Error('المجموعة غير موجودة')
  g.name = trimmed
  g.description = description ? description.trim() : null
  localStorage.setItem('zekr_groups', JSON.stringify(groups))
  return g
}

export async function deleteGroup(id) {
  const db = await getDB()

  if (db) {
    return withTransaction(db, async () => {
      await db.run('DELETE FROM group_items WHERE group_id = ?;', [id])
      await db.run('DELETE FROM groups WHERE id = ?;', [id])
      return { ok: true }
    })
  }

  let groups = await getGroups()
  groups = groups.filter((g) => g.id !== id)
  localStorage.setItem('zekr_groups', JSON.stringify(groups))
  return { ok: true }
}

export async function addGroupItem(groupId, zekr_id, target = null) {
  const db = await getDB()
  const numTarget = target ? Number(target) : null

  if (db) {
    return withTransaction(db, async () => {
      await assertZekrExists(db, zekr_id)

      const posRes = await db.query(
        'SELECT MAX(position) as maxPos FROM group_items WHERE group_id = ?;',
        [groupId]
      )
      const nextPos = (posRes.values?.[0]?.maxPos || 0) + 1

      await db.run(
        'INSERT INTO group_items (group_id, zekr_id, position, target) VALUES (?, ?, ?, ?);',
        [groupId, zekr_id, nextPos, numTarget]
      )

      // نرجع المجموعة كاملة
      const groups = await getGroups()
      return groups.find((g) => g.id === groupId)
    })
  }

  const groups = await getGroups()
  const g = groups.find((item) => item.id === groupId)
  if (!g) throw new Error('المجموعة غير موجودة')
  if (!g.items) g.items = []
  g.items.push({
    id: Date.now(),
    zekr_id,
    position: g.items.length + 1,
    target: numTarget,
  })
  localStorage.setItem('zekr_groups', JSON.stringify(groups))
  return g
}

export async function updateGroupItem(groupId, itemId, updates) {
  const db = await getDB()

  if (db) {
    await withTransaction(db, async () => {
      if (updates.target !== undefined) {
        await db.run(
          'UPDATE group_items SET target = ? WHERE id = ?;',
          [updates.target, itemId]
        )
      }
      if (updates.position !== undefined) {
        await db.run(
          'UPDATE group_items SET position = ? WHERE id = ?;',
          [updates.position, itemId]
        )
      }
    })
    const groups = await getGroups()
    return groups.find((g) => g.id === groupId)
  }

  const groups = await getGroups()
  const g = groups.find((item) => item.id === groupId)
  if (!g) throw new Error('المجموعة غير موجودة')
  const it = (g.items || []).find((i) => i.id === itemId)
  if (!it) throw new Error('الذكر غير موجود في المجموعة')
  if (updates.target !== undefined) it.target = updates.target
  if (updates.position !== undefined) it.position = updates.position
  localStorage.setItem('zekr_groups', JSON.stringify(groups))
  return g
}

export async function deleteGroupItem(groupId, itemId) {
  const db = await getDB()

  if (db) {
    return withTransaction(db, async () => {
      await db.run('DELETE FROM group_items WHERE id = ?;', [itemId])

      // إعادة ترقيم الباقي
      const remaining = await db.query(
        'SELECT id FROM group_items WHERE group_id = ? ORDER BY position;',
        [groupId]
      )
      const rows = remaining.values || []
      for (let i = 0; i < rows.length; i++) {
        await db.run('UPDATE group_items SET position = ? WHERE id = ?;', [
          i + 1,
          rows[i].id,
        ])
      }

      const groups = await getGroups()
      return groups.find((g) => g.id === groupId)
    })
  }

  const groups = await getGroups()
  const g = groups.find((item) => item.id === groupId)
  if (!g) throw new Error('المجموعة غير موجودة')
  g.items = (g.items || []).filter((i) => i.id !== itemId)
  g.items.forEach((it, i) => {
    it.position = i + 1
  })
  localStorage.setItem('zekr_groups', JSON.stringify(groups))
  return g
}

// =================================================================
// 9. مسح البيانات
// =================================================================

export async function deleteAllCounts() {
  const db = await getDB()
  if (db) await db.run('DELETE FROM counts;')
  localStorage.removeItem('zekr_counts')
  return { ok: true }
}

export async function deleteAllTargets() {
  const db = await getDB()
  if (db) await db.run('DELETE FROM targets;')
  localStorage.removeItem('zekr_targets')
  return { ok: true }
}

export async function deleteAllClicks() {
  const db = await getDB()
  if (db) {
    await withTransaction(db, async () => {
      await db.run('DELETE FROM clicks;')
      await db.run('DELETE FROM counts;')
    })
  }
  localStorage.removeItem('zekr_clicks')
  localStorage.removeItem('zekr_counts')
  return { ok: true }
}

export async function deleteAllData() {
  const db = await getDB()
  if (db) {
    await withTransaction(db, async () => {
      await db.run('DELETE FROM clicks;')
      await db.run('DELETE FROM counts;')
      await db.run('DELETE FROM targets;')
    })
  }
  localStorage.removeItem('zekr_clicks')
  localStorage.removeItem('zekr_counts')
  localStorage.removeItem('zekr_targets')
  return { ok: true }
}

// =================================================================
// 10. Backup & Restore
// =================================================================

export async function getBackup() {
  const db = await getDB()
  if (db) {
    const adhkar = (await db.query('SELECT * FROM adhkar;')).values || []
    const counts = (await db.query('SELECT * FROM counts;')).values || []
    const targets = (await db.query('SELECT * FROM targets;')).values || []
    const clicks = (await db.query('SELECT * FROM clicks;')).values || []
    const groups = (await db.query('SELECT * FROM groups;')).values || []
    const group_items = (await db.query('SELECT * FROM group_items;')).values || []

    return {
      version: '1.0',
      exported_at: Date.now(),
      adhkar,
      counts,
      targets,
      clicks,
      groups,
      group_items,
    }
  }

  return {
    version: '1.0',
    exported_at: Date.now(),
    adhkar: await getAdhkar(),
    counts: await getCounts(),
    targets: await getTargets(),
    clicks: JSON.parse(localStorage.getItem('zekr_clicks') || '[]'),
    groups: await getGroups(),
  }
}

export async function restoreBackup(data) {
  const db = await getDB()

  if (db) {
    return withTransaction(db, async () => {
      // امسح كل حاجة الأول
      await db.run('DELETE FROM group_items;')
      await db.run('DELETE FROM groups;')
      await db.run('DELETE FROM clicks;')
      await db.run('DELETE FROM counts;')
      await db.run('DELETE FROM targets;')
      await db.run('DELETE FROM adhkar;')

      // أضف الأذكار
      for (const a of data.adhkar || []) {
        await db.run(
          'INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?);',
          [a.id, a.text, a.default_target]
        )
      }

      // الأعداد (List أو Dict)
      if (Array.isArray(data.counts)) {
        for (const c of data.counts) {
          await db.run(
            'INSERT OR REPLACE INTO counts (zekr_id, count) VALUES (?, ?);',
            [c.zekr_id, c.count]
          )
        }
      } else if (data.counts && typeof data.counts === 'object') {
        for (const [zid, cnt] of Object.entries(data.counts)) {
          await db.run(
            'INSERT OR REPLACE INTO counts (zekr_id, count) VALUES (?, ?);',
            [zid, cnt]
          )
        }
      }

      // الأهداف
      if (Array.isArray(data.targets)) {
        for (const t of data.targets) {
          await db.run(
            'INSERT OR REPLACE INTO targets (zekr_id, target) VALUES (?, ?);',
            [t.zekr_id, t.target]
          )
        }
      } else if (data.targets && typeof data.targets === 'object') {
        for (const [zid, trg] of Object.entries(data.targets)) {
          await db.run(
            'INSERT OR REPLACE INTO targets (zekr_id, target) VALUES (?, ?);',
            [zid, trg]
          )
        }
      }

      // الضغطات
      for (const cl of data.clicks || []) {
        await db.run(
          'INSERT INTO clicks (zekr_id, timestamp) VALUES (?, ?);',
          [cl.zekr_id, cl.timestamp]
        )
      }

      // المجموعات
      for (const g of data.groups || []) {
        await db.run(
          'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?);',
          [g.id, g.name, g.description, g.created_at || Date.now()]
        )
      }

      for (const gi of data.group_items || []) {
        await db.run(
          'INSERT INTO group_items (group_id, zekr_id, position, target) VALUES (?, ?, ?, ?);',
          [gi.group_id, gi.zekr_id, gi.position, gi.target]
        )
      }

      return { ok: true, count: data.adhkar?.length || 0 }
    })
  }

  // Fallback
  localStorage.setItem('zekr_adhkar', JSON.stringify(data.adhkar || []))
  localStorage.setItem('zekr_counts', JSON.stringify(data.counts || {}))
  localStorage.setItem('zekr_targets', JSON.stringify(data.targets || {}))
  localStorage.setItem('zekr_clicks', JSON.stringify(data.clicks || []))
  localStorage.setItem('zekr_groups', JSON.stringify(data.groups || []))

  return { ok: true, count: data.adhkar?.length || 0 }
}
