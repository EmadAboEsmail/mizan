import { query, transaction } from './adapter.js'

function genId(prefix) {
  const rand = Math.random().toString(16).substring(2, 14).padEnd(12, '0')
  return `${prefix}_${rand}`
}

const DEFAULT_ADHKAR = [
  {
    text: 'سُبْحَانَ اللَّهِ',
    default_target: 33,
    virtue: 'تُكتَب له ألفُ حسنة أو تُحَطّ عنه ألفُ خطيئة في مائة تسبيحة',
  },
  {
    text: 'الْحَمْدُ لِلَّهِ',
    default_target: 33,
    virtue: 'الْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ',
  },
  {
    text: 'اللَّهُ أَكْبَرُ',
    default_target: 33,
    virtue: 'أحبّ الكلام إلى الله: سبحان الله والحمد لله ولا إله إلا الله والله أكبر',
  },
  {
    text: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    default_target: 100,
    virtue: 'أفضلُ الذِّكر لا إله إلا الله',
  },
  {
    text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    default_target: 100,
    virtue: 'كان النبي ﷺ يستغفر الله ويتوب إليه في اليوم أكثر من سبعين مرة',
  },
]

const DEFAULT_CATEGORIES = [
  // Expenses
  { id: 'cat_food', name: 'طعام', type: 'expense', icon: '🍔', color: '#ef4444', sort_order: 1 },
  { id: 'cat_transport', name: 'مواصلات', type: 'expense', icon: '🚗', color: '#0ea5e9', sort_order: 2 },
  { id: 'cat_home', name: 'منزل', type: 'expense', icon: '🏠', color: '#f59e0b', sort_order: 3 },
  { id: 'cat_health', name: 'صحة', type: 'expense', icon: '💊', color: '#ec4899', sort_order: 4 },
  { id: 'cat_shopping', name: 'تسوق', type: 'expense', icon: '🛍️', color: '#8b5cf6', sort_order: 5 },
  { id: 'cat_other', name: 'أخرى', type: 'expense', icon: '📦', color: '#64748b', sort_order: 99 },
  // Income
  { id: 'cat_salary', name: 'راتب', type: 'income', icon: '💼', color: '#059669', sort_order: 1 },
  { id: 'cat_gift', name: 'هدية', type: 'income', icon: '🎁', color: '#10b981', sort_order: 2 },
]

export const DEFAULT_WALLETS = [
  { id: 'wallet_cash', name: 'كاش', icon: '💵', color: '#2D6A4F', sort_order: 1 },
  { id: 'wallet_bank', name: 'حساب بنكي', icon: '🏦', color: '#B57B2A', sort_order: 2 },
  { id: 'wallet_ewallet', name: 'محفظة إلكترونية', icon: '📱', color: '#0284C7', sort_order: 3 },
]

export async function seedDefaultWalletsIfEmpty() {
  const existing = await query('SELECT COUNT(*) as c FROM wallets')
  if ((existing[0]?.c || 0) > 0) return
  const stmts = DEFAULT_WALLETS.map((w) => ({
    statement: `INSERT OR IGNORE INTO wallets (id, name, icon, color, initial_balance, sort_order)
                VALUES (?, ?, ?, ?, 0, ?)`,
    values: [w.id, w.name, w.icon, w.color, w.sort_order],
  }))
  await transaction(stmts)
}

export async function seedIfEmpty() {
  const existingAdhkar = await query('SELECT COUNT(*) as c FROM adhkar')
  const count = existingAdhkar[0]?.c || 0

  if (count > 0) {
    await seedDefaultWalletsIfEmpty()
    return
  }

  console.log('[Seed] Database is empty. Seeding default data...')

  const statements = []

  // Adhkar + counts
  DEFAULT_ADHKAR.forEach((z, idx) => {
    const id = genId('zekr')
    statements.push({
      statement: `INSERT INTO adhkar (id, text, default_target, virtue, sort_order)
                  VALUES (?, ?, ?, ?, ?)`,
      values: [id, z.text, z.default_target, z.virtue || null, idx + 1],
    })
    statements.push({
      statement: `INSERT INTO counts (zekr_id, count) VALUES (?, 0)`,
      values: [id],
    })
  })

  // Categories
  for (const c of DEFAULT_CATEGORIES) {
    statements.push({
      statement: `INSERT INTO categories (id, name, type, icon, color, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?)`,
      values: [c.id, c.name, c.type, c.icon, c.color, c.sort_order],
    })
  }

  // Wallets
  for (const w of DEFAULT_WALLETS) {
    statements.push({
      statement: `INSERT OR IGNORE INTO wallets (id, name, icon, color, initial_balance, sort_order)
                  VALUES (?, ?, ?, ?, 0, ?)`,
      values: [w.id, w.name, w.icon, w.color, w.sort_order],
    })
  }

  statements.push({
    statement: `INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded_at', ?)`,
    values: [new Date().toISOString()],
  })

  await transaction(statements)
  console.log('[Seed] Done!')
}
