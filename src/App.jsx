import { lazy, Suspense, useSyncExternalStore } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAutoBackup } from '@/hooks/useAutoBackup'
import { usePocketQueueSync } from '@/hooks/usePocketTasbih.js'
import { useNativeSync } from '@/hooks/useNativeSync.js'

// ═══════════════════════════════════════
// Eager imports (يظهر فوراً)
// ═══════════════════════════════════════
import Home from './pages/home/Home.jsx'
import InstallPrompt from './components/pwa/InstallPrompt.jsx'
import PageSkeleton from './components/ui/PageSkeleton.jsx'

// ═══════════════════════════════════════
// Lazy imports (يتحمل عند الحاجة)
// ═══════════════════════════════════════
const ZekrLayout = lazy(() => import('./pages/zekr/Layout.jsx'))
const ZekrSabh = lazy(() => import('./pages/zekr/Sabh.jsx'))
const ZekrHisn = lazy(() => import('./pages/zekr/HisnLibrary.jsx'))
const ZekrStats = lazy(() => import('./pages/zekr/Stats.jsx'))
const ZekrSettings = lazy(() => import('./pages/zekr/Settings.jsx'))

const BudgetLayout = lazy(() => import('./pages/budget/Layout.jsx'))
const BudgetTransactions = lazy(() =>
  import('./pages/budget/Transactions.jsx')
)
const BudgetReports = lazy(() => import('./pages/budget/Reports.jsx'))
const BudgetSettings = lazy(() => import('./pages/budget/Settings.jsx'))

// ═══════════════════════════════════════
// Auto-backup localStorage subscription
// ═══════════════════════════════════════
function subscribeAutoBackup(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener('mizan:auto-backup-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('mizan:auto-backup-change', callback)
  }
}

const getAutoBackupEnabled = () =>
  localStorage.getItem('auto_backup_enabled') === 'true'
const getAutoBackupFrequency = () =>
  localStorage.getItem('auto_backup_frequency') || 'daily'

// ═══════════════════════════════════════
// App
// ═══════════════════════════════════════
function App() {
  const autoBackupEnabled = useSyncExternalStore(
    subscribeAutoBackup,
    getAutoBackupEnabled
  )
  const autoBackupFrequency = useSyncExternalStore(
    subscribeAutoBackup,
    getAutoBackupFrequency
  )
  useAutoBackup(autoBackupEnabled, autoBackupFrequency)
  usePocketQueueSync()
  useNativeSync()

  return (
    <>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Zekr */}
          <Route path="/zekr" element={<ZekrLayout />}>
            <Route index element={<Navigate to="/zekr/sabh" replace />} />
            <Route path="sabh" element={<ZekrSabh />} />
            <Route path="hisn" element={<ZekrHisn />} />
            <Route path="stats" element={<ZekrStats />} />
            <Route path="settings" element={<ZekrSettings />} />
            <Route path="*" element={<Navigate to="/zekr/sabh" replace />} />
          </Route>

          {/* Budget */}
          <Route path="/budget" element={<BudgetLayout />}>
            <Route
              index
              element={<Navigate to="/budget/transactions" replace />}
            />
            <Route path="transactions" element={<BudgetTransactions />} />
            <Route path="reports" element={<BudgetReports />} />
            <Route path="settings" element={<BudgetSettings />} />
            <Route
              path="*"
              element={<Navigate to="/budget/transactions" replace />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <InstallPrompt />
    </>
  )
}

export default App
