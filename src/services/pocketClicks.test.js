import { describe, it, expect, vi, beforeEach } from 'vitest'

const { queryMock, queryOneMock, runMock, transactionMock, flushMock } =
  vi.hoisted(() => ({
    queryMock: vi.fn(),
    queryOneMock: vi.fn(),
    runMock: vi.fn(),
    transactionMock: vi.fn(),
    flushMock: vi.fn(),
  }))

vi.mock('@/db/adapter.js', () => ({
  query: queryMock,
  queryOne: queryOneMock,
  run: runMock,
  transaction: transactionMock,
}))

vi.mock('./clickBuffer.js', () => ({
  bufferClick: vi.fn(),
  flush: flushMock,
  getPendingForZekr: vi.fn(() => 0),
  getPendingMap: vi.fn(() => new Map()),
  clearBuffer: vi.fn(),
  dropPendingForZekr: vi.fn(),
}))

import { applyPocketClicks } from './zekrService.js'

describe('applyPocketClicks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flushMock.mockResolvedValue(undefined)
    transactionMock.mockResolvedValue(undefined)
    queryMock.mockResolvedValue([{ id: 'zekr_1' }, { id: 'zekr_2' }])
  })

  it('يتجاوز التنفيذ عند عدم وجود ضغطات معلّقة', async () => {
    expect(await applyPocketClicks([])).toBe(0)
    expect(await applyPocketClicks(null)).toBe(0)
    expect(flushMock).not.toHaveBeenCalled()
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('يُدرج التسبيحات المجمّعة بالساعة ويحدّث الإجمالي في معاملة واحدة', async () => {
    const inserted = await applyPocketClicks([
      { zekrId: 'zekr_1', hour: 498000, count: 18 },
      { zekrId: 'zekr_1', hour: 498001, count: 15 },
      { zekrId: 'zekr_2', hour: 498001, count: 7 },
    ])

    expect(inserted).toBe(40)
    expect(flushMock).toHaveBeenCalledTimes(1)
    expect(transactionMock).toHaveBeenCalledTimes(1)

    const stmts = transactionMock.mock.calls[0][0]
    expect(stmts).toHaveLength(5) // 3 clicks_hourly + 2 counts
    expect(stmts[0].values).toEqual(['zekr_1', 498000, 18])
    expect(stmts[1].values).toEqual(['zekr_1', 498001, 15])
    expect(stmts[2].values).toEqual(['zekr_2', 498001, 7])
    expect(stmts[3].values).toEqual(['zekr_1', 33])
    expect(stmts[4].values).toEqual(['zekr_2', 7])
  })

  it('يتجاهل الأذكار المحذوفة والقيم غير الصالحة بأمان', async () => {
    const inserted = await applyPocketClicks([
      { zekrId: 'deleted_zekr', hour: 498000, count: 25 },
      { zekrId: 'zekr_1', hour: 0, count: 10 },
      { zekrId: 'zekr_1', hour: 498000, count: 0 },
      { zekrId: 'zekr_2', hour: 498002, count: 12 },
    ])

    expect(inserted).toBe(12)
    const stmts = transactionMock.mock.calls[0][0]
    expect(stmts).toHaveLength(2)
    expect(stmts[0].values).toEqual(['zekr_2', 498002, 12])
    expect(stmts[1].values).toEqual(['zekr_2', 12])
  })
})
