import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import initSqlJs from 'sql.js'
import { createQueryClient } from '@/lib/queryClient.js'
import { budgetKeys, zekrKeys } from '@/queries/queryKeys.js'
import {
  categoriesQueryOptions,
  transactionsQueryOptions,
  summaryQueryOptions,
  limitsQueryOptions,
  insightsQueryOptions,
  monthlyTrendQueryOptions,
} from '@/queries/budget/useBudgetQueries.js'
import {
  adjustSummaryData,
  recomputeLimitTotals,
  notifyLimitTransition,
} from '@/queries/budget/useBudgetMutations.js'
import {
  dedupeById,
  adhkarQueryOptions,
  countsQueryOptions,
  targetsQueryOptions,
  groupsQueryOptions,
  zekrStatsQueryOptions,
  zekrStreakQueryOptions,
} from '@/queries/zekr/useZekrQueries.js'
import { CREATE_TABLES } from '@/db/schema.js'
import { seedIfEmpty } from '@/db/seed.js'
import { clearBuffer, flush } from '@/services/clickBuffer.js'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createOrUpdateLimit,
  updateLimit,
  deleteLimit,
  getBudgetBackup,
  restoreBudgetBackup,
  deleteAllBudgetData,
} from '@/services/budgetService.js'
import {
  addClick,
  resetClick,
  setTarget,
  createAdhkar,
  updateAdhkar,
  deleteAdhkar,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupItem,
  updateGroupItem,
  deleteGroupItem,
  deleteAllCounts,
  deleteAllTargets,
  deleteAllClicks,
  getBackup,
  restoreBackup,
} from '@/services/zekrService.js'

// ═══════════════════════════════════════════════════════════════
// In-memory sql.js SQLite adapter (مطابق لواجهة src/db/adapter.js)
// ═══════════════════════════════════════════════════════════════
let sqlDb = null

vi.mock('@/db/adapter.js', () => ({
  exec: async (sql) => {
    sqlDb.run(sql)
  },
  run: async (sql, params = []) => {
    sqlDb.run(sql, params)
  },
  query: async (sql, params = []) => {
    const stmt = sqlDb.prepare(sql)
    try {
      stmt.bind(params)
      const rows = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      return rows
    } finally {
      stmt.free()
    }
  },
  queryOne: async (sql, params = []) => {
    const stmt = sqlDb.prepare(sql)
    try {
      stmt.bind(params)
      return stmt.step() ? stmt.getAsObject() : null
    } finally {
      stmt.free()
    }
  },
  transaction: async (statements) => {
    sqlDb.run('BEGIN TRANSACTION')
    try {
      for (const s of statements) {
        sqlDb.run(s.statement, s.values || [])
      }
      sqlDb.run('COMMIT')
    } catch (err) {
      sqlDb.run('ROLLBACK')
      throw err
    }
  },
}))

const SQL = await initSqlJs()

