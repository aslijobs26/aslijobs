import { EMPLOYER_DASHBOARD_HOME_QUERY_KEYS } from "@/constants/employer-dashboard-home";
import { EMPLOYER_JOBS_QUERY_KEYS } from "@/constants/employer-jobs";
import { apiClient } from "@/services/api-client";
import {
  employerMessageQueryKeys,
  notificationQueryKeys,
} from "@/services/notifications.service";
import { savedCandidatesQueryKeys } from "@/services/saved-candidates.service";
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
import type { QueryClient } from "@tanstack/react-query";

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
  jobId?: string;
  jobType?: string;
  workMode?: string;
  experience?: string;
  minSalary?: number;
  maxSalary?: number;
  city?: string;
  state?: string;
  businessCategory?: string;
  postedQuick?: string;
  postedFrom?: string;
  postedTo?: string;
  applications?: string;
  minVacancies?: number;
  maxVacancies?: number;
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

export type BulkDeleteEmployerJobsPayload =
  | { mode: "ids"; ids: string[] }
  | {
      mode: "filtered";
      filters: Omit<ListEmployerJobsParams, "page" | "limit">;
    }
  | { mode: "all"; confirmText: "DELETE" };

export type BulkDeleteEmployerJobsResult = {
  deletedCount: number;
  deletedIds: string[];
  mode: "ids" | "filtered" | "all";
  orphanCleanup?: {
    deletedApplicationsCount: number;
    deletedInterviewsCount: number;
    deletedSavedCandidatesCount: number;
    deletedShortlistedCount: number;
    deletedNotificationsCount: number;
  };
  cascade?: {
    deletedApplicationsCount: number;
    deletedInterviewsCount: number;
    deletedSavedCandidatesCount: number;
    deletedShortlistedCount: number;
    deletedNotificationsCount: number;
  };
};

export async function bulkDeleteEmployerJobs(
  payload: BulkDeleteEmployerJobsPayload,
): Promise<BulkDeleteEmployerJobsResult> {
  const response = await apiClient.post<
    ApiSuccess<BulkDeleteEmployerJobsResult>
  >("/jobs/bulk-delete", payload);
  return response.data.data;
}

/** Invalidate employer caches affected by cascade job deletion. */
export async function invalidateEmployerJobCascadeCaches(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: EMPLOYER_JOBS_QUERY_KEYS.all }),
    queryClient.invalidateQueries({
      queryKey: EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.all,
    }),
    queryClient.invalidateQueries({ queryKey: ["employer", "applications"] }),
    queryClient.invalidateQueries({
      queryKey: ["employer", "application-stats"],
    }),
    queryClient.invalidateQueries({ queryKey: ["employer", "interviews"] }),
    queryClient.invalidateQueries({
      queryKey: ["employer", "interview-stats"],
    }),
    queryClient.invalidateQueries({ queryKey: savedCandidatesQueryKeys.all }),
    queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.list("employer"),
    }),
    queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.recent("employer"),
    }),
    queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.unreadCount("employer"),
    }),
    queryClient.invalidateQueries({
      queryKey: employerMessageQueryKeys.all,
    }),
  ]);
}
