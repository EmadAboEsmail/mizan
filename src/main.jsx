// ═══════════════════════════════════════════════════════════════
// src/main.jsx — Native-first bootstrap (Android / iOS)
// ═══════════════════════════════════════════════════════════════
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { ToastProvider } from "./contexts/ToastProvider.jsx";
import { ZekrDataProvider } from "./contexts/ZekrDataContext.jsx";
import { BudgetProvider } from "./contexts/BudgetContext.jsx";
import { initDB } from "./db/index.js";
import { initClickBuffer } from "./services/clickBuffer.js";
import App from "./App.jsx";
import "./styles/main.scss";

// ═══════════════════════════════════════════════════════════════
// Bootstrap
// ═══════════════════════════════════════════════════════════════
async function bootstrap() {
  try {
    const platform = Capacitor.getPlatform();
    console.log(`[Bootstrap] Starting on ${platform}...`);

    // 1. DB أولًا — كل حاجة تحتها محتاجة الـ adapter جاهز
    await initDB();

    // 2. click buffer (listeners على visibilitychange / appStateChange)
    initClickBuffer();

    // 3. Router: native → HashRouter (متوافق مع WebView + file://)
    //             web    → BrowserRouter (dev على المتصفح)
    const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

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
      </React.StrictMode>
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
