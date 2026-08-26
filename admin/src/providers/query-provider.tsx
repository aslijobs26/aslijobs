import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  // One retry max for recoverable failures; never hammer gateway/proxy outages.
  if (failureCount >= 1) {
    return false;
  }

  if (!isAxiosError(error)) {
    return true;
  }

  if (
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK" ||
    error.message.toLowerCase().includes("network error")
  ) {
    return false;
  }

  const status = error.response?.status;
  if (status == null) {
    return false;
  }

  // Vite returns 502 when the backend is unreachable (ECONNREFUSED).
  // Retrying immediately only multiplies console/network noise.
  if (status === 401 || status === 403 || status === 404) {
    return false;
  }

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
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
