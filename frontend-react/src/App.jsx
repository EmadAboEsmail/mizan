import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home.jsx";
import ZekrLayout from "./pages/zekr/ZekrLayout.jsx";
import ZekrSabh from "./pages/zekr/ZekrSabh.jsx";
import ZekrStats from "./pages/zekr/ZekrStats.jsx";
import ZekrSettings from "./pages/zekr/ZekrSettings.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/zekr" element={<ZekrLayout />}>
        <Route index element={<Navigate to="/zekr/sabh" replace />} />
        <Route path="sabh" element={<ZekrSabh />} />
        <Route path="stats" element={<ZekrStats />} />
        <Route path="settings" element={<ZekrSettings />} />
        <Route path="*" element={<Navigate to="/zekr/sabh" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
