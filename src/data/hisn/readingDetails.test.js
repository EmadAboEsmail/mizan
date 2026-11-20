import { expect, it } from 'vitest'
import chapters from './chapters.json'
import { countableWirds } from './countableWirds'
import { getReadingDetails } from './readingDetails'

it('prefills only selected counts and does not promote unspecified source counts', () => {
  for (const title of Object.keys(countableWirds)) {
    const { entries } = chapters.find((chapter) => chapter.title === title)
    const details = entries.map((entry) => getReadingDetails(title, entry)).filter(Boolean)
    expect(details.map(({ target }) => target).filter(Boolean).sort()).toEqual(countableWirds[title].items.map(({ target }) => target).sort())
    expect(details.some(({ target }) => target === null)).toBe(true)
  }
  expect(getReadingDetails(chapters[0].title, chapters[0].entries[0])).toBeNull()
})
