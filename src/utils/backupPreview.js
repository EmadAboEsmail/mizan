export function describeBackup(input) {
  let data
  try { data = typeof input === 'string' ? JSON.parse(input) : input } catch { return 'تعذّر قراءة الملف. اختر نسخة JSON صالحة.' }
  const zekr = data?.zekr ?? (Array.isArray(data?.adhkar) ? data : null)
  const budget = data?.budget ?? (Array.isArray(data?.transactions) ? data : null)
  if (!zekr && !budget) return 'لم يتم التعرّف على أقسام النسخة. لن تُستعاد البيانات إلا إذا كانت النسخة صالحة.'
  const n = (rows) => Array.isArray(rows) ? rows.length.toLocaleString('ar-EG') : 'غير متاح'
  const date = new Date(data.exported_at ?? NaN)
  const stamp = Number.isNaN(date.getTime()) ? 'غير متاح' : date.toLocaleString('ar-EG')
  const scopes = [zekr && `الذكر (${n(zekr.adhkar)} ذكر، ${n(zekr.groups)} مجموعة)`, budget && `الميزانية (${n(budget.transactions)} معاملة)`].filter(Boolean)
  return `تاريخ النسخة: ${stamp}. سيتم استبدال بيانات: ${scopes.join('، ')}. خذ نسخة من بياناتك الحالية قبل المتابعة.`
}
