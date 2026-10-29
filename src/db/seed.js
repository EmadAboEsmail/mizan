import { query, transaction } from './adapter.js'

function genId(prefix) {
  const rand = Math.random().toString(16).substring(2, 14).padEnd(12, '0')
  return `${prefix}_${rand}`
}

const DEFAULT_ADHKAR = [
  { text: 'سُبْحَانَ اللَّهِ', default_target: 33 },
  { text: 'الْحَمْدُ لِلَّهِ', default_target: 33 },
  { text: 'اللَّهُ أَكْبَرُ', default_target: 33 },
  { text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', default_target: 100 },
  { text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', default_target: 100 },
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

export async function seedIfEmpty() {
  const existingAdhkar = await query('SELECT COUNT(*) as c FROM adhkar')
  const count = existingAdhkar[0]?.c || 0

  if (count > 0) {
    console.log('[Seed] Already seeded, skipping')
    return
  }

  console.log('[Seed] Seeding default data...')

  const statements = []

  // Adhkar + counts (IDs نصية)
  for (const z of DEFAULT_ADHKAR) {
    const id = genId('zekr')
    statements.push({
      statement: `INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?)`,
      values: [id, z.text, z.default_target],
    })
    statements.push({
      statement: `INSERT INTO counts (zekr_id, count) VALUES (?, 0)`,
      values: [id],
    })
  }

  // Categories
  for (const c of DEFAULT_CATEGORIES) {
    statements.push({
      statement: `INSERT INTO categories (id, name, type, icon, color, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?)`,
      values: [c.id, c.name, c.type, c.icon, c.color, c.sort_order],
    })
  }

  // Seed marker
  statements.push({
    statement: `INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded_at', ?)`,
    values: [new Date().toISOString()],
  })

  await transaction(statements)
  console.log('[Seed] Done!')
}
