import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  exportOperationsVerifications,
  fetchOperationsVerificationDetail,
  fetchOperationsVerificationsAnalytics,
  fetchOperationsVerificationsList,
  requestOperationsVerificationDocuments,
  updateOperationsVerification,
} from "../services/operations-verifications.service";
import type {
  OperationsVerificationsAnalyticsParams,
  OperationsVerificationsExportParams,
  OperationsVerificationsListParams,
  RequestOperationsVerificationDocumentsInput,
  UpdateOperationsVerificationInput,
} from "../types/operations-verifications";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY } from "./use-operations-registration-awareness";

export const OPERATIONS_VERIFICATIONS_QUERY_KEY = [
  "operations",
  "verifications",
] as const;

export const OPERATIONS_VERIFICATIONS_ANALYTICS_QUERY_KEY = [
  "operations",
  "verifications",
  "analytics",
] as const;

export const OPERATIONS_VERIFICATIONS_LIST_QUERY_KEY = [
  "operations",
  "verifications",
  "list",
] as const;

function shouldRetryVerificationsQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 3) {
    return false;
  }
  return isOperationsSessionTransientError(error);
}

function verificationsRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

function invalidateVerificationsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_VERIFICATIONS_LIST_QUERY_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_VERIFICATIONS_ANALYTICS_QUERY_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_VERIFICATIONS_QUERY_KEY,
  });
  // Keep sidebar Verifications badge in sync after approve/reject/request-docs.
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
  });
}

export function useOperationsVerificationsAnalytics(
  params: OperationsVerificationsAnalyticsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_VERIFICATIONS_ANALYTICS_QUERY_KEY, params],
    queryFn: () => fetchOperationsVerificationsAnalytics(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryVerificationsQuery,
    retryDelay: verificationsRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsVerificationsList(
  params: OperationsVerificationsListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_VERIFICATIONS_LIST_QUERY_KEY, params],
    queryFn: () => fetchOperationsVerificationsList(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryVerificationsQuery,
    retryDelay: verificationsRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsVerificationDetail(
  verificationId: string | undefined,
) {
  return useQuery({
    queryKey: [
      ...OPERATIONS_VERIFICATIONS_QUERY_KEY,
      "detail",
      verificationId,
    ],
    queryFn: () => fetchOperationsVerificationDetail(verificationId!),
    enabled: Boolean(verificationId),
    staleTime: 30_000,
    retry: shouldRetryVerificationsQuery,
    retryDelay: verificationsRetryDelay,
  });
}

export function useExportOperationsVerifications() {
  return useMutation({
    mutationFn: (params: OperationsVerificationsExportParams) =>
      exportOperationsVerifications(params),
  });
}

export function useUpdateOperationsVerification(
  verificationId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOperationsVerificationInput) =>
      updateOperationsVerification(verificationId!, payload),
    onSuccess: () => {
      invalidateVerificationsQueries(queryClient);
    },
  });
}

export function useRequestOperationsVerificationDocuments(
  verificationId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RequestOperationsVerificationDocumentsInput) =>
      requestOperationsVerificationDocuments(verificationId!, payload),
    onSuccess: () => {
      invalidateVerificationsQueries(queryClient);
    },
  });
}
