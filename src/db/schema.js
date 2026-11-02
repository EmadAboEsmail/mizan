export const SCHEMA_VERSION = 3  // ← اترفعت من 2 لـ 3

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS adhkar (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    default_target INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS counts (
    zekr_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS targets (
    zekr_id TEXT PRIMARY KEY,
    target INTEGER,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  -- ═══════════════════════════════════════
  -- 🆕 Clicks hourly — صف واحد لكل ساعة بدل صف لكل click
  -- التوفير: ~99% (من ~30 bytes لكل click إلى ~30 bytes لكل ساعة)
  -- ═══════════════════════════════════════
  CREATE TABLE IF NOT EXISTS clicks_hourly (
    zekr_id TEXT NOT NULL,
    hour INTEGER NOT NULL,          -- Unix hour (Math.floor(timestamp / 3600000))
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (zekr_id, hour),
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_clicks_hourly_hour
    ON clicks_hourly(hour);

  CREATE INDEX IF NOT EXISTS idx_clicks_hourly_zekr_hour
    ON clicks_hourly(zekr_id, hour);

  -- ═══════════════════════════════════════
  -- Groups
  -- ═══════════════════════════════════════
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS group_items (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    zekr_id TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    target INTEGER,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_group_items_group
    ON group_items(group_id, position);

  -- ═══════════════════════════════════════
  -- Budget
  -- ═══════════════════════════════════════
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_categories_type
    ON categories(type);

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    category_id TEXT,
    date TEXT NOT NULL,
    details TEXT,
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_txn_date
    ON transactions(date);

  CREATE INDEX IF NOT EXISTS idx_txn_category
    ON transactions(category_id);

  CREATE INDEX IF NOT EXISTS idx_txn_type
    ON transactions(type);

  CREATE TABLE IF NOT EXISTS limits (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    month TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_limit_cat_month
    ON limits(category_id, month);

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`
