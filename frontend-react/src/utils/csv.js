/**
 * يصدّر بيانات كـ CSV مع دعم كامل للعربية (UTF-8 BOM).
 *
 * @param {string} filename - اسم الملف (مثلاً "stats.csv")
 * @param {string[]} headers - أسماء الأعمدة
 * @param {Array<Array<any>>} rows - الصفوف
 */
export function downloadCsv(filename, headers, rows) {
  const escape = (val) => {
    const s = String(val ?? '')
    // لازم نحط اقتباسات لو فيه فاصلة أو اقتباس أو سطر جديد
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const headerLine = headers.map(escape).join(',')
  const rowLines = rows.map((row) => row.map(escape).join(','))
  // \uFEFF = BOM عشان Excel يقرأ UTF-8 صح
  const csv = '\uFEFF' + [headerLine, ...rowLines].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
