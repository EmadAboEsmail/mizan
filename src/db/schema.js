export const SCHEMA_VERSION = 1

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS adhkar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    default_target INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS counts (
    zekr_id INTEGER PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS targets (
    zekr_id INTEGER PRIMARY KEY,
    target INTEGER,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zekr_id INTEGER NOT NULL,
    clicked_at INTEGER NOT NULL,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_clicks_zekr_date
    ON clicks(zekr_id, clicked_at);

  CREATE INDEX IF NOT EXISTS idx_clicks_date
    ON clicks(clicked_at);

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS group_items (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    zekr_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    target INTEGER,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_group_items_group
    ON group_items(group_id, position);

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
