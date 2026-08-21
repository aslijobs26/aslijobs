export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1",
  /**
   * When true, Operations login may fall back to temporary local credentials
   * in `auth/dev/operations-auth.dev.ts` if the backend login API is unavailable.
   * Prefer real backend auth so Jobs and other APIs receive valid JWTs.
   */
  useDevOperationsAuth: import.meta.env.VITE_OPERATIONS_USE_DEV_AUTH === "true",
} as const;
