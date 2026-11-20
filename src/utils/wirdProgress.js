const KEY = 'mizan_group_progress_v1'

function todayKey() {
  const date = new Date()
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-')
}

function readAll() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

export function readWirdProgress(groupId, items) {
  if (!groupId || !items.length) return null
  const entry = readAll()[String(groupId)]
  if (!entry || entry.date !== todayKey()) return null
  // Legacy entries used positions. New entries follow the item when reordered.
  const index = entry.itemId == null ? Number(entry.index)
    : items.findIndex((item) => String(item.id) === String(entry.itemId))
  const count = Number(entry.count)
  if (!Number.isSafeInteger(index) || index < 0 || index >= items.length ||
      !Number.isSafeInteger(count) || count < 0) return null
  return { index, count }
}

export function writeWirdProgress(groupId, items, index, count) {
  if (!groupId || !items[index]) return
  try {
    const all = readAll()
    if (index === 0 && count === 0) delete all[String(groupId)]
    else all[String(groupId)] = { itemId: items[index].id, index, count, date: todayKey() }
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* storage is optional */ }
}
