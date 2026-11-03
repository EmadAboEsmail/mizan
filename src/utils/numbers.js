// تحويل الأرقام العربية (٠-٩) والفارسية (۰-۹) والفاصلة العربية إلى أرقام إنجليزية
// حتى يعمل الإدخال أيًا كان لوحة المفاتيح المستخدمة.
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const EXTENDED_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹'

export function normalizeDigits(value) {
  return String(value ?? '')
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXTENDED_ARABIC_INDIC.indexOf(d)))
    .replace(/[٫,]/g, '.')
    .replace(/٬/g, '')
}

export function parseNumber(value) {
  const s = normalizeDigits(value).trim()
  if (s === '') return NaN
  return Number(s)
}
