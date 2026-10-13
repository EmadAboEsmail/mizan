const API_URL = 'http://localhost:8000'

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
export function getStats(period = 'day', zekr_id = null) {
  const params = new URLSearchParams({ period })
  if (zekr_id) params.set('zekr_id', zekr_id)
  return apiRequest(`/api/stats?${params.toString()}`)
}
export function getAdhkar() {
  return apiRequest('/api/adhkar')
}

export function getCounts() {
  return apiRequest('/api/counts')
}

export function getTargets() {
  return apiRequest('/api/targets')
}

export function addClick(zekr_id) {
  return apiRequest('/api/clicks', {
    method: 'POST',
    body: JSON.stringify({ zekr_id }),
  })
}

export function resetClick(zekr_id) {
  return apiRequest(`/api/clicks/${zekr_id}`, {
    method: 'DELETE',
  })
}

export function setTarget(zekr_id, target) {
  return apiRequest('/api/targets', {
    method: 'POST',
    body: JSON.stringify({ zekr_id, target }),
  })
}
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
