import { apiClient } from "./api-client";
import {
  fileNameFromContentDisposition,
  isJsonOrHtmlBlob,
} from "../utils/document-preview";
import type {
  OperationsEmployerOption,
  OperationsEmployersSearchResult,
} from "../types/operations-post-job";
import type {
  CompleteOperationsEmployerInput,
  OperationsEmployerDetail,
  OperationsEmployerJobsResult,
  OperationsEmployerOtpDelivery,
  OperationsEmployersAnalyticsParams,
  OperationsEmployersAnalyticsResult,
  OperationsEmployersExportParams,
  OperationsEmployersListParams,
  OperationsEmployersListResult,
  RegisterOperationsEmployerInput,
  UpdateOperationsEmployerStatusInput,
  UpdateOperationsEmployerVerificationInput,
} from "../types/operations-employers";

const OPERATIONS_EMPLOYERS_BASE = "/operations/employers";

export async function fetchOperationsEmployers(
  params: OperationsEmployersListParams,
): Promise<OperationsEmployersListResult> {
  const response = await apiClient.get<{ data: OperationsEmployersListResult }>(
    OPERATIONS_EMPLOYERS_BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        verificationStatus: params.verificationStatus || undefined,
        verificationQueue: params.verificationQueue || undefined,
        employerType: params.employerType || undefined,
        location: params.location || undefined,
        status: params.status || undefined,
        datePreset: params.datePreset || undefined,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        analyticsPreset: params.analyticsPreset || undefined,
        analyticsFrom: params.analyticsFrom || undefined,
        analyticsTo: params.analyticsTo || undefined,
        kpi: params.kpi || undefined,
        kpiPreset: params.kpi ? params.kpiPreset : undefined,
        kpiDateFrom: params.kpi ? params.kpiDateFrom || undefined : undefined,
        kpiDateTo: params.kpi ? params.kpiDateTo || undefined : undefined,
      },
    },
  );

  return response.data.data;
}

export async function fetchOperationsEmployerDetail(
  employerId: string,
): Promise<OperationsEmployerDetail> {
  const response = await apiClient.get<{ data: OperationsEmployerDetail }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}`,
  );

  return response.data.data;
}

export async function fetchOperationsEmployerJobs(
  employerId: string,
  params: { page: number; limit: number; status?: string },
): Promise<OperationsEmployerJobsResult> {
  const response = await apiClient.get<{ data: OperationsEmployerJobsResult }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/jobs`,
    {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status || undefined,
      },
    },
  );

  return response.data.data;
}

export async function updateOperationsEmployerVerification(
  employerId: string,
  payload: UpdateOperationsEmployerVerificationInput,
): Promise<OperationsEmployerDetail> {
  const response = await apiClient.patch<{ data: OperationsEmployerDetail }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/verification`,
    payload,
  );

  return response.data.data;
}

export async function updateOperationsEmployerStatus(
  employerId: string,
  payload: UpdateOperationsEmployerStatusInput,
): Promise<OperationsEmployerDetail> {
  const response = await apiClient.patch<{ data: OperationsEmployerDetail }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/status`,
    payload,
  );

  return response.data.data;
}

export function operationsEmployerDocumentPath(
  employerId: string,
  documentId: string,
): string {
  return `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/documents/${encodeURIComponent(documentId)}`;
}

export async function fetchOperationsEmployerDocumentBlob(
  employerId: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiClient.get<Blob>(
    operationsEmployerDocumentPath(employerId, documentId),
    { responseType: "blob" },
  );

  const contentType = String(response.headers["content-type"] ?? "");
  if (isJsonOrHtmlBlob(response.data, contentType)) {
    throw new Error("Unable to preview this document.");
  }

  return {
    blob: response.data,
    fileName: fileNameFromContentDisposition(response.headers["content-disposition"]),
  };
}

/** Legacy / Post Job search helpers */
export async function searchOperationsEmployers(params: {
  search: string;
  page?: number;
  limit?: number;
}): Promise<OperationsEmployersSearchResult> {
  const response = await apiClient.get<{ data: OperationsEmployersSearchResult }>(
    OPERATIONS_EMPLOYERS_BASE,
    {
      params: {
        search: params.search || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
  );

  return response.data.data;
}

export async function fetchOperationsEmployerById(
  employerId: string,
): Promise<OperationsEmployerOption> {
  const response = await apiClient.get<{ data: OperationsEmployerOption }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}`,
  );

  return response.data.data;
}

export async function fetchOperationsEmployersAnalytics(
  params: OperationsEmployersAnalyticsParams,
): Promise<OperationsEmployersAnalyticsResult> {
  const response = await apiClient.get<{
    data: OperationsEmployersAnalyticsResult;
  }>(`${OPERATIONS_EMPLOYERS_BASE}/analytics`, {
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

export async function registerOperationsEmployer(
  payload: RegisterOperationsEmployerInput,
): Promise<OperationsEmployerOtpDelivery> {
  const response = await apiClient.post<{ data: OperationsEmployerOtpDelivery }>(
    `${OPERATIONS_EMPLOYERS_BASE}/register`,
    payload,
  );

  return response.data.data;
}

export async function resendOperationsEmployerOtp(
  employerId: string,
): Promise<OperationsEmployerOtpDelivery> {
  const response = await apiClient.post<{ data: OperationsEmployerOtpDelivery }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/otp/resend`,
  );

  return response.data.data;
}

export async function verifyOperationsEmployerOtp(
  employerId: string,
  otp: string,
): Promise<void> {
  await apiClient.post(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/otp/verify`,
    { otp },
  );
}

export async function completeOperationsEmployer(
  employerId: string,
  payload: CompleteOperationsEmployerInput,
): Promise<OperationsEmployerDetail> {
  const response = await apiClient.post<{ data: OperationsEmployerDetail }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}/complete`,
    payload,
  );

  return response.data.data;
}

function buildEmployersFilterParams(params: OperationsEmployersExportParams) {
  return {
    search: params.search || undefined,
    verificationStatus: params.verificationStatus || undefined,
    verificationQueue: params.verificationQueue || undefined,
    employerType: params.employerType || undefined,
    location: params.location || undefined,
    status: params.status || undefined,
    datePreset: params.datePreset || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    analyticsPreset: params.analyticsPreset || undefined,
    analyticsFrom: params.analyticsFrom || undefined,
    analyticsTo: params.analyticsTo || undefined,
    format: params.format || undefined,
  };
}

export async function exportOperationsEmployersCsv(
  params: OperationsEmployersExportParams,
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `${OPERATIONS_EMPLOYERS_BASE}/export`,
    {
      params: buildEmployersFilterParams(params),
      responseType: "blob",
    },
  );

  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;
  const filename =
    filenameMatch?.[1]?.trim() || "AsliJobs-Operations-Employers.xlsx";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
