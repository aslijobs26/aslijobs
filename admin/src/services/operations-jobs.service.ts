import { apiClient } from "./api-client";
import type {
  OperationsJobApplicationsParams,
  OperationsJobApplicationsResult,
  OperationsJobDetail,
  OperationsJobStatusAction,
  OperationsJobsListParams,
  OperationsJobsListResult,
} from "../types/operations-jobs";
import type {
  SaveOperationsJobDraftPayload,
} from "../types/operations-post-job";
import type { OperationsPublishJobPayload } from "../utils/map-operations-post-job-payload";

const OPERATIONS_JOBS_BASE = "/operations/jobs";

export async function fetchOperationsJobs(
  params: OperationsJobsListParams,
): Promise<OperationsJobsListResult> {
  const response = await apiClient.get<{ data: OperationsJobsListResult }>(
    OPERATIONS_JOBS_BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        tab: params.tab,
        search: params.search || undefined,
        status: params.status || undefined,
        paymentStatus: params.paymentStatus || undefined,
        location: params.location || undefined,
      },
    },
  );

  return response.data.data;
}

export async function fetchOperationsJobDetail(
  jobId: string,
): Promise<OperationsJobDetail> {
  const response = await apiClient.get<{ data: OperationsJobDetail }>(
    `${OPERATIONS_JOBS_BASE}/${encodeURIComponent(jobId)}`,
  );

  return response.data.data;
}

export async function fetchOperationsJobApplications(
  jobId: string,
  params: OperationsJobApplicationsParams = {},
): Promise<OperationsJobApplicationsResult> {
  const response = await apiClient.get<{ data: OperationsJobApplicationsResult }>(
    `${OPERATIONS_JOBS_BASE}/${encodeURIComponent(jobId)}/applications`,
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status || undefined,
        search: params.search || undefined,
      },
    },
  );

  return response.data.data;
}

export async function updateOperationsJobStatus(
  jobId: string,
  action: OperationsJobStatusAction,
): Promise<OperationsJobDetail> {
  const response = await apiClient.patch<{ data: OperationsJobDetail }>(
    `${OPERATIONS_JOBS_BASE}/${encodeURIComponent(jobId)}/status`,
    { action },
  );

  return response.data.data;
}

export async function createOperationsJobDraft(
  payload: SaveOperationsJobDraftPayload,
): Promise<OperationsJobDetail> {
  const response = await apiClient.post<{ data: OperationsJobDetail }>(
    `${OPERATIONS_JOBS_BASE}/draft`,
    payload,
  );

  return response.data.data;
}

export async function updateOperationsJobDraft(
  jobId: string,
  payload: SaveOperationsJobDraftPayload,
): Promise<OperationsJobDetail> {
  const response = await apiClient.patch<{ data: OperationsJobDetail }>(
    `${OPERATIONS_JOBS_BASE}/${encodeURIComponent(jobId)}/draft`,
    payload,
  );

  return response.data.data;
}

export async function assignOperationsJobEmployer(
  jobId: string,
  employerId: string,
): Promise<OperationsJobDetail> {
  const response = await apiClient.put<{ data: OperationsJobDetail }>(
    `${OPERATIONS_JOBS_BASE}/${encodeURIComponent(jobId)}/assign-employer`,
    { employerId },
  );

  return response.data.data;
}

export async function publishOperationsJobDraft(
  jobId: string,
  payload: OperationsPublishJobPayload,
): Promise<OperationsJobDetail> {
  const response = await apiClient.put<{ data: OperationsJobDetail }>(
    `${OPERATIONS_JOBS_BASE}/${encodeURIComponent(jobId)}/publish`,
    payload,
  );

  return response.data.data;
}
