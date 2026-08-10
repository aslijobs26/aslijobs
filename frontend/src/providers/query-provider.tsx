"use client";

import { ApplyResumeChooserHost } from "@/components/job-seeker-resume/ApplyResumeChooserHost";
import { isAxiosError } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    // Auth and rate-limit failures must not be retried — retries amplify 429s
    // and can make a transient limit look like a permanent outage.
    if (
      status === 401 ||
      status === 403 ||
      status === 404 ||
      status === 429
    ) {
      return false;
    }
  }

  return failureCount < 1;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prefer cache within staleTime. Explicit "always" refetch must be
            // rare — it burns the shared API rate budget and surfaces as 429 on
            // unrelated endpoints (including /employers/me).
            staleTime: 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: shouldRetryQuery,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ApplyResumeChooserHost />
    </QueryClientProvider>
  );
}
