// ═══════════════════════════════════════════════════════════════
// src/queries/queryKeys.js — مصنع مفاتيح الاستعلامات (Query Key Factory)
// ═══════════════════════════════════════════════════════════════

export const budgetKeys = {
  all: ['budget'],

  categoriesAll: () => [...budgetKeys.all, 'categories'],
  categories: (type = null) => [
    ...budgetKeys.categoriesAll(),
    { type: type ?? 'all' },
  ],

  transactionsAll: () => [...budgetKeys.all, 'transactions'],
  transactions: (month = null) => [
    ...budgetKeys.transactionsAll(),
    { month: month ?? 'all' },
  ],

  summariesAll: () => [...budgetKeys.all, 'summary'],
  summary: (month = null) => [
    ...budgetKeys.summariesAll(),
    { month: month ?? 'all' },
  ],

  limitsAll: () => [...budgetKeys.all, 'limits'],
  limits: (month) => [...budgetKeys.limitsAll(), { month: month ?? 'none' }],

  insightsAll: () => [...budgetKeys.all, 'insights'],
  insights: (month, compareMonth = null) => [
    ...budgetKeys.insightsAll(),
    { month: month ?? 'none', compareMonth: compareMonth ?? 'prev' },
  ],

  trendsAll: () => [...budgetKeys.all, 'trend'],
  trend: (months = 6, endMonth = null) => [
    ...budgetKeys.trendsAll(),
    { months, endMonth: endMonth ?? 'current' },
  ],
}

export const zekrKeys = {
  all: ['zekr'],

  adhkar: () => [...zekrKeys.all, 'adhkar'],
  counts: () => [...zekrKeys.all, 'counts'],
  targets: () => [...zekrKeys.all, 'targets'],
  groups: () => [...zekrKeys.all, 'groups'],

  statsAll: () => [...zekrKeys.all, 'stats'],
  stats: (period = 'day', zekrId = null, compare = true) => [
    ...zekrKeys.statsAll(),
    { period, zekrId: zekrId ?? 'all', compare },
  ],

  streak: () => [...zekrKeys.all, 'streak'],
}
