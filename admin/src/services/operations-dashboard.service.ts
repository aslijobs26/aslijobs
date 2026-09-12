import { apiClient } from "./api-client";
import type {
  OperationsDashboardOverview,
  OperationsDashboardOverviewParams,
} from "../types/operations-dashboard-overview";

const BASE = "/operations/dashboard";

export async function fetchOperationsDashboardOverview(
  params: OperationsDashboardOverviewParams,
): Promise<OperationsDashboardOverview> {
  const response = await apiClient.get<{ data: OperationsDashboardOverview }>(
    `${BASE}/overview`,
    {
      params: {
        datePreset: params.datePreset,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        state: params.state || undefined,
        departmentId: params.departmentId || undefined,
        taskTab: params.taskTab || "all",
        taskSearch: params.taskSearch || undefined,
        taskLimit: params.taskLimit ?? 10,
      },
    },
  );
  return response.data.data;
}

export async function downloadOperationsDashboardExport(
  params: Omit<
    OperationsDashboardOverviewParams,
    "taskTab" | "taskSearch" | "taskLimit"
  >,
): Promise<void> {
  const response = await apiClient.get<Blob>(`${BASE}/export`, {
    params: {
      datePreset: params.datePreset,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      state: params.state || undefined,
      departmentId: params.departmentId || undefined,
    },
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as
    | string
    | undefined;
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? "operations-overview.csv";
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
