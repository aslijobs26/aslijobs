import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type ReactNode } from "react";
import {
  operationsQueryRetryDelay,
  shouldRetryOperationsQuery,
} from "../utils/operations-session-errors";

type QueryProviderProps = {
  children: ReactNode;
};

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  // Prefer Operations-aware transient retries (502/503/504, network).
  if (shouldRetryOperationsQuery(failureCount, error)) {
    return true;
  }

  if (failureCount >= 1) {
    return false;
  }

  if (!isAxiosError(error)) {
    return true;
  }

  const status = error.response?.status;
  if (status == null) {
    return false;
  }

  // Auth / missing resources must not retry.
  if (status === 401 || status === 403 || status === 404) {
    return false;
  }

  // Other 5xx (e.g. 500 bugs) — one quick retry only via Operations helper above
  // when classified as gateway; plain 500 stops here.
  if (status >= 500) {
    return false;
  }

  return status >= 408 && status < 500;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: shouldRetryQuery,
            retryDelay: operationsQueryRetryDelay,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
