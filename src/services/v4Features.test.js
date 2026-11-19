import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import initSqlJs from 'sql.js'
import { CREATE_TABLES } from '@/db/schema.js'
import { seedIfEmpty } from '@/db/seed.js'
import { ADHKAR_PRESET_PACKS } from '@/data/adhkarPresets.js'
import {
  getAdhkar,
  addHisnEntryToGroup,
  createGroup,
  getGroups,
  createAdhkar,
  reorderAdhkar,
  installPresetGroup,
  exportZekrStatsXlsx,
} from './zekrService.js'
import {
  getCategories,
  reorderCategories,
  getWalletsWithBalances,
  createWalletTransfer,
  createTransaction,
  createRecurringTransaction,
  applyRecurringNow,
  processDueRecurringTransactions,
  createOrUpdateLimit,
  copyPreviousMonthLimits,
  getLimits,
  exportBudgetCsv,
  exportBudgetXlsx,
} from './budgetService.js'
import {
  getUnifiedMizanBackup,
  restoreUnifiedMizanBackup,
  performUnifiedAutoBackup,
  restoreLatestAutoBackup,
  getLastAutoBackupMeta,
} from './mizanBackupService.js'
import { getCurrencySymbol, setCurrencyCode } from '@/hooks/useCurrency.js'
import {
  configureBudgetPin,
  verifyAndUnlockPin,
  lockBudgetNow,
  disableBudgetPin,
  isPinConfigured,
} from '@/hooks/useBudgetLock.js'

let sqlDb = null

vi.mock('@/db/adapter.js', () => ({
  initAdapter: async () => {},
  isReady: () => false,
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
      while (stmt.step()) rows.push(stmt.getAsObject())
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
  transaction: async (statements = []) => {
    sqlDb.run('BEGIN')
    try {
      for (const s of statements) {
        sqlDb.run(s.statement, s.values || [])
      }
      sqlDb.run('COMMIT')
    } catch (e) {
      sqlDb.run('ROLLBACK')
      throw e
    }
  },
}))

const memStore = new Map()
globalThis.localStorage = {
  getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k),
  clear: () => memStore.clear(),
}

