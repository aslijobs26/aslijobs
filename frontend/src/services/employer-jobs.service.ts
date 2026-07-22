import { apiClient } from "@/services/api-client";
import type {
  CreateJobPayload,
  CreatedJobResponse,
  EmployerJobDetailResponse,
  EmployerJobStatsResponse,
  EmployerJobsListResponse,
  JobStatus,
  JobStatusAction,
  SaveDraftJobPayload,
} from "@/types/employer-jobs";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ListEmployerJobsParams = {
  status?: JobStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export async function createEmployerJob(payload: CreateJobPayload) {
  const response = await apiClient.post<ApiSuccess<CreatedJobResponse>>(
    "/jobs",
    payload,
  );
  return response.data;
}

export async function createEmployerJobDraft(payload: SaveDraftJobPayload) {
  const response = await apiClient.post<ApiSuccess<EmployerJobDetailResponse>>(
    "/jobs/draft",
    payload,
  );
  return response.data.data;
}

export async function updateEmployerJobDraft(
  jobMongoId: string,
  payload: SaveDraftJobPayload,
) {
  const response = await apiClient.patch<ApiSuccess<EmployerJobDetailResponse>>(
    `/jobs/${jobMongoId}/draft`,
    payload,
  );
  return response.data.data;
}

export async function publishEmployerJobDraft(
  jobMongoId: string,
  payload: CreateJobPayload,
) {
  const response = await apiClient.put<ApiSuccess<CreatedJobResponse>>(
    `/jobs/${jobMongoId}/publish`,
    payload,
  );
  return response.data.data;
}

export async function updateEmployerActiveJob(
  jobMongoId: string,
  payload: CreateJobPayload,
) {
  const response = await apiClient.put<ApiSuccess<EmployerJobDetailResponse>>(
    `/jobs/${jobMongoId}`,
    payload,
  );
  return response.data.data;
}

export async function fetchEmployerJob(jobMongoId: string) {
  const response = await apiClient.get<ApiSuccess<EmployerJobDetailResponse>>(
    `/jobs/${jobMongoId}`,
  );
  return response.data.data;
}

export async function fetchEmployerJobs(params: ListEmployerJobsParams = {}) {
  const response = await apiClient.get<ApiSuccess<EmployerJobsListResponse>>(
    "/jobs/mine",
    {
      params,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  );
  return response.data.data;
}

export async function fetchEmployerJobStats() {
  const response = await apiClient.get<ApiSuccess<EmployerJobStatsResponse>>(
    "/jobs/mine/stats",
    {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  );
  return response.data.data;
}

export async function updateEmployerJobStatus(
  jobMongoId: string,
  action: JobStatusAction,
) {
  const response = await apiClient.patch<ApiSuccess<CreatedJobResponse>>(
    `/jobs/${jobMongoId}/status`,
    { action },
  );
  return response.data.data;
}

export async function deleteEmployerJob(jobMongoId: string) {
  const response = await apiClient.delete<
    ApiSuccess<{ id: string; deleted: boolean }>
  >(`/jobs/${jobMongoId}`);
  return response.data.data;
}
