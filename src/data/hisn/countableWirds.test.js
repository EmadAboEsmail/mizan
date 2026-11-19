import { expect, it } from 'vitest'
import chapters from './chapters.json'
import { countableWirds } from './countableWirds.js'

it('keeps morning and evening as distinct installable subsets of the source', () => {
  const packs = Object.entries(countableWirds)
  const normalize = (text) => text.replace(/[\u064b-\u065f\u0670]/g, '').replace(/[إأآ]/g, 'ا')
  expect(new Set(packs.map(([, pack]) => pack.name)).size).toBe(2)
  for (const [title, pack] of packs) {
    const chapter = chapters.find((item) => item.title === title)
    expect(pack.items.length).toBeLessThan(chapter.entries.length)
    for (const item of pack.items) {
      expect(chapter.entries.some((row) => normalize(row.text).includes(normalize(item.text)) && row.sourceCount === item.target)).toBe(true)
      expect(item.virtue).toBeTruthy()
    }
  }
})