describe('TanStack Query + SQLite Integration', () => {
  let qc

  beforeEach(async () => {
    sqlDb = new SQL.Database()
    sqlDb.run('PRAGMA foreign_keys = ON;')
    sqlDb.run(CREATE_TABLES)
    await seedIfEmpty()
    clearBuffer()
    qc = createQueryClient()
  })

  afterEach(() => {
    clearBuffer()
    qc.clear()
    sqlDb?.close()
    sqlDb = null
  })

  // ═══════════════════════════════════════
  // 1. QueryClient Offline-First Config
  // ═══════════════════════════════════════
  it('configures QueryClient for offline-first local SQLite', () => {
    const defaults = qc.getDefaultOptions()
    expect(defaults.queries.networkMode).toBe('always')
    expect(defaults.queries.staleTime).toBe(Infinity)
    expect(defaults.queries.refetchOnWindowFocus).toBe(false)
    expect(defaults.queries.refetchOnReconnect).toBe(false)
    expect(defaults.mutations.networkMode).toBe('always')
    expect(defaults.mutations.retry).toBe(false)
  })

  // ═══════════════════════════════════════
  // 2. Query Key Hierarchy
  // ═══════════════════════════════════════
  it('builds hierarchical query keys for surgical invalidation', () => {
    expect(budgetKeys.transactions(null)).toEqual([
      'budget',
      'transactions',
      { month: 'all' },
    ])
    expect(budgetKeys.transactions('2026-11').slice(0, 2)).toEqual(
      budgetKeys.transactionsAll()
    )
    expect(budgetKeys.insights('2026-11', '2025-11').slice(0, 2)).toEqual(
      budgetKeys.insightsAll()
    )
    expect(zekrKeys.stats('week', 'z1', true).slice(0, 2)).toEqual(
      zekrKeys.statsAll()
    )
    expect(
      dedupeById([{ id: '1', text: 'a' }, { id: '1', text: 'b' }, null, {}])
    ).toEqual([{ id: '1', text: 'a' }])
  })

  // ═══════════════════════════════════════
  // 3. Budget Queries & Mutations Flow
  // ═══════════════════════════════════════
  it('handles budget categories, transactions, summary, limits, insights & trends with cache invalidation', async () => {
    const month = '2026-11'

    // استعلام التصنيفات الافتراضية
    const cats = await qc.fetchQuery(categoriesQueryOptions())
    expect(cats.length).toBeGreaterThanOrEqual(8)

    // إضافة حد ميزانية للطعام (1000 ج.م)
    const limit = await createOrUpdateLimit({
      category_id: 'cat_food',
      month,
      amount: 1000,
    })
    expect(limit.status).toBe('safe')

    // إضافة معاملة دخل + معاملة مصروف (800 ج.م = warning 80%)
    await createTransaction({
      amount: 5000,
      type: 'income',
      category_id: 'cat_salary',
      date: '2026-11-01',
      details: 'راتب نوفمبر',
    })
    const foodTxn = await createTransaction({
      amount: 800,
      type: 'expense',
      category_id: 'cat_food',
      date: '2026-11-10',
      details: 'مشتريات البيت',
    })

    // جلب البيانات عبر QueryClient والتأكد من التخزين في الكاش
    const [txns, summary, limits, insights, trend] = await Promise.all([
      qc.fetchQuery(transactionsQueryOptions(month)),
      qc.fetchQuery(summaryQueryOptions(month)),
      qc.fetchQuery(limitsQueryOptions(month)),
      qc.fetchQuery(insightsQueryOptions(month)),
      qc.fetchQuery(monthlyTrendQueryOptions(6, month)),
    ])

    expect(txns).toHaveLength(2)
    expect(summary.total_income).toBe(5000)
    expect(summary.total_expense).toBe(800)
    expect(summary.net).toBe(4200)
    expect(limits.limits[0].status).toBe('warning')
    expect(limits.limits[0].percent).toBe(80)
    expect(insights.top_expense_category.category_id).toBe('cat_food')
    expect(trend).toHaveLength(6)
    expect(trend[5]).toEqual({
      month,
      income: 5000,
      expense: 800,
      net: 4200,
    })

    // تعديل المعاملة لتجاوز الحد (1200 ج.م = over) ثم invalidate
    await updateTransaction(foodTxn.id, { amount: 1200 })
    await qc.invalidateQueries({ queryKey: budgetKeys.summariesAll() })
    await qc.invalidateQueries({ queryKey: budgetKeys.limitsAll() })

    const updatedSummary = await qc.fetchQuery(summaryQueryOptions(month))
    const updatedLimits = await qc.fetchQuery(limitsQueryOptions(month))
    expect(updatedSummary.total_expense).toBe(1200)
    expect(updatedLimits.limits[0].status).toBe('over')

    // تعديل وحذف الحد + إضافة/تعديل/حذف تصنيف
    const editedLimit = await updateLimit(limit.id, 2000)
    expect(editedLimit.status).toBe('safe')
    await deleteLimit(limit.id)

    const newCat = await createCategory({
      name: 'تعليم',
      type: 'expense',
      icon: '📚',
      color: '#0ea5e9',
    })
    const renamedCat = await updateCategory(newCat.id, { name: 'دورات' })
    expect(renamedCat.name).toBe('دورات')
    await deleteCategory(newCat.id)

    // حذف معاملة + نسخ احتياطي واستعادة
    await deleteTransaction(foodTxn.id)
    const backup = await getBudgetBackup()
    expect(backup.transactions).toHaveLength(1)

    await deleteAllBudgetData(true)
    await qc.invalidateQueries({ queryKey: budgetKeys.all })
    expect(await qc.fetchQuery(transactionsQueryOptions(month))).toHaveLength(0)

    await restoreBudgetBackup(backup)
    await qc.invalidateQueries({ queryKey: budgetKeys.all })
    expect(await qc.fetchQuery(transactionsQueryOptions(month))).toHaveLength(1)
  })

  // ═══════════════════════════════════════
  // 4. Zekr Queries & Mutations Flow
  // ═══════════════════════════════════════
  it('handles zekr clicks, targets, adhkar, groups, stats, streak & backup with cache invalidation', async () => {
    const adhkar = await qc.fetchQuery(adhkarQueryOptions())
    expect(adhkar).toHaveLength(5)
    const firstId = adhkar[0].id

    // تسبيح متتابع (buffered) + التحقق من العدد والإحصائيات والسلسلة
    await addClick(firstId)
    await addClick(firstId)
    await addClick(firstId)

    await qc.invalidateQueries({ queryKey: zekrKeys.counts() })
    await qc.invalidateQueries({ queryKey: zekrKeys.statsAll() })
    await qc.invalidateQueries({ queryKey: zekrKeys.streak() })

    const counts = await qc.fetchQuery(countsQueryOptions())
    const stats = await qc.fetchQuery(zekrStatsQueryOptions('day', null, true))
    const streak = await qc.fetchQuery(zekrStreakQueryOptions())

    expect(counts[firstId]).toBe(3)
    expect(stats.total).toBe(3)
    expect(streak.current).toBe(1)

    // تعديل الهدف ثم تصفير العداد مع بقاء سجل الإحصائيات
    await setTarget(firstId, 77)
    await qc.invalidateQueries({ queryKey: zekrKeys.targets() })
    expect((await qc.fetchQuery(targetsQueryOptions()))[firstId]).toBe(77)

    await resetClick(firstId)
    await qc.invalidateQueries({ queryKey: zekrKeys.counts() })
    await qc.invalidateQueries({ queryKey: zekrKeys.statsAll() })
    expect((await qc.fetchQuery(countsQueryOptions()))[firstId]).toBe(0)
    expect((await qc.fetchQuery(zekrStatsQueryOptions('day', null, true))).total).toBe(3)

    // إضافة ذكر + مجموعة + عنصر مجموعة + تحديث نص الذكر وانعكاسه في المجموعة
    const customZekr = await createAdhkar('لا حول ولا قوة إلا بالله', 50)
    const group = await createGroup('أذكار الصباح', 'ورد يومي')
    await addGroupItem(group.id, customZekr.id, 33)
    await updateGroup(group.id, 'أذكار الصباح والمساء', 'ورد يومي')
    await updateAdhkar(customZekr.id, 'لا حول ولا قوة إلا بالله العلي العظيم', 100)

    await qc.invalidateQueries({ queryKey: zekrKeys.adhkar() })
    await qc.invalidateQueries({ queryKey: zekrKeys.groups() })

    const groups = await qc.fetchQuery(groupsQueryOptions())
    expect(groups).toHaveLength(1)
    expect(groups[0].items[0].text).toBe(
      'لا حول ولا قوة إلا بالله العلي العظيم'
    )

    // تعديل هدف العنصر ثم حذف الذكر والتحقق من CASCADE على المجموعة
    await updateGroupItem(group.id, groups[0].items[0].id, { target: 99 })
    await deleteAdhkar(customZekr.id)
    await qc.invalidateQueries({ queryKey: zekrKeys.groups() })
    expect((await qc.fetchQuery(groupsQueryOptions()))[0].items).toHaveLength(0)

    // إضافة وحذف عنصر وحذف مجموعة
    const withFirst = await addGroupItem(group.id, firstId, 10)
    await deleteGroupItem(group.id, withFirst.items[0].id)
    await deleteGroup(group.id)

    // النسخ الاحتياطي والتصفير والاستعادة
    await flush()
    const backup = await getBackup()
    expect(backup.adhkar).toHaveLength(5)

    await deleteAllCounts()
    await deleteAllTargets()
    await deleteAllClicks()
    await qc.invalidateQueries({ queryKey: zekrKeys.all })
    expect((await qc.fetchQuery(zekrStatsQueryOptions('day', null, true))).total).toBe(0)

    await restoreBackup(backup)
    await qc.invalidateQueries({ queryKey: zekrKeys.all })
    expect((await qc.fetchQuery(zekrStatsQueryOptions('day', null, true))).total).toBe(3)
  })

  // ═══════════════════════════════════════
  // 5. Optimistic Cache & Limit Alert Helpers
  // ═══════════════════════════════════════
  it('computes optimistic summary, limit totals, and budget alert notifications accurately', () => {
    const initial = {
      month: '2026-11',
      total_income: 5000,
      total_expense: 1000,
      net: 4000,
      transaction_count: 2,
      by_category: [],
    }

    const afterExpense = adjustSummaryData(initial, {
      expense: 250.5,
      count: 1,
    })
    expect(afterExpense).toMatchObject({
      total_income: 5000,
      total_expense: 1250.5,
      net: 3749.5,
      transaction_count: 3,
    })

    const recomputed = recomputeLimitTotals({
      month: '2026-11',
      limits: [
        { id: 'l1', category_id: 'cat_food', amount: 1000, spent: 750 },
        { id: 'l2', category_id: 'cat_home', amount: 500, spent: 150 },
      ],
    })
    expect(recomputed).toMatchObject({
      total_limit: 1500,
      total_spent: 900,
      total_remaining: 600,
      total_percent: 60,
    })

    const showToast = vi.fn()
    // safe -> warning
    notifyLimitTransition(
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'safe', percent: 50 }] },
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'warning', percent: 80 }] },
      'cat_food',
      'expense',
      showToast
    )
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast.mock.calls[0][0]).toContain('اقتربت')

    // warning -> over
    notifyLimitTransition(
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'warning', percent: 80 }] },
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'over', percent: 110 }] },
      'cat_food',
      'expense',
      showToast
    )
    expect(showToast).toHaveBeenCalledTimes(2)
    expect(showToast.mock.calls[1][0]).toContain('تجاوزت')

    // over -> over (بدون تكرار إشعار)
    notifyLimitTransition(
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'over', percent: 110 }] },
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'over', percent: 130 }] },
      'cat_food',
      'expense',
      showToast
    )
    expect(showToast).toHaveBeenCalledTimes(2)

    // income (لا يُطلق إشعار ميزانية)
    notifyLimitTransition(
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'safe', percent: 20 }] },
      { limits: [{ category_id: 'cat_food', category_name: 'طعام', status: 'over', percent: 120 }] },
      'cat_food',
      'income',
      showToast
    )
    expect(showToast).toHaveBeenCalledTimes(2)
  })
})
