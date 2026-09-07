import { apiClient } from "./api-client";
import type {
  OperationsCandidateApplicationsResult,
  OperationsCandidateDetail,
  OperationsCandidatesAnalyticsParams,
  OperationsCandidatesAnalyticsResult,
  OperationsCandidatesListParams,
  OperationsCandidatesListResult,
} from "../types/operations-candidates";

const OPERATIONS_CANDIDATES_BASE = "/operations/candidates";

export async function fetchOperationsCandidates(
  params: OperationsCandidatesListParams,
): Promise<OperationsCandidatesListResult> {
  const response = await apiClient.get<{ data: OperationsCandidatesListResult }>(
    OPERATIONS_CANDIDATES_BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        overviewTab: params.overviewTab || undefined,
        verificationStatus: params.verificationStatus || undefined,
        tab: params.tab,
        search: params.search || undefined,
        status: params.status || undefined,
        jobId: params.jobId || undefined,
        employerId: params.employerId || undefined,
        location: params.location || undefined,
        experience: params.experience || undefined,
        gender: params.gender || undefined,
        preferredRole: params.preferredRole || undefined,
        profileStatus: params.profileStatus || undefined,
        datePreset: params.datePreset,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        dateField: params.dateField,
        analyticsPreset: params.analyticsPreset,
        analyticsFrom: params.analyticsFrom || undefined,
        analyticsTo: params.analyticsTo || undefined,
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
