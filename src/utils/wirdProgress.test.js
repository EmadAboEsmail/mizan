import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { readWirdProgress, writeWirdProgress } from './wirdProgress'

const key = 'mizan_group_progress_v1'
const items = [{ id: 'first' }, { id: 'second' }]
let store
beforeEach(() => {
  store = new Map()
  vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) })
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 19, 12))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('restores the count on the same item after reordering', () => {
  writeWirdProgress('group', items, 1, 4)
  expect(readWirdProgress('group', [...items].reverse())).toEqual({ index: 0, count: 4 })
  expect(readWirdProgress('other', items)).toBeNull()
})

it('does not apply a deleted item’s count to a different item', () => {
  writeWirdProgress('group', items, 1, 4)
  expect(readWirdProgress('group', [items[0], { id: 'new' }])).toBeNull()
})

it('reads existing positional progress and starts fresh on a new local day', () => {
  store.set(key, JSON.stringify({ group: { date: '2026-11-19', index: 1, count: 2 } }))
  expect(readWirdProgress('group', items)).toEqual({ index: 1, count: 2 })
  vi.setSystemTime(new Date(2026, 10, 20, 0, 1))
  expect(readWirdProgress('group', items)).toBeNull()
})

it('clears a restarted group without clearing other groups and recovers malformed storage', () => {
  store.set(key, 'bad json')
  writeWirdProgress('group', items, 1, 2)
  writeWirdProgress('other', items, 0, 3)
  writeWirdProgress('group', items, 0, 0)
  expect(readWirdProgress('group', items)).toBeNull()
  expect(readWirdProgress('other', items)).toEqual({ index: 0, count: 3 })
})
