function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  // Local Vite proxies /api to the backend (see vite.config.ts).
  if (import.meta.env.DEV) {
    return "/api/v1";
  }

  // Production builds must set VITE_API_URL at build time on Vercel.
  // Never fall back to localhost — that surfaces as a cross-origin/network
  // failure from https://admin hosts against http://localhost:5000.
  throw new Error(
    "VITE_API_URL is missing from this production Admin build. Set it to https://aslijobs-backend.onrender.com/api/v1 in Vercel and redeploy.",
  );
}

export const env = {
  apiUrl: resolveApiUrl(),
  /**
   * When true, Operations login may fall back to temporary local credentials
   * in `auth/dev/operations-auth.dev.ts` if the backend login API is unavailable.
   * Prefer real backend auth so Jobs and other APIs receive valid JWTs.
   */
  useDevOperationsAuth: import.meta.env.VITE_OPERATIONS_USE_DEV_AUTH === "true",
} as const;
