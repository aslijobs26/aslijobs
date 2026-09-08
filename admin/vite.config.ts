import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Proxy target uses 127.0.0.1 (not "localhost") so Node does not race IPv4/IPv6
 * dual-stack connects. When the backend is briefly down (tsx watch restart),
 * return a clean 503 so TanStack Query can retry instead of an opaque proxy crash.
 */
const BACKEND_ORIGIN = "http://127.0.0.1:5000";

function isServerResponse(
  value: unknown,
): value is ServerResponse<IncomingMessage> {
  return (
    typeof value === "object" &&
    value !== null &&
    "writeHead" in value &&
    typeof (value as ServerResponse).writeHead === "function"
  );
}

function createBackendProxy(): ProxyOptions {
  let lastWarnAt = 0;

  return {
    target: BACKEND_ORIGIN,
    changeOrigin: true,
    timeout: 30_000,
    proxyTimeout: 30_000,
    configure(proxy) {
      proxy.on("error", (error, _req, res) => {
        const now = Date.now();
        // Avoid flooding the terminal while tsx watch restarts (often <2s).
        if (now - lastWarnAt > 5_000) {
          lastWarnAt = now;
          console.warn(
            `[vite] backend unreachable at ${BACKEND_ORIGIN} (will retry). ${error.message}`,
          );
        }

        if (isServerResponse(res) && !res.headersSent) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              message:
                "The API server is temporarily unavailable. Please wait a moment and retry.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": createBackendProxy(),
      "/uploads": createBackendProxy(),
    },
  },
});
