import { downloadOrShareBlob } from './fileExport.js'

// ═══════════════════════════════════════════════════════
// CSV Cell Escaping (RFC-4180)
// ═══════════════════════════════════════════════════════
function escapeCell(val, delimiter) {
  const s = String(val ?? '')
  if (
    s.includes(delimiter) ||
    s.includes('"') ||
    s.includes('\n') ||
    s.includes('\r')
  ) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * ترميز UTF-16LE مع علامة BOM (0xFF 0xFE) وفاصل Tab وأسطر CRLF:
 * الصيغة الوحيدة التي تفتحها جميع إصدارات Microsoft Excel (2007–365، أندرويد، Mac،
 * WPS Office، LibreOffice، وGoogle Sheets) بنص عربي سليم 100% وأعمدة مفصولة تلقائياً.
 */
export function encodeExcelCsvBytes(headers, rows) {
  const delim = '\t'
  const lines = [
    headers.map((h) => escapeCell(h, delim)).join(delim),
    ...rows.map((row) => row.map((v) => escapeCell(v, delim)).join(delim)),
  ]
  const content = lines.join('\r\n') + '\r\n'

  // 2 بايت لـ BOM (FF FE) + 2 بايت لكل وحدة UTF-16
  const out = new Uint8Array(2 + content.length * 2)
  out[0] = 0xff
  out[1] = 0xfe
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i)
    const offset = 2 + i * 2
    out[offset] = code & 0xff
    out[offset + 1] = (code >> 8) & 0xff
  }
  return out
}

/**
 * ترميز UTF-8 مع BOM صريح (0xEF 0xBB 0xBF) وأسطر CRLF.
 */
export function encodeUtf8BomCsvBytes(headers, rows) {
  const delim = ','
  const lines = [
    headers.map((h) => escapeCell(h, delim)).join(delim),
    ...rows.map((row) => row.map((v) => escapeCell(v, delim)).join(delim)),
  ]
  const body = new TextEncoder().encode(lines.join('\r\n') + '\r\n')
  const out = new Uint8Array(3 + body.length)
  out[0] = 0xef
  out[1] = 0xbb
  out[2] = 0xbf
  out.set(body, 3)
  return out
}

/**
 * فك ترميز ملف CSV مستورد بذكاء: يدعم UTF-16LE وUTF-16BE وUTF-8 وWindows-1256 العربي.
 */
export function decodeCsvBytes(buffer) {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer || 0)
  if (bytes.length === 0) return ''

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3))
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    try {
      return new TextDecoder('windows-1256').decode(bytes)
    } catch {
      return new TextDecoder('utf-8').decode(bytes)
    }
  }
}

/**
 * محلّل CSV متوافق مع RFC-4180 يكتشف الفاصل تلقائياً (Tab أو فاصلة أو فاصلة منقوطة)
 * ويدعم الحقول متعددة الأسطر داخل علامات الاقتباس.
 */
export function parseCsvRecords(rawText) {
  const text = String(rawText ?? '').replace(/^\uFEFF/, '')
  const firstNewline = text.search(/\r|\n/)
  const firstLine = firstNewline === -1 ? text : text.slice(0, firstNewline)

  const countOutsideQuotes = (line, ch) => {
    let count = 0
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQ = !inQ
      else if (!inQ && line[i] === ch) count++
    }
    return count
  }

  const tabs = countOutsideQuotes(firstLine, '\t')
  const commas = countOutsideQuotes(firstLine, ',')
  const semis = countOutsideQuotes(firstLine, ';')
  const delimiter =
    tabs > 0 && tabs >= commas && tabs >= semis
      ? '\t'
      : semis > commas
        ? ';'
        : ','

  const records = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c.trim() !== '')) {
        records.push(row)
      }
      row = []
    } else {
      field += ch
    }
  }

  row.push(field)
  if (row.some((c) => c.trim() !== '')) {
    records.push(row)
  }

  return records
}

