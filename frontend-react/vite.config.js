import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ⚠️ السطر الأهم لتطبيق الأندرويد (يجعل المسارات نسبية)
  base: "./",

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // إعدادات التطوير المحلي (مش مهمة للأندرويد بس مفيدة للتطوير)
  server: {
    host: "localhost",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
