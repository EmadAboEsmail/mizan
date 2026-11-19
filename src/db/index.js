// ═══════════════════════════════════════════════════════════════
// src/db/index.js — Schema init + migrations (v1..v5)
// ═══════════════════════════════════════════════════════════════
import { initAdapter, exec, query, queryOne, isReady } from './adapter.js'
import { CREATE_TABLES, SCHEMA_VERSION } from './schema.js'
import { seedIfEmpty } from './seed.js'

async function getCurrentVersion() {
  try {
    const row = await queryOne(
      "SELECT value FROM meta WHERE key = 'schema_version'"
    )
    return parseInt(row?.value, 10) || 0
  } catch {
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

async function columnExists(table, column) {
  const cols = await query(`PRAGMA table_info(${table})`)
  return cols.some((c) => c.name === column)
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

async function setSchemaVersion(v) {
  await exec(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '${v}')`
  )
}

// Migration v1/v2 → v3: clicks (per-click) → clicks_hourly (aggregated)
async function migrateClicksToHourly() {
  if (!(await tableExists('clicks'))) return

  const oldRow = await queryOne('SELECT COUNT(*) as c FROM clicks')
  const oldCount = Number(oldRow?.c) || 0

  if (oldCount > 0) {
    await exec(`
      INSERT OR IGNORE INTO clicks_hourly (zekr_id, hour, count)
      SELECT
        zekr_id,
        CAST(clicked_at / 3600000 AS INTEGER) AS hour,
        COUNT(*) AS count
      FROM clicks
      GROUP BY zekr_id, CAST(clicked_at / 3600000 AS INTEGER);
    `)
  }

  await exec('DROP TABLE clicks')
}

// Migration v3 → v4: adhkar.virtue/sort_order, transactions.wallet_id,
// wallets, wallet_transfers, recurring_transactions
async function migrateToV4() {
  await ensureColumn('adhkar', 'virtue', 'TEXT')
  await ensureColumn('adhkar', 'sort_order', 'INTEGER NOT NULL DEFAULT 0')
  await ensureColumn('transactions', 'wallet_id', 'TEXT')

  await exec(`
    CREATE INDEX IF NOT EXISTS idx_txn_wallet
      ON transactions(wallet_id);
  `)

  // تهيئة ترتيب الأذكار الحالية إن كانت كلها 0
  const adhkarRows = await query(
    'SELECT id, sort_order FROM adhkar ORDER BY created_at ASC, id ASC'
  )
  const needsOrder =
    adhkarRows.length > 1 &&
    adhkarRows.every((r) => !r.sort_order || Number(r.sort_order) === 0)
  if (needsOrder) {
    for (let i = 0; i < adhkarRows.length; i += 1) {
      await exec(
        `UPDATE adhkar SET sort_order = ${i + 1} WHERE id = '${String(
          adhkarRows[i].id
        ).replace(/'/g, "''")}'`
      )
    }
  }
}

const EXPECTED_TABLES = [
  'adhkar',
  'counts',
  'targets',
  'clicks_hourly',
  'groups',
  'group_items',
  'categories',
  'wallets',
  'transactions',
  'wallet_transfers',
  'recurring_transactions',
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
}

export async function initDB() {
  if (isReady()) return

  console.log('[DB] Starting initialization...')
  await initAdapter()

  const currentVersion = await getCurrentVersion()
  console.log(
    `[DB] Current schema: v${currentVersion} → target: v${SCHEMA_VERSION}`
  )

  if (currentVersion >= SCHEMA_VERSION) {
    await verifySchema()
    await setSchemaVersion(SCHEMA_VERSION)
    await seedIfEmpty()
    console.log('[DB] Ready ✅')
    return
  }

  try {
    await exec(CREATE_TABLES)

    if (currentVersion > 0 && currentVersion < 4) {
      await migrateClicksToHourly()
      await migrateToV4()
    } else {
      await exec(`
        CREATE INDEX IF NOT EXISTS idx_txn_wallet
          ON transactions(wallet_id);
      `)
    }

    await ensureColumn('recurring_transactions', 'anchor_day', 'INTEGER CHECK(anchor_day BETWEEN 1 AND 31)')
    await verifySchema()
    await setSchemaVersion(SCHEMA_VERSION)
    console.log(`[DB] ✅ Migration complete → v${SCHEMA_VERSION}`)
  } catch (err) {
    console.error('[DB] ❌ Migration failed:', err)
    throw err
  }

  await seedIfEmpty()
  console.log('[DB] Ready ✅')
}

export * from './adapter.js'
export { SCHEMA_VERSION } from './schema.js'
