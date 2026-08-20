export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1",
  /**
   * When true, Operations login uses temporary dev credentials in
   * `auth/dev/operations-auth.dev.ts` instead of the backend API.
   */
  useDevOperationsAuth:
    import.meta.env.VITE_OPERATIONS_USE_DEV_AUTH === "true" ||
    (import.meta.env.DEV &&
      import.meta.env.VITE_OPERATIONS_USE_DEV_AUTH !== "false"),
} as const;
