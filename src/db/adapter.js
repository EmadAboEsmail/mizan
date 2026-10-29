import { Capacitor } from '@capacitor/core'
import {
  CapacitorSQLite,
  SQLiteConnection,
} from '@capacitor-community/sqlite'

let sqlite = null
let db = null
let isInitialized = false

const DB_NAME = 'mizan'
const DB_VERSION = 1

async function ensureJeepSqliteElement() {
  if (Capacitor.getPlatform() !== 'web') return

  let attempts = 0
  while (attempts < 30) {
    const el = document.querySelector('jeep-sqlite')
    if (el && el.isConnected) {
      console.log('[DB] jeep-sqlite element is connected ✅')
      return
    }
    await new Promise((r) => setTimeout(r, 100))
    attempts++
  }
  throw new Error('jeep-sqlite element not connected after 3s')
}

export async function initAdapter() {
  if (isInitialized && db) return db

  const platform = Capacitor.getPlatform()
  console.log(`[DB] Initializing on ${platform}...`)

  // 1. تأكد إن عنصر jeep-sqlite موجود (للويب)
  await ensureJeepSqliteElement()

  // 2. للويب: اضبط مسار wasm BEFORE creating SQLiteConnection
  if (platform === 'web') {
    window.sqliteWasmPath = "/assets"
    console.log('[DB] Set window.sqliteWasmPath:', window.sqliteWasmPath)
  }

  // 3. أنشئ الاتصال (بعد كل الإعدادات)
  sqlite = new SQLiteConnection(CapacitorSQLite)

  // 4. للويب: initWebStore BEFORE isConnection/createConnection
  if (platform === 'web') {
    console.log('[DB] Initializing WebStore...')
    try {
      await Promise.race([
        sqlite.initWebStore(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('initWebStore timeout (15s)')), 15000)
        ),
      ])
      console.log('[DB] WebStore initialized ✅')
    } catch (err) {
      console.error('[DB] initWebStore FAILED:', err)
      throw err
    }
  }

  // 5. تحقق من اتصال موجود أو أنشئ واحد
  let existing = false
  try {
    const isConnResult = await sqlite.isConnection(DB_NAME, false)
    existing = isConnResult.result
  } catch (e) {
    existing = false
  }

  if (existing) {
    console.log('[DB] Retrieving existing connection...')
    db = await sqlite.retrieveConnection(DB_NAME, false)
  } else {
    console.log('[DB] Creating new connection...')
    db = await sqlite.createConnection(
      DB_NAME,
      false,
      'no-encryption',
      DB_VERSION,
      false
    )
  }

  await db.open()
  isInitialized = true
  console.log('[DB] Opened successfully ✅')

  return db
}

export async function persistDB() {
  if (Capacitor.getPlatform() === 'web' && sqlite) {
    try {
      await sqlite.saveToStore(DB_NAME)
    } catch (e) {
      console.warn('[DB] saveToStore failed:', e)
    }
  }
}

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

export function getDB() {
  if (!db) throw new Error('DB not initialized — call initAdapter() first')
  return db
}

export function isReady() {
  return isInitialized
}
