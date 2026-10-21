# الملف الحالة
1 src/api/budgetClient.js 🆕
2 src/context/BudgetContext.jsx 🆕
3 src/pages/BudgetLayout.jsx 🆕
4 src/pages/BudgetLayout.module.scss 🆕
5 src/pages/BudgetTransactions.jsx 🆕 (stub)
6 src/pages/BudgetTransactions.module.scss 🆕
7 src/pages/BudgetReports.jsx 🆕 (stub)
8 src/pages/BudgetSettings.jsx 🆕 (stub)
9 src/App.jsx 🔄 تعديل
10 src/pages/Home.jsx 🔄 تعديل
11 src/main.jsx 🔄 تعديل

---

1️⃣ src/api/budgetClient.js

```jsx
```

---

2️⃣ src/context/BudgetContext.jsx

```jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import {
  getCategories,
  getTransactions,
  getSummary,
  createTransaction as apiCreateTxn,
  updateTransaction as apiUpdateTxn,
  deleteTransaction as apiDeleteTxn,
  createCategory as apiCreateCat,
  updateCategory as apiUpdateCat,
  deleteCategory as apiDeleteCat,
} from '@/api/budgetClient.js'
import { useToast } from './ToastContext'

const BudgetContext = createContext(null)

// helper: الشهر الحالي بصيغة YYYY-MM
function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function BudgetProvider({ children }) {
  const { showToast } = useToast()

  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ===========================
  // تحميل البيانات
  // ===========================
  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error('فشل تحميل التصنيفات:', err)
      throw err
    }
  }, [])

  const loadMonthData = useCallback(async (month) => {
    try {
      const [txns, summ] = await Promise.all([
        getTransactions({ month, limit: 500 }),
        getSummary(month),
      ])
      setTransactions(txns)
      setSummary(summ)
    } catch (err) {
      console.error('فشل تحميل بيانات الشهر:', err)
      throw err
    }
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await loadCategories()
      await loadMonthData(currentMonth)
    } catch (err) {
      setError(err.message || 'فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, loadCategories, loadMonthData])

  useEffect(() => {
    reload()
  }, [reload])

  // لما الشهر يتغير، نعيد تحميل البيانات
  useEffect(() => {
    if (!loading) {
      loadMonthData(currentMonth).catch((err) => {
        console.error(err)
        showToast('فشل تحميل بيانات الشهر')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

  // ===========================
  // CRUD — Transactions
  // ===========================
  const createTransaction = async (data) => {
    try {
      const newTxn = await apiCreateTxn(data)
      await loadMonthData(currentMonth)
      showToast('تمت إضافة المعاملة')
      return newTxn
    } catch (err) {
      showToast(err.message || 'فشل إضافة المعاملة')
      throw err
    }
  }

  const updateTransaction = async (id, data) => {
    try {
      const updated = await apiUpdateTxn(id, data)
      await loadMonthData(currentMonth)
      showToast('تم تحديث المعاملة')
      return updated
    } catch (err) {
      showToast(err.message || 'فشل تحديث المعاملة')
      throw err
    }
  }

  const deleteTransaction = async (id) => {
    try {
      await apiDeleteTxn(id)
      await loadMonthData(currentMonth)
      showToast('تم حذف المعاملة')
    } catch (err) {
      showToast(err.message || 'فشل حذف المعاملة')
      throw err
    }
  }

  // ===========================
  // CRUD — Categories
  // ===========================
  const createCategory = async (data) => {
    try {
      const newCat = await apiCreateCat(data)
      await loadCategories()
      showToast('تمت إضافة التصنيف')
      return newCat
    } catch (err) {
      showToast(err.message || 'فشل إضافة التصنيف')
      throw err
    }
  }

  const updateCategory = async (id, data) => {
    try {
      const updated = await apiUpdateCat(id, data)
      await loadCategories()
      await loadMonthData(currentMonth)
      showToast('تم تحديث التصنيف')
      return updated
    } catch (err) {
      showToast(err.message || 'فشل تحديث التصنيف')
      throw err
    }
  }

  const deleteCategory = async (id) => {
    try {
      await apiDeleteCat(id)
      await loadCategories()
      showToast('تم حذف التصنيف')
    } catch (err) {
      showToast(err.message || 'فشل حذف التصنيف')
      throw err
    }
  }

  // ===========================
  // Value
  // ===========================
  const value = {
    // Data
    categories,
    transactions,
    summary,
    currentMonth,
    loading,
    error,
    // Setters
    setCurrentMonth,
    // Reload
    reload,
    // Transactions CRUD
    createTransaction,
    updateTransaction,
    deleteTransaction,
    // Categories CRUD
    createCategory,
    updateCategory,
    deleteCategory,
  }

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  )
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be inside BudgetProvider')
  return ctx
}
```

---

3️⃣ src/pages/BudgetLayout.jsx

