import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Proxy target uses 127.0.0.1 (not "localhost") so Node does not race IPv4/IPv6
 * dual-stack connects. When the backend is briefly down (tsx watch restart),
 * subsequent /api requests wait for /api/v1/health before proxying. Combined
 * with TanStack Query backoff this absorbs typical restart windows instead of
 * flooding the UI with 503s.
 */
const BACKEND_ORIGIN = "http://127.0.0.1:5000";
const BACKEND_HEALTH_PATH = "/api/v1/health";
const BACKEND_WAIT_MS = 8_000;
const BACKEND_POLL_MS = 250;
/** After a proxy failure, wait-for-health on inbound API traffic for this window. */
const BACKEND_RECOVERY_WINDOW_MS = 15_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function probeBackendHealth(timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(
      `${BACKEND_ORIGIN}${BACKEND_HEALTH_PATH}`,
      { timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve((res.statusCode ?? 500) < 500);
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxWaitMs: number): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() <= deadline) {
    if (await probeBackendHealth()) {
      return true;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      break;
    }
    await sleep(Math.min(BACKEND_POLL_MS, remaining));
  }
  return false;
}

function writeProxyUnavailable(
  res: ServerResponse<IncomingMessage>,
  message: string,
): void {
  if (res.headersSent) {
    return;
  }
  res.writeHead(503, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      success: false,
      message,
    }),
  );
}

function createBackendProxy(onProxyFailure: () => void): ProxyOptions {
  let lastWarnAt = 0;

  return {
    target: BACKEND_ORIGIN,
    changeOrigin: true,
    timeout: 60_000,
    proxyTimeout: 60_000,
    configure(proxy) {
      proxy.on("error", (error, _req, res) => {
        onProxyFailure();
        const now = Date.now();
        if (now - lastWarnAt > 5_000) {
          lastWarnAt = now;
          console.warn(
            `[vite] backend unreachable at ${BACKEND_ORIGIN} (will retry). ${error.message}`,
          );
        }

        if (isServerResponse(res)) {
          writeProxyUnavailable(
            res,
            "The API server is temporarily unavailable. Please wait a moment and retry.",
          );
        }
      });
    },
  };
}

/**
 * After a recent proxy failure, pause /api and /uploads until health recovers
 * (or the wait budget expires). Healthy steady-state traffic is not probed.
 */
function backendReadyPlugin(getLastFailureAt: () => number): Plugin {
  return {
    name: "aslijobs-backend-ready",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api") && !url.startsWith("/uploads")) {
          next();
          return;
        }

        const failedRecently =
          Date.now() - getLastFailureAt() < BACKEND_RECOVERY_WINDOW_MS;
        if (!failedRecently) {
          next();
          return;
        }

        const ready = await waitForBackend(BACKEND_WAIT_MS);
        if (ready) {
          next();
          return;
        }

        writeProxyUnavailable(
          res as ServerResponse<IncomingMessage>,
          "The API server is temporarily unavailable. Please wait a moment and retry.",
        );
      });
    },
  };
}

export default defineConfig(() => {
  let lastProxyFailureAt = 0;
  const markProxyFailure = () => {
    lastProxyFailureAt = Date.now();
  };
  const proxy = createBackendProxy(markProxyFailure);

  return {
    plugins: [
      react(),
      tailwindcss(),
      backendReadyPlugin(() => lastProxyFailureAt),
    ],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": proxy,
        "/uploads": proxy,
      },
    },
  };
});
