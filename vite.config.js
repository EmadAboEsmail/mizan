import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

// ═══════════════════════════════════════
// نسخ الـ wasm يدوياً + force-exit
// ═══════════════════════════════════════
function copyWasmAndExitPlugin() {
  let exited = false;

  const doCopyAndExit = () => {
    if (exited) return;
    exited = true;

    const src = path.resolve(
      process.cwd(),
      "node_modules/sql.js/dist/sql-wasm.wasm",
    );
    const dest = path.resolve(process.cwd(), "dist/assets/sql-wasm.wasm");

    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      const stats = fs.statSync(dest);
      const kb = Math.round(stats.size / 1024);
      console.log(
        `\n[wasm-copy] ✓ Copied sql-wasm.wasm (${kb}KB) → dist/assets/`,
      );
    } catch (err) {
      console.error(`\n[wasm-copy] ✗ Failed: ${err.message}`);
      process.exit(1);
    }

    console.log("[wasm-copy] Build complete, exiting...");
    process.exit(0);
  };

  return {
    name: "copy-wasm-and-exit",
    apply: "build",
    enforce: "post",

    buildStart() {
      setTimeout(() => {
        if (!exited) {
          console.error("\n[wasm-copy] HARD TIMEOUT (60s)");
          doCopyAndExit();
        }
      }, 60000);
    },

    writeBundle() {
      doCopyAndExit();
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: {
        name: "مساحتي الرقمية",
        short_name: "مساحتي",
        description:
          "منصة تطبيقات عربية — ذِكر للسبحة والإحصائيات، والميزانية لإدارة الدخل والمصروف",
        theme_color: "#059669",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        lang: "ar",
        dir: "rtl",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "السبحة",
            short_name: "ذِكر",
            description: "ابدأ التسبيح مباشرة",
            url: "/zekr/sabh",
            icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
          },
          {
            name: "الميزانية",
            short_name: "الميزانية",
            description: "عرض المعاملات",
            url: "/budget/transactions",
            icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,wasm}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "assets-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
    copyWasmAndExitPlugin(),
  ],
  base: process.env.VITE_TARGET === "android" ? "./" : "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['jeep-sqlite/loader'], // ✅ استبعاد محمل jeep-sqlite
    include: ['jeep-sqlite', 'sql.js'], // ✅ تضمين المكتبات الأساسية
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: { host: "localhost", port: 3000, protocol: "ws" },
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
