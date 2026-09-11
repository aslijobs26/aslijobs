import { apiClient } from "./api-client";
import type {
  AssignWorkInput,
  EligibleAssignee,
  OperationsWorkAnalyticsResult,
  OperationsWorkDetail,
  OperationsWorkListParams,
  OperationsWorkListResult,
  OperationsWorkPerformanceResult,
  UpdateWorkStatusInput,
  WorkItemPriority,
} from "../types/operations-work";

const BASE = "/operations/work";

function listParams(params: OperationsWorkListParams) {
  return {
    page: params.page,
    limit: params.limit,
    tab: params.tab,
    type: params.type || undefined,
    priority: params.priority || undefined,
    due: params.due !== "all" ? params.due : undefined,
    search: params.search || undefined,
    sort: params.sort,
    order: params.order,
  };
}

export async function fetchOperationsWorkAnalytics(): Promise<OperationsWorkAnalyticsResult> {
  const response = await apiClient.get<{ data: OperationsWorkAnalyticsResult }>(
    `${BASE}/analytics`,
  );
  return response.data.data;
}

export async function fetchOperationsWorkPerformance(): Promise<OperationsWorkPerformanceResult> {
  const response = await apiClient.get<{
    data: OperationsWorkPerformanceResult;
  }>(`${BASE}/performance`);
  return response.data.data;
}

export async function fetchOperationsWorkList(
  params: OperationsWorkListParams,
): Promise<OperationsWorkListResult> {
  const response = await apiClient.get<{ data: OperationsWorkListResult }>(
    BASE,
    { params: listParams(params) },
  );
  return response.data.data;
}

export async function fetchOperationsWorkDetail(
  id: string,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.get<{ data: OperationsWorkDetail }>(
    `${BASE}/${encodeURIComponent(id)}`,
  );
  return response.data.data;
}

export async function fetchEligibleWorkAssignees(): Promise<EligibleAssignee[]> {
  const response = await apiClient.get<{
    data: { items: EligibleAssignee[] };
  }>(`${BASE}/eligible-assignees`);
  return response.data.data.items;
}

export interface CreateOperationsWorkInput {
  title: string;
  description?: string;
  type: string;
  priority: WorkItemPriority;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  relatedLabel?: string;
  relatedLocationLabel?: string;
  assignedToUserId?: string | null;
  dueAt?: string | null;
}

export async function createOperationsWork(
  input: CreateOperationsWorkInput,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.post<{ data: OperationsWorkDetail }>(
    BASE,
    input,
  );
  return response.data.data;
}

export async function assignOperationsWork(
  id: string,
  input: AssignWorkInput,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.patch<{ data: OperationsWorkDetail }>(
    `${BASE}/${encodeURIComponent(id)}/assign`,
    input,
  );
  return response.data.data;
}

export async function claimOperationsWork(
  id: string,
  expectedRevision: number,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.patch<{ data: OperationsWorkDetail }>(
    `${BASE}/${encodeURIComponent(id)}/claim`,
    { expectedRevision },
  );
  return response.data.data;
}

export async function updateOperationsWorkStatus(
  id: string,
  input: UpdateWorkStatusInput,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.patch<{ data: OperationsWorkDetail }>(
    `${BASE}/${encodeURIComponent(id)}/status`,
    input,
  );
  return response.data.data;
}

export async function updateOperationsWorkPriority(
  id: string,
  priority: WorkItemPriority,
  expectedRevision: number,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.patch<{ data: OperationsWorkDetail }>(
    `${BASE}/${encodeURIComponent(id)}/priority`,
    { priority, expectedRevision },
  );
  return response.data.data;
}

export async function updateOperationsWorkDue(
  id: string,
  dueAt: string | null,
  expectedRevision: number,
): Promise<OperationsWorkDetail> {
  const response = await apiClient.patch<{ data: OperationsWorkDetail }>(
    `${BASE}/${encodeURIComponent(id)}/due`,
    { dueAt, expectedRevision },
  );
  return response.data.data;
}

export async function exportOperationsWork(
  params: Omit<OperationsWorkListParams, "page" | "limit"> & {
    format?: "xlsx" | "csv";
  },
): Promise<void> {
  const response = await apiClient.get<Blob>(`${BASE}/export`, {
    params: {
      ...listParams({ ...params, page: 1, limit: 20 }),
      format: params.format ?? "xlsx",
    },
    responseType: "blob",
  });
  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;
  const filename =
    filenameMatch?.[1]?.trim() || "AsliJobs-Operations-MyWork.xlsx";
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
