export function validateBackupSection(data, required, optional) {
  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
  if (!isRecord(data)) throw new Error('قسم النسخة الاحتياطية غير صالح')
  for (const key of [...required, ...optional]) {
    if (!Object.hasOwn(data, key) && !required.includes(key)) continue
    if (!Array.isArray(data[key]) || !data[key].every(isRecord)) {
      throw new Error(`بيانات النسخة الاحتياطية غير صالحة: ${key}`)
    }
  }
}
