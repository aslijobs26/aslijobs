import { apiClient } from "./api-client";
import type {
  OperationsPlacementDetail,
  OperationsPlacementsAnalyticsParams,
  OperationsPlacementsAnalyticsResult,
  OperationsPlacementsExportParams,
  OperationsPlacementsListParams,
  OperationsPlacementsListResult,
  UpdatePlacementJoiningStatusInput,
} from "../types/operations-placements";

const OPERATIONS_PLACEMENTS_BASE = "/operations/placements";

function buildPlacementsFilterParams(
  params: OperationsPlacementsListParams | OperationsPlacementsExportParams,
) {
  return {
    search: params.search || undefined,
    status: params.status && params.status !== "all" ? params.status : undefined,
    category: params.category || undefined,
    state: params.state || undefined,
    city: params.city || undefined,
    employerId: params.employerId || undefined,
    jobId: params.jobId || undefined,
    sort: params.sort || undefined,
    order: params.order || undefined,
    preset: params.preset || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    format: "format" in params ? params.format || undefined : undefined,
  };
}

export async function fetchOperationsPlacementsAnalytics(
  params: OperationsPlacementsAnalyticsParams,
): Promise<OperationsPlacementsAnalyticsResult> {
  const response = await apiClient.get<{
    data: OperationsPlacementsAnalyticsResult;
  }>(`${OPERATIONS_PLACEMENTS_BASE}/analytics`, {
    params: {
      preset: params.preset,
      dateFrom:
        params.preset === "custom" && params.dateFrom
          ? params.dateFrom
          : undefined,
      dateTo:
        params.preset === "custom" && params.dateTo ? params.dateTo : undefined,
    },
  });

  return response.data.data;
}

export async function fetchOperationsPlacementsList(
  params: OperationsPlacementsListParams,
): Promise<OperationsPlacementsListResult> {
  const response = await apiClient.get<{
    data: OperationsPlacementsListResult;
  }>(OPERATIONS_PLACEMENTS_BASE, {
    params: {
      page: params.page,
      limit: params.limit,
      ...buildPlacementsFilterParams(params),
    },
  });

  return response.data.data;
}

export async function fetchOperationsPlacementDetail(
  id: string,
): Promise<OperationsPlacementDetail> {
  const response = await apiClient.get<{ data: OperationsPlacementDetail }>(
    `${OPERATIONS_PLACEMENTS_BASE}/${encodeURIComponent(id)}`,
  );

  return response.data.data;
}

export async function exportOperationsPlacements(
  params: OperationsPlacementsExportParams,
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `${OPERATIONS_PLACEMENTS_BASE}/export`,
    {
      params: buildPlacementsFilterParams(params),
      responseType: "blob",
    },
  );

  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;
  const filename =
    filenameMatch?.[1]?.trim() || "AsliJobs-Operations-Placements.xlsx";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function updateOperationsPlacementJoiningStatus(
  id: string,
  payload: UpdatePlacementJoiningStatusInput,
): Promise<OperationsPlacementDetail> {
  const response = await apiClient.patch<{ data: OperationsPlacementDetail }>(
    `${OPERATIONS_PLACEMENTS_BASE}/${encodeURIComponent(id)}/joining-status`,
    payload,
  );

  return response.data.data;
}