describe('Mizan v4 upgrades end-to-end', () => {
  beforeEach(async () => {
    localStorage.clear()
    const SQL = await initSqlJs()
    sqlDb = new SQL.Database()
    sqlDb.run('PRAGMA foreign_keys = ON;')
    sqlDb.run(CREATE_TABLES)
    await seedIfEmpty()
  })

  afterEach(() => {
    sqlDb?.close()
    sqlDb = null
    disableBudgetPin()
  })

  it('adds a Hisn entry only to the selected group and rejects duplicates', async () => {
    const chosen = await createGroup('Chosen group')
    const other = await createGroup('Other group')
    const input = { groupId: chosen.id, text: 'نص تجريبي طويل من الحصن', reference: 'مرجع تجريبي', target: null }
    await addHisnEntryToGroup(input)
    await expect(addHisnEntryToGroup(input)).rejects.toThrow('موجود بالفعل')
    await expect(addHisnEntryToGroup({ ...input, target: -1 })).rejects.toThrow()
    const groups = await getGroups()
    expect(groups.find(({ id }) => id === chosen.id).items).toMatchObject([{ text: input.text, target: null }])
    expect(groups.find(({ id }) => id === other.id).items).toHaveLength(0)
  })

  it('seeds virtues, supports reordering adhkar & installing preset wird packs', async () => {
    const initial = await getAdhkar()
    expect(initial.length).toBeGreaterThanOrEqual(5)
    expect(initial[0].virtue).toBeTruthy()

    const custom = await createAdhkar('لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 33, 'كنز من كنوز الجنة')
    expect(custom.virtue).toBe('كنز من كنوز الجنة')

    // عكس الترتيب
    const reversed = [...(await getAdhkar())].reverse().map((z) => z.id)
    await reorderAdhkar(reversed)
    const afterReorder = await getAdhkar()
    expect(afterReorder[0].id).toBe(custom.id)

    // تثبيت ورد جاهز بضغطة واحدة ومنع التكرار
    const morningPack = ADHKAR_PRESET_PACKS.find((p) => p.id === 'preset_morning')
    const grp = await installPresetGroup(morningPack)
    expect(grp.name).toBe('أذكار الصباح')
    expect(grp.items.length).toBe(morningPack.items.length)
    expect(grp.items[0].virtue).toBeTruthy()
    await expect(installPresetGroup(morningPack)).rejects.toThrow()

    // تصدير إحصائيات الذكر كملف Excel صالح
    const xlsxBlob = exportZekrStatsXlsx(
      ['النوع', 'التسمية', 'العدد', 'الذكر'],
      [['ذكر', '', 33, 'سُبْحَانَ اللَّهِ']]
    )
    expect(xlsxBlob.size).toBeGreaterThan(500)
  })

  it('tracks wallet balances, transfers, recurring transactions, limit copy & scoped exports', async () => {
    // المحافظ الافتراضية
    const wallets = await getWalletsWithBalances()
    expect(wallets.map((w) => w.id)).toEqual([
      'wallet_cash',
      'wallet_bank',
      'wallet_ewallet',
    ])

    // راتب على البنك + مصروف من الكاش + تحويل ATM من البنك للكاش
    await createTransaction({
      amount: 10000,
      type: 'income',
      category_id: 'cat_salary',
      wallet_id: 'wallet_bank',
      date: '2026-10-01',
      details: 'راتب أكتوبر',
    })
    await createWalletTransfer({
      from_wallet_id: 'wallet_bank',
      to_wallet_id: 'wallet_cash',
      amount: 2000,
      date: '2026-10-02',
      note: 'سحب ATM',
    })
    await createTransaction({
      amount: 350,
      type: 'expense',
      category_id: 'cat_food',
      wallet_id: 'wallet_cash',
      date: '2026-11-05',
      details: 'غداء',
    })

    const updatedWallets = await getWalletsWithBalances()
    const bank = updatedWallets.find((w) => w.id === 'wallet_bank')
    const cash = updatedWallets.find((w) => w.id === 'wallet_cash')
    expect(bank.balance).toBe(8000)
    expect(cash.balance).toBe(1650)

    // إعادة ترتيب التصنيفات
    const expCats = await getCategories('expense')
    const reorderedIds = [expCats[1].id, expCats[0].id, ...expCats.slice(2).map((c) => c.id)]
    await reorderCategories(reorderedIds)
    const expAfter = await getCategories('expense')
    expect(expAfter[0].id).toBe(expCats[1].id)

    // معاملة متكررة مستحقة اليوم
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    await createRecurringTransaction({
      title: 'إيجار الشقة',
      amount: 3000,
      type: 'expense',
      category_id: 'cat_home',
      wallet_id: 'wallet_bank',
      frequency: 'monthly',
      next_due_date: today,
      auto_apply: true,
    })
    const dueRes = await processDueRecurringTransactions()
    expect(dueRes.applied).toBe(1)
    // تشغيل ثانٍ في نفس اليوم لا يكرر المعاملة
    expect((await processDueRecurringTransactions()).applied).toBe(0)

    // نسخ حدود الشهر السابق
    await createOrUpdateLimit({
      category_id: 'cat_food',
      month: '2026-10',
      amount: 2500,
    })
    const copied = await copyPreviousMonthLimits('2026-11')
    expect(copied).toEqual({ copied: 1, fromMonth: '2026-10' })
    const novLimits = await getLimits('2026-11')
    expect(novLimits.total_limit).toBe(2500)
    expect(novLimits.total_spent).toBe(350)

    // تغيير العملة وتصدير شهر محدد CSV/XLSX
    setCurrencyCode('SAR')
    expect(getCurrencySymbol()).toBe('ر.س')
    const csvBlob = await exportBudgetCsv('2026-10')
    const xlsxBlob = await exportBudgetXlsx('2026-10')
    expect(csvBlob.size).toBeGreaterThan(40)
    expect(xlsxBlob.size).toBeGreaterThan(500)
  })

  it('exports & restores unified Mizan backups and auto-backups', async () => {
    setCurrencyCode('AED')
    await createAdhkar('سُبْحَانَ اللَّهِ الْعَظِيمِ', 100, 'حبيبتان إلى الرحمن')
    await createTransaction({
      amount: 500,
      type: 'expense',
      category_id: 'cat_shopping',
      wallet_id: 'wallet_ewallet',
      date: '2026-11-10',
      details: 'مشتريات',
    })

    const full = await getUnifiedMizanBackup()
    expect(full.app).toBe('mizan')
    expect(full.zekr.adhkar.length).toBe(6)
    expect(full.budget.transactions.length).toBe(1)

    await performUnifiedAutoBackup()
    setCurrencyCode('USD')
    await restoreLatestAutoBackup()
    expect(getCurrencySymbol()).toBe('د.إ')

    const res = await restoreUnifiedMizanBackup(full)
    expect(res).toEqual({ ok: true, restoredZekr: true, restoredBudget: true })
  })

  it('rejects an incomplete backup without replacing either section', async () => {
    const original = await getUnifiedMizanBackup()
    await expect(restoreUnifiedMizanBackup({ ...original, budget: {} })).rejects.toThrow()
    const after = await getUnifiedMizanBackup()
    expect(after.budget.categories).toEqual(original.budget.categories)
    expect(after.zekr.adhkar).toEqual(original.zekr.adhkar)
  })

  it('rolls back changes to both sections if a SQL statement fails', async () => {
    const original = await getUnifiedMizanBackup()
    const corrupt = structuredClone(original)
    corrupt.zekr.adhkar[0].text = 'changed'
    corrupt.budget.categories.push(corrupt.budget.categories[0])
    await expect(restoreUnifiedMizanBackup(corrupt)).rejects.toThrow()
    const after = await getUnifiedMizanBackup()
    expect(after.budget.categories).toEqual(original.budget.categories)
    expect(after.zekr.adhkar).toEqual(original.zekr.adhkar)
  })

  it('does not mark a failed web backup as successful', async () => {
    const writer = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    try {
      await expect(performUnifiedAutoBackup()).rejects.toThrow('Quota exceeded')
      expect(getLastAutoBackupMeta()).toBeNull()
    } finally {
      writer.mockRestore()
    }
  })

  it.each([['2026', '28'], ['2028', '29']])('preserves day 31 through February %s', async (year, februaryDay) => {
    const recurring = await createRecurringTransaction({
      title: 'Monthly bill', amount: 100, type: 'expense', next_due_date: `${year}-01-31`,
    })
    expect((await applyRecurringNow(recurring.id)).next_due_date).toBe(`${year}-02-${februaryDay}`)
    expect((await applyRecurringNow(recurring.id)).next_due_date).toBe(`${year}-03-31`)
  })

  it('hashes, verifies, locks, and disables the 4-digit Budget PIN', async () => {
    expect(isPinConfigured()).toBe(false)
    await expect(configureBudgetPin('12')).rejects.toThrow()
    await configureBudgetPin('2580', true)
    expect(isPinConfigured()).toBe(true)

    lockBudgetNow()
    expect(await verifyAndUnlockPin('0000')).toBe(false)
    expect(await verifyAndUnlockPin('2580')).toBe(true)

    disableBudgetPin()
    expect(isPinConfigured()).toBe(false)
  })
})
