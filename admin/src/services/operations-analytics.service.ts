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
    country: params.country?.trim() || undefined,
    state: params.state?.trim() || undefined,
    city: params.city?.trim() || undefined,
    category: params.category?.trim() || undefined,
    employer: params.employer?.trim() || undefined,
    jobType: params.jobType?.trim() || undefined,
    applicationStatus: params.applicationStatus?.trim() || undefined,
    horizonDays: params.horizonDays ? String(params.horizonDays) : undefined,
    format: params.format,
    report: params.report,
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
      params: buildParams(params),
      responseType: "blob",
    },
  );
  return response.data;
}

export interface OperationsAnalyticsDrilldown {
  metric: string;
  page: number;
  limit: number;
  total: number;
  rows: Array<Record<string, string | number | null>>;
  definition: string;
  source: string;
  dateField: string;
  limitation: string;
}

export async function fetchOperationsAnalyticsDrilldown(
  params: OperationsAnalyticsOverviewParams & {
    metric: string;
    page: number;
    limit: number;
    q?: string;
    sort?: "date" | "name";
    dir?: "asc" | "desc";
  },
): Promise<OperationsAnalyticsDrilldown> {
  const response = await apiClient.get<{ data: OperationsAnalyticsDrilldown }>(
    `${OPERATIONS_ANALYTICS_BASE}/drilldown`,
    {
      params: {
        ...buildParams(params),
        metric: params.metric,
        page: params.page,
        limit: params.limit,
        q: params.q || undefined,
        sort: params.sort,
        dir: params.dir,
      },
    },
  );
  return response.data.data;
}

export async function downloadOperationsAnalyticsDrilldown(
  params: OperationsAnalyticsOverviewParams & { metric: string; q?: string },
): Promise<void> {
  const response = await apiClient.get<Blob>(`${OPERATIONS_ANALYTICS_BASE}/drilldown/export`, {
    params: {
      ...buildParams(params),
      metric: params.metric,
      q: params.q || undefined,
    },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  const truncated = String(response.headers["x-export-truncated"] ?? "") === "true";
  anchor.download = `aslijobs-analytics-${params.metric}-filtered${truncated ? "-partial" : ""}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
