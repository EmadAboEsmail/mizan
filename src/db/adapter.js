// ═══════════════════════════════════════════════════════════════
// src/db/adapter.js — Dual-mode (native primary, web via dynamic import)
// ═══════════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core'
import {
  CapacitorSQLite,
  SQLiteConnection,
} from '@capacitor-community/sqlite'

let sqlite = null
let db = null
let isInitialized = false

const DB_NAME = 'mizan'
const DB_VERSION = 1 // ← داخلي للـ plugin، ميتغيرش أبدًا

// ═══════════════════════════════════════════════════════════════
// Web bootstrap — lazy, ميتحملش على native
// ═══════════════════════════════════════════════════════════════
async function initWebPlatform() {
  console.log('[DB] Web platform — loading jeep-sqlite...')

  // ✅ dynamic import: Vite يعمل chunk منفصل، مش يتضمنه في الـ native bundle
  const { defineCustomElements } = await import(
    'jeep-sqlite-current-sqljs/loader'
  )
  defineCustomElements(window)

  await customElements.whenDefined('jeep-sqlite')

  // أنشئ العنصر لو مش موجود
  let el = document.querySelector('jeep-sqlite')
  if (!el) {
    el = document.createElement('jeep-sqlite')
    el.setAttribute('autoSave', 'true')
    el.setAttribute('wasmPath', '/assets')
    document.body.appendChild(el)
    console.log('[DB] jeep-sqlite element created')
  }

  // انتظر الاتصال
  let attempts = 0
  while (attempts < 30) {
    if (document.querySelector('jeep-sqlite')?.isConnected) {
      console.log('[DB] jeep-sqlite connected ✅')
      break
    }
    await new Promise((r) => setTimeout(r, 100))
    attempts++
  }

  window.sqliteWasmPath = '/assets'
}

// ═══════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════
export async function initAdapter() {
  if (isInitialized && db) return db

  const platform = Capacitor.getPlatform()
  const isWeb = platform === 'web'
  console.log(`[DB] Initializing on ${platform}...`)

  // 1. تهيئة منصة الويب
  if (isWeb) {
    await initWebPlatform()
  }

  // 2. إنشاء SQLiteConnection
  sqlite = new SQLiteConnection(CapacitorSQLite)

  // 3. للويب: initWebStore
  if (isWeb) {
    console.log('[DB] initWebStore...')
    try {
      await Promise.race([
        sqlite.initWebStore(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('initWebStore timeout')), 15000)
        ),
      ])
      console.log('[DB] WebStore ready ✅')
    } catch (err) {
      console.error('[DB] initWebStore failed:', err)
      throw err
    }
  }

  // 4. native: فحص الاتساق (لو التطبيق اتقتل فجأة)
  if (!isWeb) {
    try {
      const consistency = await sqlite.checkConnectionsConsistency()
      if (!consistency.result) {
        console.warn('[DB] Inconsistent connections — closing all')
        await sqlite.closeAllConnections()
      }
    } catch (err) {
      console.warn('[DB] Consistency check unavailable:', err?.message)
    }
  }

  // 5. فيه اتصال موجود؟
  let existing = false
  try {
    const res = await sqlite.isConnection(DB_NAME, false)
    existing = !!res.result
  } catch (err) {
    console.warn('[DB] isConnection failed:', err?.message)
    existing = false
  }

  // 6. retrieve أو create
  if (existing) {
    console.log('[DB] Retrieving existing connection...')
    db = await sqlite.retrieveConnection(DB_NAME, false)
    try {
      const opened = await db.isDBOpen()
      if (!opened.result) {
        console.log('[DB] Connection closed — opening...')
        await db.open()
      }
    } catch {
      console.log('[DB] Assuming retrieved connection is open')
    }
  } else {
    console.log('[DB] Creating new connection...')
    db = await sqlite.createConnection(
      DB_NAME,
      false,
      'no-encryption',
      DB_VERSION,
      false
    )
    await db.open()
    console.log('[DB] New connection opened ✅')
  }

  isInitialized = true
  console.log('[DB] Adapter ready ✅')
  return db
}

// ═══════════════════════════════════════════════════════════════
// Persist — web only (native SQLite بيحفظ تلقائيًا)
// ═══════════════════════════════════════════════════════════════
export async function persistDB() {
  if (Capacitor.getPlatform() !== 'web' || !sqlite) return
  try {
    await sqlite.saveToStore(DB_NAME)
  } catch (e) {
    console.warn('[DB] saveToStore failed:', e?.message)
  }
}

// ═══════════════════════════════════════════════════════════════
// Exec / Run / Query / QueryOne / Transaction
// ═══════════════════════════════════════════════════════════════
export async function exec(sql) {
  if (!db) throw new Error('DB not initialized')
  const result = await db.execute(sql)
  await persistDB()
  return result
}

export async function run(sql, params = []) {
  if (!db) throw new Error('DB not initialized')
  const result = await db.run(sql, params)
  await persistDB()
  return result
}

export async function query(sql, params = []) {
  if (!db) throw new Error('DB not initialized')
  const result = await db.query(sql, params)
  return result.values || []
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] || null
}

export async function transaction(statements) {
  if (!db) throw new Error('DB not initialized')
  const result = await db.executeSet(statements, true)
  await persistDB()
  return result
}

// ═══════════════════════════════════════════════════════════════
// Accessors
// ═══════════════════════════════════════════════════════════════
export function getDB() {
  if (!db) throw new Error('DB not initialized — call initAdapter() first')
  return db
}

export function isReady() {
  return isInitialized
}

// ═══════════════════════════════════════════════════════════════
// Backup / Path / Close
// ═══════════════════════════════════════════════════════════════
export async function exportDatabaseToJson(mode = 'full') {
  if (!db) throw new Error('DB not initialized')
  const res = await db.exportToJson(mode)
  return res.export
}

export async function getDatabasePath() {
  if (!db) throw new Error('DB not initialized')
  try {
    const res = await db.getPath()
    return res.path
  } catch {
    return null
  }
}

export async function closeAdapter() {
  if (!db || !sqlite) return
  try {
    await sqlite.closeConnection(DB_NAME, false)
  } catch (e) {
    console.warn('[DB] closeConnection failed:', e?.message)
  }
  db = null
  sqlite = null
  isInitialized = false
  console.log('[DB] Closed')
}
