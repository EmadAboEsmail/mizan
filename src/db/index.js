// ═══════════════════════════════════════════════════════════════
// src/db/index.js — Schema init + migrations
// ═══════════════════════════════════════════════════════════════
import { initAdapter, exec, queryOne, isReady } from './adapter.js'
import { CREATE_TABLES, SCHEMA_VERSION } from './schema.js'
import { seedIfEmpty } from './seed.js'

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
async function getCurrentVersion() {
  try {
    const row = await queryOne(
      "SELECT value FROM meta WHERE key = 'schema_version'"
    )
    return parseInt(row?.value, 10) || 0
  } catch {
    // meta table نفسها مش موجودة = fresh install
    return 0
  }
}

async function tableExists(name) {
  const row = await queryOne(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [name]
  )
  return !!row
}

async function setSchemaVersion(v) {
  await exec(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '${v}')`
  )
}

// ═══════════════════════════════════════════════════════════════
// Migration v1/v2 → v3: clicks (per-click) → clicks_hourly (aggregated)
// ═══════════════════════════════════════════════════════════════
async function migrateClicksToHourly() {
  // clicks_hourly already created by CREATE_TABLES — نتحقق فقط
  if (!(await tableExists('clicks'))) {
    console.log('[DB] No legacy "clicks" table — nothing to migrate')
    return
  }

  const oldRow = await queryOne('SELECT COUNT(*) as c FROM clicks')
  const oldCount = Number(oldRow?.c) || 0
  console.log(`[DB] Found ${oldCount} legacy clicks to compress`)

  if (oldCount > 0) {
    // نستخدم INSERT OR IGNORE عشان لو حصل retry ميضاعفش
    await exec(`
      INSERT OR IGNORE INTO clicks_hourly (zekr_id, hour, count)
      SELECT
        zekr_id,
        CAST(clicked_at / 3600000 AS INTEGER) AS hour,
        COUNT(*) AS count
      FROM clicks
      GROUP BY zekr_id, CAST(clicked_at / 3600000 AS INTEGER);
    `)

    const summary = await queryOne(
      'SELECT COUNT(*) as c, COALESCE(SUM(count),0) as total FROM clicks_hourly'
    )
    console.log(
      `[DB] ✅ Compressed → ${summary?.c || 0} rows (${summary?.total || 0} total clicks)`
    )
  }

  // أهم خطوة: نحذف الجدول القديم
  await exec('DROP TABLE clicks')
  console.log('[DB] ✅ Legacy "clicks" table dropped')
}

// ═══════════════════════════════════════════════════════════════
// Verify: تأكد إن كل الجداول المتوقعة موجودة
// ═══════════════════════════════════════════════════════════════
const EXPECTED_TABLES = [
  'adhkar',
  'counts',
  'targets',
  'clicks_hourly',
  'groups',
  'group_items',
  'categories',
  'transactions',
  'limits',
  'meta',
]

async function verifySchema() {
  const missing = []
  for (const t of EXPECTED_TABLES) {
    if (!(await tableExists(t))) missing.push(t)
  }
  if (missing.length > 0) {
    throw new Error(
      `[DB] Schema verification failed — missing tables: ${missing.join(', ')}`
    )
  }
  console.log('[DB] ✅ Schema verified')
}

// ═══════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════
export async function initDB() {
  if (isReady()) return

  console.log('[DB] Starting initialization...')
  await initAdapter()

  const currentVersion = await getCurrentVersion()
  console.log(
    `[DB] Current schema: v${currentVersion} → target: v${SCHEMA_VERSION}`
  )

  // ─────────────────────────────────────────────
  // Path A: up to date
  // ─────────────────────────────────────────────
  if (currentVersion >= SCHEMA_VERSION) {
    console.log('[DB] Schema up to date — running safety checks')
    await verifySchema()
    await setSchemaVersion(SCHEMA_VERSION)
    await seedIfEmpty()
    console.log('[DB] Ready ✅')
    return
  }

  // ─────────────────────────────────────────────
  // Path B: needs migration or fresh install
  // ─────────────────────────────────────────────
  try {
    // 1. دائمًا نضمن وجود كل الجداول (IF NOT EXISTS = آمن حتى لو موجودة)
    console.log('[DB] Ensuring base tables exist...')
    await exec(CREATE_TABLES)

    // 2. لو فيه clicks قديمة (v1 أو v2) → نحوّلها
    if (currentVersion > 0) {
      await migrateClicksToHourly()
    } else {
      console.log('[DB] Fresh install — no legacy data to migrate')
    }

    // 3. تحقق نهائي
    await verifySchema()

    // 4. سجّل الـ version الجديدة (بعد ما كل حاجة نجحت)
    await setSchemaVersion(SCHEMA_VERSION)
    console.log(`[DB] ✅ Migration complete → v${SCHEMA_VERSION}`)
  } catch (err) {
    console.error('[DB] ❌ Migration failed:', err)
    // مانسجلش schema_version لو فشلنا — عشان نحاول تاني في الإقلاع القادم
    throw err
  }

  // 5. Seed (بعد ما تأكدنا إن الـ schema سليمة)
  await seedIfEmpty()

  console.log('[DB] Ready ✅')
}

// ═══════════════════════════════════════════════════════════════
// Re-exports
// ═══════════════════════════════════════════════════════════════
export * from './adapter.js'
export { SCHEMA_VERSION } from './schema.js'
