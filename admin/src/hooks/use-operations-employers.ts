import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOperationsEmployerDetail,
  fetchOperationsEmployerJobs,
  fetchOperationsEmployers,
  updateOperationsEmployerStatus,
  updateOperationsEmployerVerification,
} from "../services/operations-employers.service";
import type {
  OperationsEmployersListParams,
  UpdateOperationsEmployerStatusInput,
  UpdateOperationsEmployerVerificationInput,
} from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_EMPLOYERS_QUERY_KEY = [
  "operations",
  "employers",
] as const;

function shouldRetryEmployersQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 3) {
    return false;
  }
  return isOperationsSessionTransientError(error);
}

function employersRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

export function useOperationsEmployers(params: OperationsEmployersListParams) {
  return useQuery({
    queryKey: [...OPERATIONS_EMPLOYERS_QUERY_KEY, params],
    queryFn: () => fetchOperationsEmployers(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryEmployersQuery,
    retryDelay: employersRetryDelay,
    placeholderData: keepPreviousData,
  });
}

export function useOperationsEmployerDetail(employerId: string | undefined) {
  return useQuery({
    queryKey: [...OPERATIONS_EMPLOYERS_QUERY_KEY, "detail", employerId],
    queryFn: () => fetchOperationsEmployerDetail(employerId!),
    enabled: Boolean(employerId),
    staleTime: 30_000,
    retry: shouldRetryEmployersQuery,
    retryDelay: employersRetryDelay,
  });
}

export function useOperationsEmployerJobs(
  employerId: string | undefined,
  params: { page: number; limit: number; status?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      ...OPERATIONS_EMPLOYERS_QUERY_KEY,
      "jobs",
      employerId,
      params,
    ],
    queryFn: () => fetchOperationsEmployerJobs(employerId!, params),
    enabled: Boolean(employerId) && (options?.enabled ?? true),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetryEmployersQuery,
    retryDelay: employersRetryDelay,
  });
}

export function useUpdateOperationsEmployerVerification(
  employerId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOperationsEmployerVerificationInput) =>
      updateOperationsEmployerVerification(employerId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_QUERY_KEY,
      });
    },
  });
}

export function useUpdateOperationsEmployerStatus(
  employerId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOperationsEmployerStatusInput) =>
      updateOperationsEmployerStatus(employerId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_QUERY_KEY,
      });
    },
  });
}
