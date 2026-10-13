// ===========================
// API Client
// ===========================

const API_URL = 'http://localhost:8000';


// ===========================
// Core Request Helper
// ===========================
async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}


// ===========================
// Adhkar
// ===========================
export function getAdhkar() {
  return apiRequest('/api/adhkar');
}


// ===========================
// Counts
// ===========================
export function getCounts() {
  return apiRequest('/api/counts');
}


// ===========================
// Clicks
// ===========================
export function addClick(zekr_id) {
  return apiRequest('/api/clicks', {
    method: 'POST',
    body: JSON.stringify({ zekr_id }),
  });
}

export function resetClick(zekr_id) {
  return apiRequest(`/api/clicks/${zekr_id}`, {
    method: 'DELETE',
  });
}


// ===========================
// Targets
// ===========================
export function setTarget(zekr_id, target) {
  return apiRequest('/api/targets', {
    method: 'POST',
    body: JSON.stringify({ zekr_id, target }),
  });
}
export function getTargets() {
  return apiRequest('/api/targets');
}
