import { expect, it } from 'vitest'
import { describeBackup } from './backupPreview.js'

it('summarizes a unified backup without showing record contents', () => {
  const preview = describeBackup({ zekr: { adhkar: [{ text: 'private content' }], groups: [] }, budget: { transactions: [] } })
  expect(preview).toContain('الذكر')
  expect(preview).toContain('الميزانية')
  expect(preview).not.toContain('private content')
})
it('handles invalid JSON without throwing', () => {
  expect(describeBackup('{')).toContain('تعذّر')
})
