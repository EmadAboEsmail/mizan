import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCsvFilename,
  encodeExcelCsvBytes,
  encodeUtf8BomCsvBytes,
  decodeCsvBytes,
  parseCsvRecords,
  buildXlsxBlob,
} from './csv.js'

describe('getCsvFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to "stats" followed by today', () => {
    expect(getCsvFilename()).toBe('stats-2026-11-05.csv')
  })

  it('puts the base name first', () => {
    expect(getCsvFilename('budget')).toBe('budget-2026-11-05.csv')
  })

  it('inserts the suffix between the name and the date', () => {
    expect(getCsvFilename('stats', 'week')).toBe('stats-week-2026-11-05.csv')
  })

  it('ignores an empty suffix', () => {
    expect(getCsvFilename('stats', '')).toBe('stats-2026-11-05.csv')
  })

  it('uses the UTC date, not the local one', () => {
    vi.setSystemTime(new Date('2026-11-05T23:30:00Z'))
    expect(getCsvFilename()).toBe('stats-2026-11-05.csv')
  })
})

describe('Arabic Excel CSV encoding & round-trip decoding', () => {
  const headers = ['التاريخ', 'النوع', 'المبلغ', 'التصنيف', 'الأيقونة', 'التفاصيل', 'الوصف']
  const rows = [
    ['2026-11-17', 'مصروف', 185.5, 'طعام وشراب', '🍔', 'غداء العائلة', 'مطعم\nسطر ثانٍ مع "علامات"'],
    ['2026-11-16', 'دخل', 12000, 'راتب شهري', '💰', 'نوفمبر', 'سُبْحَانَ اللَّهِ'],
  ]

  it('encodes UTF-16LE with 0xFF 0xFE BOM, Tab delimiter, and CRLF', () => {
    const bytes = encodeExcelCsvBytes(headers, rows)
    expect(bytes[0]).toBe(0xff)
    expect(bytes[1]).toBe(0xfe)

    const decoded = decodeCsvBytes(bytes)
    expect(decoded.includes('\r\n')).toBe(true)

    const records = parseCsvRecords(decoded)
    expect(records).toHaveLength(3)
    expect(records[0]).toEqual(headers)
    expect(records[1][0]).toBe('2026-11-17')
    expect(records[1][1]).toBe('مصروف')
    expect(records[1][2]).toBe('185.5')
    expect(records[1][3]).toBe('طعام وشراب')
    expect(records[1][4]).toBe('🍔')
    expect(records[1][6]).toBe('مطعم\nسطر ثانٍ مع "علامات"')
    expect(records[2][6]).toBe('سُبْحَانَ اللَّهِ')
  })

  it('round-trips legacy UTF-8 BOM comma-delimited CSV and semicolon CSV', () => {
    const utf8Bytes = encodeUtf8BomCsvBytes(
      ['date', 'type', 'amount', 'category', 'details'],
      [['2026-11-10', 'expense', 75, 'مواصلات، أوبر', 'مشوار العمل']]
    )
    expect(utf8Bytes[0]).toBe(0xef)
    expect(utf8Bytes[1]).toBe(0xbb)
    expect(utf8Bytes[2]).toBe(0xbf)

    const parsed = parseCsvRecords(decodeCsvBytes(utf8Bytes))
    expect(parsed).toHaveLength(2)
    expect(parsed[1][3]).toBe('مواصلات، أوبر')

    const semi = 'التاريخ;النوع;المبلغ;التصنيف\r\n2026-11-11;مصروف;250;فواتير الكهرباء'
    const semiRecords = parseCsvRecords(semi)
    expect(semiRecords[1]).toEqual(['2026-11-11', 'مصروف', '250', 'فواتير الكهرباء'])
  })

  it('decodes Windows-1256 Arabic CSV files cleanly', () => {
    // "طعام" بترميز Windows-1256: 0xD8 (ط), 0xDA (ع), 0xC7 (أ/ا), 0xE3 (م)
    const win1256 = new Uint8Array([0xd8, 0xda, 0xc7, 0xe3])
    expect(decodeCsvBytes(win1256)).toBe('طعام')
  })

  it('builds a valid RTL OOXML .xlsx blob with Arabic headers and rows', async () => {
    const blob = buildXlsxBlob({
      sheetName: 'معاملات ميزان',
      headers,
      rows,
      colWidths: [14, 10, 14, 18, 10, 22, 26],
    })
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    const buf = new Uint8Array(await blob.arrayBuffer())
    // توقيع ملف ZIP صالح: PK\x03\x04
    expect(buf[0]).toBe(0x50)
    expect(buf[1]).toBe(0x4b)
    expect(buf[2]).toBe(0x03)
    expect(buf[3]).toBe(0x04)

    const asText = new TextDecoder('utf-8').decode(buf)
    expect(asText).toContain('rightToLeft="1"')
    expect(asText).toContain('طعام وشراب')
    expect(asText).toContain('معاملات ميزان')
  })
})
