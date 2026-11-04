import { initAdapter, exec, query, queryOne, isReady } from './adapter.js'
import { CREATE_TABLES, SCHEMA_VERSION } from './schema.js'
import { seedIfEmpty } from './seed.js'

export async function initDB() {
  if (isReady()) return

  console.log('[DB] Starting initialization...')

  await initAdapter()

  let currentVersion
  try {
    const row = await queryOne("SELECT value FROM meta WHERE key = 'schema_version'")
    currentVersion = parseInt(row?.value, 10) || 0
  } catch {
    currentVersion = 0
  }

  console.log(`[DB] Current schema version: ${currentVersion}, target: ${SCHEMA_VERSION}`)

  // ═══════════════════════════════════════
  // Migrations — من 2 لـ 3 (Compression)
  // ═══════════════════════════════════════
  if (currentVersion === 2 && SCHEMA_VERSION === 3) {
    console.log('[DB] 🔄 Migrating v2 → v3: compressing clicks...')

    try {
      // 1. إنشاء الجدول الجديد
      await exec(`
        CREATE TABLE IF NOT EXISTS clicks_hourly (
          zekr_id TEXT NOT NULL,
          hour INTEGER NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (zekr_id, hour)
        );
        CREATE INDEX IF NOT EXISTS idx_clicks_hourly_hour ON clicks_hourly(hour);
        CREATE INDEX IF NOT EXISTS idx_clicks_hourly_zekr_hour ON clicks_hourly(zekr_id, hour);
      `)

      // 2. تحويل الـ clicks القديمة
      const oldCount = await query('SELECT COUNT(*) as c FROM clicks')
      console.log(`[DB] Found ${oldCount[0]?.c || 0} old clicks to compress`)

      if (Number(oldCount[0]?.c) > 0) {
        await exec(`
          INSERT INTO clicks_hourly (zekr_id, hour, count)
          SELECT 
            zekr_id,
            CAST(clicked_at / 3600000 AS INTEGER) as hour,
            COUNT(*) as count
          FROM clicks
          GROUP BY zekr_id, CAST(clicked_at / 3600000 AS INTEGER)
        `)

        const newCount = await query('SELECT COUNT(*) as c, SUM(count) as total FROM clicks_hourly')
        console.log(`[DB] ✅ Compressed to ${newCount[0]?.c || 0} rows (${newCount[0]?.total || 0} total clicks)`)

        // 3. مسح الجدول القديم
        await exec('DROP TABLE clicks')
        console.log('[DB] ✅ Old clicks table dropped')
      }

      console.log('[DB] ✅ Migration complete')
    } catch (err) {
      console.error('[DB] ❌ Migration failed:', err)
      throw err
    }
  }

  // ═══════════════════════════════════════
  // Fresh install (currentVersion === 0)
  // ═══════════════════════════════════════
  if (currentVersion === 0) {
    console.log('[DB] Fresh install — creating tables...')
    await exec(CREATE_TABLES)
  }

  // تحديث schema version
  await exec(`INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}')`)

  await seedIfEmpty()

  console.log('[DB] Ready!')
}

export * from './adapter.js'
export { SCHEMA_VERSION } from './schema.js'
