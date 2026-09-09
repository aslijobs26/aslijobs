import { apiClient } from "./api-client";
import type {
  OperationsVerificationDetail,
  OperationsVerificationsAnalyticsParams,
  OperationsVerificationsAnalyticsResult,
  OperationsVerificationsExportParams,
  OperationsVerificationsListParams,
  OperationsVerificationsListResult,
  RequestOperationsVerificationDocumentsInput,
  UpdateOperationsVerificationInput,
} from "../types/operations-verifications";

const OPERATIONS_VERIFICATIONS_BASE = "/operations/verifications";

function buildVerificationsFilterParams(
  params: OperationsVerificationsListParams | OperationsVerificationsExportParams,
) {
  return {
    search: params.search || undefined,
    status: params.status || undefined,
    queue: params.queue || undefined,
    industry: params.industry || undefined,
    location: params.location || undefined,
    assignedTo: params.assignedTo || undefined,
    sla: params.sla || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    datePreset: params.datePreset || undefined,
    sort: params.sort || undefined,
    sortDirection: params.sortDirection || undefined,
    employerType: params.employerType || undefined,
    format: "format" in params ? params.format || undefined : undefined,
  };
}

export async function fetchOperationsVerificationsAnalytics(
  params: OperationsVerificationsAnalyticsParams,
): Promise<OperationsVerificationsAnalyticsResult> {
  const response = await apiClient.get<{
    data: OperationsVerificationsAnalyticsResult;
  }>(`${OPERATIONS_VERIFICATIONS_BASE}/analytics`, {
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

export async function fetchOperationsVerificationsList(
  params: OperationsVerificationsListParams,
): Promise<OperationsVerificationsListResult> {
  const response = await apiClient.get<{
    data: OperationsVerificationsListResult;
  }>(OPERATIONS_VERIFICATIONS_BASE, {
    params: {
      page: params.page,
      limit: params.limit,
      ...buildVerificationsFilterParams(params),
    },
  });

  return response.data.data;
}

export async function fetchOperationsVerificationDetail(
  id: string,
): Promise<OperationsVerificationDetail> {
  const response = await apiClient.get<{ data: OperationsVerificationDetail }>(
    `${OPERATIONS_VERIFICATIONS_BASE}/${encodeURIComponent(id)}`,
  );

  return response.data.data;
}

export async function exportOperationsVerifications(
  params: OperationsVerificationsExportParams,
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `${OPERATIONS_VERIFICATIONS_BASE}/export`,
    {
      params: buildVerificationsFilterParams(params),
      responseType: "blob",
    },
  );

  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;
  const filename =
    filenameMatch?.[1]?.trim() ||
    "AsliJobs-Operations-Verifications.xlsx";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function updateOperationsVerification(
  id: string,
  payload: UpdateOperationsVerificationInput,
): Promise<OperationsVerificationDetail> {
  const response = await apiClient.patch<{ data: OperationsVerificationDetail }>(
    `${OPERATIONS_VERIFICATIONS_BASE}/${encodeURIComponent(id)}/verification`,
    payload,
  );

  return response.data.data;
}

export async function requestOperationsVerificationDocuments(
  id: string,
  payload: RequestOperationsVerificationDocumentsInput,
): Promise<OperationsVerificationDetail> {
  const response = await apiClient.post<{ data: OperationsVerificationDetail }>(
    `${OPERATIONS_VERIFICATIONS_BASE}/${encodeURIComponent(id)}/request-documents`,
    payload,
  );

  return response.data.data;
}

export function operationsVerificationDocumentPath(
  verificationId: string,
  documentId: string,
): string {
  return `${OPERATIONS_VERIFICATIONS_BASE}/${encodeURIComponent(verificationId)}/documents/${encodeURIComponent(documentId)}`;
}

export async function fetchOperationsVerificationDocumentBlob(
  verificationId: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiClient.get<Blob>(
    operationsVerificationDocumentPath(verificationId, documentId),
    { responseType: "blob" },
  );

  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;

  return {
    blob: response.data,
    fileName: filenameMatch?.[1]?.trim() || "document",
  };
}
