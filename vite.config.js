import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// ═══════════════════════════════════════════════════════════════
// Build target: web (PWA) vs android (Capacitor)
// ═══════════════════════════════════════════════════════════════
const isAndroidBuild = process.env.VITE_TARGET === "android";

export default defineConfig({
  plugins: [
    react(),

    // ═══════════════════════════════════════════════════════════
    // PWA: للويب فقط — على Android مش لازمة
    // ═══════════════════════════════════════════════════════════
    ...(isAndroidBuild
      ? []
      : [
        VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["favicon.ico", "icons/*.png"],
          manifest: {
            name: "مِيزان — ذِكر والميزانية",
            short_name: "ميزان",
            description:
              "توازن يومك ومالك — ذِكر للسبحة والإحصائيات، والميزانية لإدارة الدخل والمصروف بدون إنترنت",
            theme_color: "#FAF6F0",
            background_color: "#FAF6F0",
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
                icons: [{ src: "/icons/icon-zekr-96.png", sizes: "96x96" }],
              },
              {
                name: "الميزانية",
                short_name: "الميزانية",
                description: "عرض المعاملات",
                url: "/budget/transactions",
                icons: [{ src: "/icons/icon-budget-96.png", sizes: "96x96" }],
              },
            ],
          },
          workbox: {
            disableDevLogs: true,
            globPatterns: [
              "**/*.{js,css,html,ico,png,svg,woff,woff2,wasm}",
            ],
            navigateFallback: "/index.html",
            navigateFallbackDenylist: [/^\/api/],
            runtimeCaching: [
              {
                urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
                handler: "NetworkFirst",
                options: {
                  cacheName: "api-cache",
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                  networkTimeoutSeconds: 5,
                },
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "assets-cache",
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                },
              },
            ],
          },
          devOptions: { enabled: false },
        }),
      ]),

  ],

  // ═══════════════════════════════════════════════════════════
  // Base: android → relative, web → root
  // ═══════════════════════════════════════════════════════════
  base: isAndroidBuild ? "./" : "/",

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  optimizeDeps: {
    exclude: ["jeep-sqlite-current-sqljs/loader"],
    include: ["jeep-sqlite-current-sqljs", "sql.js"],
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
    allowedHosts: true,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },

  preview: {
    host: true,
    allowedHosts: true,
  },
});
