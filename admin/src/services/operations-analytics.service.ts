import { apiClient } from "./api-client";
import type {
  OperationsAnalyticsOverview,
  OperationsAnalyticsOverviewParams,
} from "../types/operations-analytics";

const OPERATIONS_ANALYTICS_BASE = "/operations/analytics";

function buildParams(params: OperationsAnalyticsOverviewParams) {
  return {
    preset: params.preset,
    dateFrom:
      params.preset === "custom" && params.dateFrom
        ? params.dateFrom
        : undefined,
    dateTo:
      params.preset === "custom" && params.dateTo ? params.dateTo : undefined,
    state: params.state?.trim() || undefined,
  };
}

export async function fetchOperationsAnalyticsOverview(
  params: OperationsAnalyticsOverviewParams,
): Promise<OperationsAnalyticsOverview> {
  const response = await apiClient.get<{
    data: OperationsAnalyticsOverview;
  }>(`${OPERATIONS_ANALYTICS_BASE}/overview`, {
    params: buildParams(params),
  });
  return response.data.data;
}

export async function exportOperationsAnalyticsOverview(
  params: OperationsAnalyticsOverviewParams,
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `${OPERATIONS_ANALYTICS_BASE}/export`,
    {
      params: { ...buildParams(params), format: "csv" },
      responseType: "blob",
    },
  );
  return response.data;
}
