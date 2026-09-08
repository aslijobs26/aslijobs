import { apiClient } from "./api-client";
import type {
  OperationsCandidateApplicationsResult,
  OperationsCandidateDetail,
  OperationsCandidatesAnalyticsParams,
  OperationsCandidatesAnalyticsResult,
  OperationsCandidatesExportParams,
  OperationsCandidatesListParams,
  OperationsCandidatesListResult,
} from "../types/operations-candidates";

const OPERATIONS_CANDIDATES_BASE = "/operations/candidates";

function buildCandidatesFilterParams(
  params: OperationsCandidatesListParams | OperationsCandidatesExportParams,
) {
  return {
    overviewTab: params.overviewTab || undefined,
    verificationStatus: params.verificationStatus || undefined,
    tab: "tab" in params ? params.tab : undefined,
    search: params.search || undefined,
    status: "status" in params ? params.status || undefined : undefined,
    jobId: "jobId" in params ? params.jobId || undefined : undefined,
    employerId:
      "employerId" in params ? params.employerId || undefined : undefined,
    location: params.location || undefined,
    experience: params.experience || undefined,
    gender: params.gender || undefined,
    preferredRole: params.preferredRole || undefined,
    profileStatus: params.profileStatus || undefined,
    applicationPresence: params.applicationPresence || undefined,
    datePreset: params.datePreset || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    dateField: "dateField" in params ? params.dateField : undefined,
    analyticsPreset:
      "analyticsPreset" in params ? params.analyticsPreset : undefined,
    analyticsFrom:
      "analyticsFrom" in params ? params.analyticsFrom || undefined : undefined,
    analyticsTo:
      "analyticsTo" in params ? params.analyticsTo || undefined : undefined,
    format: "format" in params ? params.format || undefined : undefined,
  };
}

export async function fetchOperationsCandidates(
  params: OperationsCandidatesListParams,
): Promise<OperationsCandidatesListResult> {
  const response = await apiClient.get<{ data: OperationsCandidatesListResult }>(
    OPERATIONS_CANDIDATES_BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        ...buildCandidatesFilterParams(params),
      },
    },
  );

  return response.data.data;
}

export async function fetchOperationsCandidatesAnalytics(
  params: OperationsCandidatesAnalyticsParams,
): Promise<OperationsCandidatesAnalyticsResult> {
  const response = await apiClient.get<{
    data: OperationsCandidatesAnalyticsResult;
  }>(`${OPERATIONS_CANDIDATES_BASE}/analytics`, {
    params: {
      preset: params.preset,
      dateFrom:
        params.preset === "custom" && params.dateFrom
          ? params.dateFrom
          : undefined,
      dateTo:
        params.preset === "custom" && params.dateTo
          ? params.dateTo
          : undefined,
    },
  });

  return response.data.data;
}

export async function exportOperationsCandidates(
  params: OperationsCandidatesExportParams,
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `${OPERATIONS_CANDIDATES_BASE}/export`,
    {
      params: buildCandidatesFilterParams(params),
      responseType: "blob",
    },
  );

  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;
  const filename =
    filenameMatch?.[1]?.trim() || "AsliJobs-Operations-Candidates.xlsx";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function operationsCandidateResumePath(jobSeekerId: string): string {
  return `${OPERATIONS_CANDIDATES_BASE}/seekers/${encodeURIComponent(jobSeekerId)}/resume`;
}

export async function fetchOperationsCandidateResumeBlob(
  jobSeekerId: string,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiClient.get<Blob>(
    operationsCandidateResumePath(jobSeekerId),
    { responseType: "blob" },
  );
  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch =
    typeof contentDisposition === "string"
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;
  return {
    blob: response.data,
    fileName: filenameMatch?.[1]?.trim() || "resume.pdf",
  };
}

export async function fetchOperationsCandidateDetail(
  jobSeekerId: string,
): Promise<OperationsCandidateDetail> {
  const response = await apiClient.get<{ data: OperationsCandidateDetail }>(
    `${OPERATIONS_CANDIDATES_BASE}/seekers/${encodeURIComponent(jobSeekerId)}`,
  );

  return response.data.data;
}

export async function fetchOperationsCandidateApplications(
  jobSeekerId: string,
  params: { page: number; limit: number },
): Promise<OperationsCandidateApplicationsResult> {
  const response = await apiClient.get<{
    data: OperationsCandidateApplicationsResult;
  }>(
    `${OPERATIONS_CANDIDATES_BASE}/seekers/${encodeURIComponent(jobSeekerId)}/applications`,
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    },
  );

  return response.data.data;
}
