import { initAdapter, exec, isReady } from './adapter.js'
import { CREATE_TABLES, SCHEMA_VERSION } from './schema.js'
import { seedIfEmpty } from './seed.js'

export async function initDB() {
  if (isReady()) return

  console.log('[DB] Starting initialization...')

  await initAdapter()
  await exec(CREATE_TABLES)

  await exec(`
    INSERT OR REPLACE INTO meta (key, value)
    VALUES ('schema_version', '${SCHEMA_VERSION}')
  `)

  await seedIfEmpty()

  console.log('[DB] Ready!')
}

export * from './adapter.js'
export { SCHEMA_VERSION } from './schema.js'
