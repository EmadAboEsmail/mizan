// ✅ نفس نمط client.js — relative paths + env
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

// ===========================
// Categories
// ===========================
export function getCategories(type = null) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  const qs = params.toString()
  return apiRequest(`/api/budget/categories${qs ? `?${qs}` : ''}`)
}

export function createCategory(data) {
  return apiRequest('/api/budget/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCategory(id, data) {
  return apiRequest(`/api/budget/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCategory(id) {
  return apiRequest(`/api/budget/categories/${id}`, { method: 'DELETE' })
}

// ===========================
// Transactions
// ===========================
export function getTransactions(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, value)
    }
  })
  const qs = params.toString()
  return apiRequest(`/api/budget/transactions${qs ? `?${qs}` : ''}`)
}

export function createTransaction(data) {
  return apiRequest('/api/budget/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTransaction(id, data) {
  return apiRequest(`/api/budget/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteTransaction(id) {
  return apiRequest(`/api/budget/transactions/${id}`, { method: 'DELETE' })
}

// ===========================
// Summary & Trend
// ===========================
export function getSummary(month = null) {
  const qs = month ? `?month=${month}` : ''
  return apiRequest(`/api/budget/summary${qs}`)
}

export function getMonthlyTrend(months = 6, endMonth = null) {
  const params = new URLSearchParams({ months })
  if (endMonth) params.set('end_month', endMonth)
  return apiRequest(`/api/budget/monthly-trend?${params.toString()}`)
}

// ===========================
// Backup / Restore / Delete
// ===========================
export function getBudgetBackup() {
  return apiRequest('/api/budget/backup')
}

export function restoreBudgetBackup(data) {
  return apiRequest('/api/budget/restore', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteAllBudgetData(keepCategories = false) {
  return apiRequest(
    `/api/budget/data/all?keep_categories=${keepCategories}`,
    { method: 'DELETE' }
  )
}

// ===========================
// CSV Export / Import
// ===========================
export async function exportBudgetCsv() {
  const res = await fetch(`${API_URL}/api/budget/export-csv`)
  if (!res.ok) {
    throw new Error(`فشل التصدير: HTTP ${res.status}`)
  }
  return res.blob()
}

export async function importBudgetCsv(file, clearExisting = false) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(
    `${API_URL}/api/budget/import-csv?clear_existing=${clearExisting}`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}
// ===========================
// Monthly Limits (الميزانية الشهرية)
// ===========================
export function getLimits(month) {
  return apiRequest(`/api/budget/limits?month=${month}`)
}

export function createOrUpdateLimit(data) {
  // data: { category_id, month, amount }
  return apiRequest('/api/budget/limits', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateLimit(id, amount) {
  return apiRequest(`/api/budget/limits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  })
}

export function deleteLimit(id) {
  return apiRequest(`/api/budget/limits/${id}`, { method: 'DELETE' })
}
// ===========================
// Insights (إحصائيات متقدمة)
// ===========================
export function getInsights(month, compareMonth = null) {
  const params = new URLSearchParams({ month })
  if (compareMonth) params.set('compare_month', compareMonth)
  return apiRequest(`/api/budget/insights?${params.toString()}`)
}
