import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOperationsJobs,
  fetchOperationsJobsAnalytics,
  updateOperationsJobStatus,
} from "../services/operations-jobs.service";
import type {
  OperationsJobsAnalyticsParams,
  OperationsJobsListParams,
  OperationsJobStatusAction,
} from "../types/operations-jobs";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { OPERATIONS_JOB_DETAIL_QUERY_KEY } from "./use-operations-job-detail";

export const OPERATIONS_JOBS_QUERY_KEY = ["operations", "jobs"] as const;
export const OPERATIONS_JOBS_ANALYTICS_QUERY_KEY = [
  "operations",
  "jobs",
  "analytics",
] as const;

function shouldRetryJobsQuery(
  failureCount: number,
  error: unknown,
): boolean {
  // Backend restarts (tsx watch) briefly cause Vite 502 / ECONNREFUSED.
  // Retry with backoff instead of leaving Analytics stuck on Bad Gateway.
  if (failureCount >= 4) {
    return false;
  }
  return isOperationsSessionTransientError(error);
}

function jobsRetryDelay(attemptIndex: number): number {
  return Math.min(800 * 2 ** attemptIndex, 6000);
}

export function useOperationsJobs(
  params: OperationsJobsListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_JOBS_QUERY_KEY, params],
    queryFn: () => fetchOperationsJobs(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryJobsQuery,
    retryDelay: jobsRetryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsJobsAnalytics(
  params: OperationsJobsAnalyticsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_JOBS_ANALYTICS_QUERY_KEY, params],
    queryFn: () => fetchOperationsJobsAnalytics(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryJobsQuery,
    retryDelay: jobsRetryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateOperationsJobStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      action,
      reason,
    }: {
      jobId: string;
      action: OperationsJobStatusAction;
      reason?: string;
    }) => updateOperationsJobStatus(jobId, action, reason),
    onSuccess: async (_data, { jobId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: OPERATIONS_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_JOBS_ANALYTICS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...OPERATIONS_JOB_DETAIL_QUERY_KEY, jobId],
        }),
      ]);
    },
  });
}
