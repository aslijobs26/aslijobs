import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteOperationsCandidate,
  exportOperationsCandidates,
  fetchOperationsCandidateApplications,
  fetchOperationsCandidateDetail,
  fetchOperationsCandidates,
  fetchOperationsCandidatesAnalytics,
} from "../services/operations-candidates.service";
import { OPERATIONS_JOBS_QUERY_KEY } from "./use-operations-jobs";
import { OPERATIONS_PLACEMENTS_QUERY_KEY } from "./use-operations-placements";
import { OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY } from "./use-operations-registration-awareness";
import { OPERATIONS_WORK_QUERY_KEY } from "./use-operations-work";
import type {
  OperationsCandidatesAnalyticsParams,
  OperationsCandidatesExportParams,
  OperationsCandidatesListParams,
} from "../types/operations-candidates";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_CANDIDATES_QUERY_KEY = [
  "operations",
  "candidates",
] as const;

export const OPERATIONS_CANDIDATES_ANALYTICS_QUERY_KEY = [
  "operations",
  "candidates",
  "analytics",
] as const;

function shouldRetryCandidatesQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 3) {
    return false;
  }
  return isOperationsSessionTransientError(error);
}

function candidatesRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

export function useOperationsCandidates(
  params: OperationsCandidatesListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_CANDIDATES_QUERY_KEY, params],
    queryFn: () => fetchOperationsCandidates(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCandidatesQuery,
    retryDelay: candidatesRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsCandidatesAnalytics(
  params: OperationsCandidatesAnalyticsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_CANDIDATES_ANALYTICS_QUERY_KEY, params],
    queryFn: () => fetchOperationsCandidatesAnalytics(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCandidatesQuery,
    retryDelay: candidatesRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useDeleteOperationsCandidateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobSeekerId: string) => deleteOperationsCandidate(jobSeekerId),
    onSuccess: async (_data, jobSeekerId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_CANDIDATES_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...OPERATIONS_CANDIDATES_QUERY_KEY, "detail", jobSeekerId],
        }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: OPERATIONS_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_PLACEMENTS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: OPERATIONS_WORK_QUERY_KEY }),
      ]);
    },
  });
}

export function useExportOperationsCandidates() {
  return useMutation({
    mutationFn: (params: OperationsCandidatesExportParams) =>
      exportOperationsCandidates(params),
  });
}

export function useOperationsCandidateDetail(
  jobSeekerId: string | undefined,
) {
  return useQuery({
    queryKey: [...OPERATIONS_CANDIDATES_QUERY_KEY, "detail", jobSeekerId],
    queryFn: () => fetchOperationsCandidateDetail(jobSeekerId!),
    enabled: Boolean(jobSeekerId),
    staleTime: 30_000,
    retry: shouldRetryCandidatesQuery,
    retryDelay: candidatesRetryDelay,
  });
}

export function useOperationsCandidateApplications(
  jobSeekerId: string | undefined,
  params: { page: number; limit: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      ...OPERATIONS_CANDIDATES_QUERY_KEY,
      "applications",
      jobSeekerId,
      params,
    ],
    queryFn: () => fetchOperationsCandidateApplications(jobSeekerId!, params),
    enabled: Boolean(jobSeekerId) && (options?.enabled ?? true),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetryCandidatesQuery,
    retryDelay: candidatesRetryDelay,
  });
}
