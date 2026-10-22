import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home.jsx";
import ZekrLayout from "./pages/zekr/ZekrLayout.jsx";
import ZekrSabh from "./pages/zekr/ZekrSabh.jsx";
import ZekrStats from "./pages/zekr/ZekrStats.jsx";
import ZekrSettings from "./pages/zekr/ZekrSettings.jsx";
import BudgetLayout from "./pages/budget/BudgetLayout.jsx";
import BudgetTransactions from "./pages/budget/BudgetTransactions.jsx";
import BudgetReports from "./pages/budget/BudgetReports.jsx";
import BudgetSettings from "./pages/budget/BudgetSettings.jsx";
import InstallPrompt from "./components/pwa/InstallPrompt.jsx";

function App() {
  return (
    <>
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
      <InstallPrompt />
    </>
  );
}

export default App;
