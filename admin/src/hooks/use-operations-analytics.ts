import { useQuery } from "@tanstack/react-query";
import {
  exportOperationsAnalyticsOverview,
  fetchOperationsAnalyticsOverview,
} from "../services/operations-analytics.service";
import type { OperationsAnalyticsOverviewParams } from "../types/operations-analytics";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_ANALYTICS_OVERVIEW_QUERY_KEY = [
  "operations",
  "analytics",
  "overview",
] as const;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isOperationsSessionTransientError(error);
}

export function useOperationsAnalyticsOverview(
  params: OperationsAnalyticsOverviewParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_ANALYTICS_OVERVIEW_QUERY_KEY, params],
    queryFn: () => fetchOperationsAnalyticsOverview(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    enabled: options?.enabled ?? true,
  });
}

export async function downloadOperationsAnalyticsExport(
  params: OperationsAnalyticsOverviewParams,
): Promise<void> {
  const blob = await exportOperationsAnalyticsOverview(params);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `asli-os-analytics-${params.preset}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
