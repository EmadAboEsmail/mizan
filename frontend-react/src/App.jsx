import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// ═══════════════════════════════════════
// Eager imports (يظهر فوراً)
// ═══════════════════════════════════════
import Home from './pages/home/Home.jsx'
import InstallPrompt from './components/pwa/InstallPrompt.jsx'

// ═══════════════════════════════════════
// Lazy imports (يتحمل عند الحاجة)
// ═══════════════════════════════════════
const ZekrLayout = lazy(() => import('./pages/zekr/ZekrLayout.jsx'))
const ZekrSabh = lazy(() => import('./pages/zekr/ZekrSabh.jsx'))
const ZekrStats = lazy(() => import('./pages/zekr/ZekrStats.jsx'))
const ZekrSettings = lazy(() => import('./pages/zekr/ZekrSettings.jsx'))

const BudgetLayout = lazy(() => import('./pages/budget/BudgetLayout.jsx'))
const BudgetTransactions = lazy(() =>
  import('./pages/budget/BudgetTransactions.jsx')
)
const BudgetReports = lazy(() => import('./pages/budget/BudgetReports.jsx'))
const BudgetSettings = lazy(() => import('./pages/budget/BudgetSettings.jsx'))

// ═══════════════════════════════════════
// Loading Fallback
// ═══════════════════════════════════════
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border-default)',
          borderTopColor: 'var(--budget)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
        جاري التحميل...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════
// App
// ═══════════════════════════════════════
function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Zekr */}
          <Route path="/zekr" element={<ZekrLayout />}>
            <Route index element={<Navigate to="/zekr/sabh" replace />} />
            <Route path="sabh" element={<ZekrSabh />} />
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