```jsx
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useBudget } from '@/context/BudgetContext'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import styles from './BudgetLayout.module.scss'

const TABS = [
  { id: 'transactions', label: 'المعاملات', icon: '💳' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]
const VALID_TABS = TABS.map((t) => t.id)

function BudgetLayout() {
  const { loading, error, reload } = useBudget()
  const location = useLocation()
  const navigate = useNavigate()

  const segment = location.pathname.split('/').filter(Boolean).pop()
  const activeTab = VALID_TABS.includes(segment) ? segment : 'transactions'

  if (loading && !error) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>جاري تحميل الميزانية...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>تعذر الاتصال بالخادم</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={reload}>
            إعادة المحاولة ↺
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.budget}>
      <header className={styles.navHeader}>
        <Link to="/" className={styles.backBtn} title="الرجوع للرئيسية">
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </header>

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>💰 الميزانية</h1>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => navigate(`/budget/${tab.id}`)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default BudgetLayout
```

---

4️⃣ src/pages/BudgetLayout.module.scss

```scss
@use '@/styles/variables' as *;

.budget {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 1rem 3rem;
  background-color: #f8fafc;
  color: #0f172a;
  transition: background-color 0.3s ease, color 0.3s ease;

  :global(body.dark) & {
    background-color: #090d16;
    color: #f8fafc;
  }
}

.navHeader {
  width: 100%;
  max-width: 720px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.backBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;

  :global(body.dark) & {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    color: #94a3b8;
  }

  &:hover {
    color: #059669;
    border-color: rgba(5, 150, 105, 0.3);
  }
}

.headerActions {
  display: flex;
  align-items: center;
}

.container {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pageTitle {
  margin: 0 0 1.25rem;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: #0f172a;

  :global(body.dark) & {
    color: #f8fafc;
  }
}

.tabs {
  width: 100%;
  display: flex;
  gap: 0.4rem;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 1.5rem;

  :global(body.dark) & {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 0.5rem;
  font-size: 0.88rem;
  font-weight: 700;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;

  :global(body.dark) & {
    color: #94a3b8;
  }

  &:hover:not(.active) {
    color: #0f172a;
    :global(body.dark) & {
      color: #f8fafc;
    }
  }

  &.active {
    background: #ffffff;
    color: #059669;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

    :global(body.dark) & {
      background: #1e293b;
      color: #34d399;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
    }
  }

  &:active {
    transform: scale(0.97);
  }
}

.tabIcon {
  font-size: 0.9rem;
}

.tabLabel {
  white-space: nowrap;
}

.content {
  width: 100%;
  animation: fadeIn 0.3s ease;
}

// Loading
.loadingScreen {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3.5px solid rgba(5, 150, 105, 0.15);
  border-top-color: #059669;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loadingText {
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

// Error
.errorScreen {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.errorCard {
  max-width: 420px;
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;

  :global(body.dark) & {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.errorIcon {
  font-size: 2.5rem;
}

.errorTitle {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ef4444;
}

.errorMessage {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
}

.retryBtn {
  margin-top: 0.5rem;
  padding: 0.6rem 1.4rem;
  border-radius: 10px;
  background: #059669;
  color: #fff;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #047857;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

5️⃣ src/pages/BudgetTransactions.jsx (stub مبدئي)

```jsx
import { useBudget } from '@/context/BudgetContext'
import styles from './BudgetTransactions.module.scss'

function BudgetTransactions() {
  const { transactions, summary, currentMonth, setCurrentMonth } = useBudget()

  return (
    <div className={styles.container}>
      {/* شهر + ملخص */}
      <div className={styles.monthBar}>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className={styles.monthInput}
        />
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>الدخل</span>
            <span className={styles.summaryValue}>
              {summary.total_income.toLocaleString('en')}
            </span>
          </div>
          <div className={`${styles.summaryCard} ${styles.danger}`}>
            <span className={styles.summaryLabel}>المصروف</span>
            <span className={styles.summaryValue}>
              {summary.total_expense.toLocaleString('en')}
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>الصافي</span>
            <span className={styles.summaryValue}>
              {summary.net.toLocaleString('en')}
            </span>
          </div>
        </div>
      )}

      {/* قائمة مبدئية */}
      <div className={styles.list}>
        {transactions.length === 0 ? (
          <div className={styles.empty}>
            <p>لا توجد معاملات في هذا الشهر</p>
          </div>
        ) : (
          transactions.slice(0, 10).map((txn) => (
            <div key={txn.id} className={styles.item}>
              <div>
                <strong>{txn.category_icon} {txn.category_name}</strong>
                <p className={styles.desc}>{txn.description || txn.details}</p>
              </div>
              <span className={styles.amount}>
                {txn.type === 'expense' ? '-' : '+'}
                {txn.amount.toLocaleString('en')}
              </span>
            </div>
          ))
        )}
      </div>

      <p className={styles.note}>
        ({transactions.length} معاملة — عرض أول 10)
      </p>
    </div>
  )
}

