import { useQuery } from "@tanstack/react-query";
import {
  downloadOperationsDashboardExport,
  fetchOperationsDashboardOverview,
} from "../services/operations-dashboard.service";
import type { OperationsDashboardOverviewParams } from "../types/operations-dashboard-overview";

export const OPERATIONS_DASHBOARD_QUERY_KEY = [
  "operations",
  "dashboard",
  "overview",
] as const;

export function useOperationsDashboardOverview(
  params: OperationsDashboardOverviewParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_DASHBOARD_QUERY_KEY, params],
    queryFn: () => fetchOperationsDashboardOverview(params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export async function exportOperationsDashboardOverview(
  params: Omit<
    OperationsDashboardOverviewParams,
    "taskTab" | "taskSearch" | "taskLimit"
  >,
) {
  await downloadOperationsDashboardExport(params);
}
