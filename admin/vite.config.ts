import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Proxy target uses 127.0.0.1 (not "localhost") so Node does not race IPv4/IPv6
 * dual-stack connects. When the backend is briefly down (tsx watch restart),
 * Vite still returns 502 — that is expected — but the IPv4-only target avoids
 * AggregateError [ECONNREFUSED] noise from failed dual-stack attempts.
 */
const BACKEND_ORIGIN = "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        timeout: 30_000,
        proxyTimeout: 30_000,
      },
      "/uploads": {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        timeout: 30_000,
        proxyTimeout: 30_000,
      },
    },
  },
});
