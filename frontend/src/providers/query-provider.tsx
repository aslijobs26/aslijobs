"use client";

import { ApplyResumeChooserHost } from "@/components/job-seeker-resume/ApplyResumeChooserHost";
import { shouldRetryQuery } from "@/utils/query-error";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

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
