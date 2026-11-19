export const SCHEMA_VERSION = 5

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS adhkar (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    default_target INTEGER,
    virtue TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
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
  -- Clicks hourly — صف واحد لكل ساعة لكل ذكر
  -- ═══════════════════════════════════════
  CREATE TABLE IF NOT EXISTS clicks_hourly (
    zekr_id TEXT NOT NULL,
    hour INTEGER NOT NULL,
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
  -- Budget — Categories & Wallets
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

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    initial_balance REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    category_id TEXT,
    wallet_id TEXT,
    date TEXT NOT NULL,
    details TEXT,
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_txn_date
    ON transactions(date);

  CREATE INDEX IF NOT EXISTS idx_txn_category
    ON transactions(category_id);

  CREATE INDEX IF NOT EXISTS idx_txn_type
    ON transactions(type);

  CREATE TABLE IF NOT EXISTS wallet_transfers (
    id TEXT PRIMARY KEY,
    from_wallet_id TEXT NOT NULL,
    to_wallet_id TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (from_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (to_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transfer_date
    ON wallet_transfers(date);

  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    category_id TEXT,
    wallet_id TEXT,
    frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','yearly')),
    next_due_date TEXT NOT NULL,
    anchor_day INTEGER CHECK(anchor_day BETWEEN 1 AND 31),
    auto_apply INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    details TEXT,
    last_applied_date TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_recurring_due
    ON recurring_transactions(active, next_due_date);

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
