const API_URL =
  localStorage.getItem('api-url') ||
  import.meta.env.VITE_API_URL ||
  ''

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

export { API_URL }

// ===========================
// Adhkar
// ===========================
export function getAdhkar() {
  return apiRequest('/api/adhkar')
}

export function createAdhkar(text, default_target = null) {
  return apiRequest('/api/adhkar', {
    method: 'POST',
    body: JSON.stringify({ text, default_target }),
  })
}

export function updateAdhkar(id, text, default_target = null) {
  return apiRequest(`/api/adhkar/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ text, default_target }),
  })
}

export function deleteAdhkar(id) {
  return apiRequest(`/api/adhkar/${id}`, { method: 'DELETE' })
}

// ===========================
// Counts & Clicks
// ===========================
export function getCounts() {
  return apiRequest('/api/counts')
}

export function addClick(zekr_id) {
  return apiRequest('/api/clicks', {
    method: 'POST',
    body: JSON.stringify({ zekr_id }),
  })
}

export function resetClick(zekr_id) {
  return apiRequest(`/api/clicks/${zekr_id}`, { method: 'DELETE' })
}

// ===========================
// Targets
// ===========================
export function getTargets() {
  return apiRequest('/api/targets')
}

export function setTarget(zekr_id, target) {
  return apiRequest('/api/targets', {
    method: 'POST',
    body: JSON.stringify({ zekr_id, target }),
  })
}

// ===========================
// Delete All
// ===========================
export function deleteAllCounts() {
  return apiRequest('/api/counts', { method: 'DELETE' })
}

export function deleteAllTargets() {
  return apiRequest('/api/targets', { method: 'DELETE' })
}

export function deleteAllClicks() {
  return apiRequest('/api/clicks', { method: 'DELETE' })
}

export function deleteAllData() {
  return apiRequest('/api/data/all', { method: 'DELETE' })
}

// ===========================
// Groups
// ===========================
export function getGroups() {
  return apiRequest('/api/groups')
}

export function getGroup(id) {
  return apiRequest(`/api/groups/${id}`)
}

export function createGroup(name, description = null) {
  return apiRequest('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export function updateGroup(id, name, description = null) {
  return apiRequest(`/api/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
  })
}

export function deleteGroup(id) {
  return apiRequest(`/api/groups/${id}`, { method: 'DELETE' })
}

export function addGroupItem(groupId, zekr_id, target = null) {
  return apiRequest(`/api/groups/${groupId}/items`, {
    method: 'POST',
    body: JSON.stringify({ zekr_id, target }),
  })
}

export function updateGroupItem(groupId, itemId, updates) {
  return apiRequest(`/api/groups/${groupId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export function deleteGroupItem(groupId, itemId) {
  return apiRequest(`/api/groups/${groupId}/items/${itemId}`, {
    method: 'DELETE',
  })
}

// ===========================
// Stats
// ===========================
export function getStats(period = 'day', zekr_id = null, compare = false) {
  const params = new URLSearchParams({ period })
  if (zekr_id) params.set('zekr_id', zekr_id)
  if (compare) params.set('compare', 'true')
  return apiRequest(`/api/stats?${params.toString()}`)
}

export function getStreak() {
  return apiRequest('/api/stats/streak')
}

// ===========================
// Backup
// ===========================
export function getBackup() {
  return apiRequest('/api/backup')
}

export function restoreBackup(data) {
  return apiRequest('/api/backup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
