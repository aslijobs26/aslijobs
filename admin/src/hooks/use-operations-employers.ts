import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createOperationsEmployer,
  exportOperationsEmployersCsv,
  fetchOperationsEmployerDetail,
  fetchOperationsEmployerJobs,
  fetchOperationsEmployers,
  fetchOperationsEmployersAnalytics,
  updateOperationsEmployerStatus,
  updateOperationsEmployerVerification,
} from "../services/operations-employers.service";
import type {
  CreateOperationsEmployerInput,
  OperationsEmployersAnalyticsParams,
  OperationsEmployersExportParams,
  OperationsEmployersListParams,
  UpdateOperationsEmployerStatusInput,
  UpdateOperationsEmployerVerificationInput,
} from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY } from "./use-operations-registration-awareness";
import { OPERATIONS_VERIFICATIONS_QUERY_KEY } from "./use-operations-verifications";

export const OPERATIONS_EMPLOYERS_QUERY_KEY = [
  "operations",
  "employers",
] as const;

export const OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY = [
  "operations",
  "employers",
  "analytics",
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

export function useOperationsEmployers(
  params: OperationsEmployersListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_EMPLOYERS_QUERY_KEY, params],
    queryFn: () => fetchOperationsEmployers(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryEmployersQuery,
    retryDelay: employersRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsEmployersAnalytics(
  params: OperationsEmployersAnalyticsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY, params],
    queryFn: () => fetchOperationsEmployersAnalytics(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryEmployersQuery,
    retryDelay: employersRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
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

export function useCreateOperationsEmployer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOperationsEmployerInput) =>
      createOperationsEmployer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY,
      });
    },
  });
}

export function useExportOperationsEmployersCsv() {
  return useMutation({
    mutationFn: (params: OperationsEmployersExportParams) =>
      exportOperationsEmployersCsv(params),
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
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_VERIFICATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
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
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY,
      });
    },
  });
}
