import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { ZekrDataProvider } from "./contexts/ZekrDataContext.jsx";
import { BudgetProvider } from "./contexts/BudgetContext.jsx";
import { defineCustomElements } from "jeep-sqlite-current-sqljs/loader";
import { initDB } from "./db/index.js";
import App from "./App.jsx";
import "./styles/main.scss";

// ═══════════════════════════════════════
// تهيئة jeep-sqlite (web only)
// ═══════════════════════════════════════
async function initWebSQLite() {
  if (Capacitor.getPlatform() !== "web") {
    console.log("[WebSQLite] Skipping (not web)");
    return;
  }

  console.log("[WebSQLite] defineCustomElements...");
  defineCustomElements(window);

  // 1. انتظار تعريف العنصر أولاً
  await customElements.whenDefined("jeep-sqlite");
  console.log("[WebSQLite] jeep-sqlite defined");

  // 2. إنشاء العنصر وإضافته للـ DOM بشكل سليم
  let jeepSqliteEl = document.querySelector("jeep-sqlite");
  if (!jeepSqliteEl) {
    jeepSqliteEl = document.createElement("jeep-sqlite");
    jeepSqliteEl.setAttribute("autoSave", "true");
    jeepSqliteEl.setAttribute("wasmPath", "/assets"); // ✅ مسار نسبي قياسي
    document.body.appendChild(jeepSqliteEl);
    console.log("[WebSQLite] element created with wasmPath: /assets");
  }

  // 3. التأكد من اتصال العنصر
  let attempts = 0;
  while (attempts < 50) {
    const el = document.querySelector("jeep-sqlite");
    if (el && el.isConnected) {
      console.log("[WebSQLite] element is connected ✅");
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
    attempts++;
  }

  // مهلة أمان بسيطة للتأكد من جاهزية WebAssembly
  await new Promise((r) => setTimeout(r, 300));
  console.log("[WebSQLite] Ready");
}

async function bootstrap() {
  try {
    console.log("[Bootstrap] Starting...");
    await initWebSQLite();
    await initDB();

    const Router =
      import.meta.env.VITE_TARGET === "android" ? HashRouter : BrowserRouter;

    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <ThemeProvider>
          <ToastProvider>
            <ZekrDataProvider>
              <BudgetProvider>
                <Router>
                  <App />
                </Router>
              </BudgetProvider>
            </ZekrDataProvider>
          </ToastProvider>
        </ThemeProvider>
      </React.StrictMode>,
    );

    console.log("[Bootstrap] Success ✅");
  } catch (err) {
    console.error("[Bootstrap] Failed:", err);
    document.getElementById("root").innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif; direction: rtl;">
        <h1>⚠️ فشل تهيئة التطبيق</h1>
        <p style="color: #d32f2f; font-weight: 600;">${err?.message || err}</p>
        <details style="margin-top: 1rem; text-align: left;">
          <summary style="cursor: pointer; color: #666;">Stack trace</summary>
          <pre style="background: #f5f5f5; padding: 1rem; overflow: auto; font-size: 0.8rem;">${err?.stack || ""}</pre>
        </details>
      </div>
    `;
  }
}

bootstrap();
