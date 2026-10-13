import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db', 'zekr.db');

const db = new Database(dbPath);

// تحسينات
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// إنشاء الجداول
db.exec(`
  CREATE TABLE IF NOT EXISTS adhkar (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    default_target INTEGER
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zekr_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id)
  );

  CREATE TABLE IF NOT EXISTS targets (
    zekr_id TEXT PRIMARY KEY,
    target INTEGER NOT NULL,
    FOREIGN KEY (zekr_id) REFERENCES adhkar(id)
  );

  CREATE INDEX IF NOT EXISTS idx_clicks_zekr ON clicks(zekr_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);

  CREATE TABLE IF NOT EXISTS counts (
  zekr_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (zekr_id) REFERENCES adhkar(id)
);
`);

export default db;
