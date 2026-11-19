const KEY = 'mizan_last_wird_v1'
export function readLastWird() {
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}
export function saveLastWird(groupId) {
  try {
    if (groupId) localStorage.setItem(KEY, String(groupId))
    else localStorage.removeItem(KEY)
  } catch { /* storage is optional */ }
}