// ═══════════════════════════════════════════════════════
// Pure Zero-Dependency OOXML Excel (.xlsx) Builder (RTL Arabic)
// ═══════════════════════════════════════════════════════
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    t[i] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function createStoredZip(entries) {
  const enc = new TextEncoder()
  const files = entries.map(({ name, content }) => {
    const nameBytes = enc.encode(name)
    const data =
      content instanceof Uint8Array ? content : enc.encode(String(content))
    return { nameBytes, data, crc: crc32(data), offset: 0 }
  })

  let offset = 0
  const localParts = []
  for (const f of files) {
    f.offset = offset
    const hdr = new Uint8Array(30 + f.nameBytes.length)
    const dv = new DataView(hdr.buffer)
    dv.setUint32(0, 0x04034b50, true)
    dv.setUint16(4, 20, true)
    dv.setUint16(6, 0x0800, true) // UTF-8 filename flag
    dv.setUint16(8, 0, true) // STORE
    dv.setUint16(10, 0, true)
    dv.setUint16(12, 0x5621, true)
    dv.setUint32(14, f.crc, true)
    dv.setUint32(18, f.data.length, true)
    dv.setUint32(22, f.data.length, true)
    dv.setUint16(26, f.nameBytes.length, true)
    dv.setUint16(28, 0, true)
    hdr.set(f.nameBytes, 30)
    localParts.push(hdr, f.data)
    offset += hdr.length + f.data.length
  }

  const centralStart = offset
  const centralParts = []
  for (const f of files) {
    const cd = new Uint8Array(46 + f.nameBytes.length)
    const dv = new DataView(cd.buffer)
    dv.setUint32(0, 0x02014b50, true)
    dv.setUint16(4, 20, true)
    dv.setUint16(6, 20, true)
    dv.setUint16(8, 0x0800, true)
    dv.setUint16(10, 0, true)
    dv.setUint16(12, 0, true)
    dv.setUint16(14, 0x5621, true)
    dv.setUint32(16, f.crc, true)
    dv.setUint32(20, f.data.length, true)
    dv.setUint32(24, f.data.length, true)
    dv.setUint16(28, f.nameBytes.length, true)
    dv.setUint16(30, 0, true)
    dv.setUint16(32, 0, true)
    dv.setUint16(34, 0, true)
    dv.setUint16(36, 0, true)
    dv.setUint32(38, 0, true)
    dv.setUint32(42, f.offset, true)
    cd.set(f.nameBytes, 46)
    centralParts.push(cd)
    offset += cd.length
  }

  const centralSize = offset - centralStart
  const eocd = new Uint8Array(22)
  const edv = new DataView(eocd.buffer)
  edv.setUint32(0, 0x06054b50, true)
  edv.setUint16(8, files.length, true)
  edv.setUint16(10, files.length, true)
  edv.setUint32(12, centralSize, true)
  edv.setUint32(16, centralStart, true)

  const total = offset + 22
  const zip = new Uint8Array(total)
  let pos = 0
  for (const p of [...localParts, ...centralParts, eocd]) {
    zip.set(p, pos)
    pos += p.length
  }
  return zip
}

function xmlEscape(str) {
  return String(str ?? '')
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x08\x0B\x0C\x0E-\x1F]/g,
      ''
    )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colRef(colIdx) {
  let n = colIdx + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/**
 * يبني ملف Excel حقيقي (.xlsx) باتجاه عربي RTL وتنسيق عناوين وأرقام نظيف بدون أي مكتبة خارجية.
 */
export function buildXlsxBlob({ sheetName = 'مِيزان', headers, rows }) {
  const safeSheet = xmlEscape(sheetName.slice(0, 31) || 'مِيزان')

  const colWidths = headers.map((h, ci) => {
    let maxLen = String(h ?? '').length + 4
    for (const r of rows) {
      const len = String(r[ci] ?? '').length + 3
      if (len > maxLen) maxLen = len
    }
    return Math.min(44, Math.max(12, maxLen))
  })

  const colsXml = `<cols>${colWidths
    .map(
      (w, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
    )
    .join('')}</cols>`

  const headerCells = headers
    .map(
      (h, ci) =>
        `<c r="${colRef(ci)}1" t="inlineStr" s="1"><is><t xml:space="preserve">${xmlEscape(
          h
        )}</t></is></c>`
    )
    .join('')

  const dataRowsXml = rows
    .map((row, ri) => {
      const rNum = ri + 2
      const cells = row
        .map((val, ci) => {
          const ref = `${colRef(ci)}${rNum}`
          if (typeof val === 'number' && Number.isFinite(val)) {
            return `<c r="${ref}" s="2"><v>${val}</v></c>`
          }
          return `<c r="${ref}" t="inlineStr" s="3"><is><t xml:space="preserve">${xmlEscape(
            val
          )}</t></is></c>`
        })
        .join('')
      return `<row r="${rNum}" ht="21" customHeight="1">${cells}</row>`
    })
    .join('')

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>
  ${colsXml}
  <sheetData>
    <row r="1" ht="25" customHeight="1">${headerCells}</row>
    ${dataRowsXml}
  </sheetData>
</worksheet>`

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
  <fonts count="2">
    <font><sz val="11"/><color rgb="FF1C1815"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2D6A4F"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <bottom style="thin"><color rgb="FFE6DCCD"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

  const zipBytes = createStoredZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${safeSheet}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', content: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml },
  ])

  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * يصدّر بيانات كملف CSV متوافق 100% مع Excel والعربية على الويب وأندرويد APK.
 */
export async function downloadCsv(filename, headers, rows) {
  const bytes = encodeExcelCsvBytes(headers, rows)
  const blob = new Blob([bytes], { type: 'text/csv;charset=utf-16le' })
  await downloadOrShareBlob(blob, filename, {
    mimeType: 'text/csv;charset=utf-16le',
    title: filename,
  })
}

/**
 * يولّد اسم ملف CSV بتاريخ اليوم (بتوقيت UTC).
 */
export function getCsvFilename(base = 'stats', suffix = '') {
  const date = new Date().toISOString().slice(0, 10)
  const parts = [base]
  if (suffix) parts.push(suffix)
  parts.push(date)
  return `${parts.join('-')}.csv`
}