export default BudgetTransactions
```

---

6️⃣ src/pages/BudgetTransactions.module.scss

```scss
@use '@/styles/variables' as *;

.container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.monthBar {
  display: flex;
  justify-content: center;
}

.monthInput {
  padding: 0.65rem 1.1rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  font-family: inherit;

  :global(body.dark) & {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.08);
    color: #f8fafc;
  }

  &:focus {
    outline: 2px solid #059669;
    outline-offset: 2px;
  }
}

.summaryCards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.summaryCard {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  :global(body.dark) & {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.07);
  }
}

.danger {
  border-color: rgba(239, 68, 68, 0.2);
}

.summaryLabel {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
}

.summaryValue {
  font-size: 1.4rem;
  font-weight: 800;
  color: #059669;

  .danger & {
    color: #ef4444;
  }

  :global(body.dark) & {
    color: #34d399;
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;

  :global(body.dark) & {
    background: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

.desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0.15rem 0 0;
}

.amount {
  font-weight: 800;
  color: #ef4444;
  font-size: 1rem;
}

.empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

.note {
  text-align: center;
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}
```

---

7️⃣ src/pages/BudgetReports.jsx (stub)

```jsx
function BudgetReports() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
      <p style={{ color: '#94a3b8', fontWeight: 600 }}>التقارير — قيد الإنشاء</p>
    </div>
  )
}

export default BudgetReports
```

---

8️⃣ src/pages/BudgetSettings.jsx (stub)

```jsx
function BudgetSettings() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
      <p style={{ color: '#94a3b8', fontWeight: 600 }}>الإعدادات — قيد الإنشاء</p>
    </div>
  )
}

export default BudgetSettings
```

---

9️⃣ src/App.jsx — التعديل

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ZekrLayout from './pages/ZekrLayout.jsx'
import ZekrSabh from './pages/ZekrSabh.jsx'
import ZekrStats from './pages/ZekrStats.jsx'
import ZekrSettings from './pages/ZekrSettings.jsx'
import BudgetLayout from './pages/BudgetLayout.jsx'
import BudgetTransactions from './pages/BudgetTransactions.jsx'
import BudgetReports from './pages/BudgetReports.jsx'
import BudgetSettings from './pages/BudgetSettings.jsx'

function App() {
  return (
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
        <Route index element={<Navigate to="/budget/transactions" replace />} />
        <Route path="transactions" element={<BudgetTransactions />} />
        <Route path="reports" element={<BudgetReports />} />
        <Route path="settings" element={<BudgetSettings />} />
        <Route path="*" element={<Navigate to="/budget/transactions" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
```

---

🔟 src/main.jsx — التعديل

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ZekrDataProvider } from './context/ZekrDataContext.jsx'
import { BudgetProvider } from './context/BudgetContext.jsx'
import App from './App.jsx'
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ZekrDataProvider>
          <BudgetProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </BudgetProvider>
        </ZekrDataProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
```

---

1️⃣1️⃣ src/pages/Home.jsx — التعديل

فقط الـ APPS array — استبدله بـ:

```jsx
const APPS = [
  {
    id: 'zekr',
    name: 'ذِكر',
    category: 'إسلامي / عبادات',
    description: 'سبحة إلكترونية ذكية بأذكار متنوعة وإحصائيات دقيقة لأورادك اليومية.',
    path: '/zekr',
    icon: '📿',
    available: true,
    accentColor: '#059669',
  },
  {
    id: 'budget',
    name: 'الميزانية',
    category: 'مالي / تتبع',
    description: 'إدارة الدخل والمصروف مع تقارير مفصلة لتصنيفات نفقاتك الشهرية.',
    path: '/budget',
    icon: '💰',
    available: true,
    accentColor: '#0ea5e9',
  },
]
```

بس. باقي الملف زي ما هو.

---

✅ اختبار المرحلة 2

# اختبار المتوقع
1 فتح / بطاقتين: ذِكر + الميزانية (bubble-sort مش موجود)
2 ضغط الميزانية يروح /budget/transactions
3 تبويبات Budget 3 تابات تظهر
4 فتح /budget Redirect لـ /budget/transactions
5 فتح /budget/reports Placeholder يظهر
6 Data in Transactions 
 - ملخص الشهر دخل/مصروف/صافي
 - أول 10 معاملات Category + description + amount
7 تغيير الشهر البيانات تتحدث
8 Console مفيش errors
9 Back من Budget → Home يرجع
10 /zekr/* لسه شغال عادي

---

👈 بعد التطبيق:

· ✅ "الـ skeleton شغال" → المرحلة 3: Core Features (TransactionFormModal + قائمة كاملة + فلترة)
· ⚠️ "في مشكلة" → وصف + console

المرحلة 3 هي الأهم — هتعطي التطبيق القدرة على إضافة/تعديل/حذف معاملة كاملة. 🚀
