import { initAdapter, exec, queryOne, isReady, } from './adapter.js'
import { CREATE_TABLES, SCHEMA_VERSION } from './schema.js'
import { seedIfEmpty } from './seed.js'

/**
 * تهيئة DB كاملة: فتح + schema + migrations + seed
 */
export async function initDB() {
  if (isReady()) return

  console.log('[DB] Starting initialization...')

  // 1. فتح الاتصال
  await initAdapter()

  // 2. فحص schema version الحالية
  let currentVersion = 0
  try {
    const row = await queryOne(`SELECT value FROM meta WHERE key = 'schema_version'`)
    currentVersion = parseInt(row?.value, 10) || 0
  } catch (e) {
    // الجدول مش موجود — DB جديدة
    currentVersion = 0
  }

  console.log(`[DB] Current schema version: ${currentVersion}, target: ${SCHEMA_VERSION}`)

  // 3. لو النسخة القديمة (1) → نحذف ونعيد الإنشاء
  if (currentVersion > 0 && currentVersion < SCHEMA_VERSION) {
    console.log(`[DB] ⚠️ Migration needed: ${currentVersion} → ${SCHEMA_VERSION}`)
    console.log('[DB] Dropping old tables...')

    await exec(`
      DROP TABLE IF EXISTS group_items;
      DROP TABLE IF EXISTS groups;
      DROP TABLE IF EXISTS clicks;
      DROP TABLE IF EXISTS counts;
      DROP TABLE IF EXISTS targets;
      DROP TABLE IF EXISTS adhkar;
      DROP TABLE IF EXISTS limits;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS meta;
    `)

    console.log('[DB] Old tables dropped ✅')
  }

  // 4. إنشاء الجداول (IF NOT EXISTS - آمن)
  await exec(CREATE_TABLES)

  // 5. حفظ schema version
  await exec(`
    INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}')
  `)

  // 6. البيانات الأولية
  await seedIfEmpty()

  console.log('[DB] Ready!')
}

export * from './adapter.js'
export { SCHEMA_VERSION } from './schema.js'
