import { apiClient } from "./api-client";
import type {
  OperationsEmployerOption,
  OperationsEmployersSearchResult,
} from "../types/operations-post-job";
import type {
  OperationsEmployerDetail,
  OperationsEmployerJobsResult,
  OperationsEmployersListParams,
  OperationsEmployersListResult,
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
        employerType: params.employerType || undefined,
        location: params.location || undefined,
        status: params.status || undefined,
        datePreset: params.datePreset || undefined,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        analyticsPreset: params.analyticsPreset || undefined,
        analyticsFrom: params.analyticsFrom || undefined,
        analyticsTo: params.analyticsTo || undefined,
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
