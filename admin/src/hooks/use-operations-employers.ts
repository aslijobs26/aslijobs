import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  completeOperationsEmployer,
  deleteOperationsEmployer,
  exportOperationsEmployersCsv,
  fetchOperationsEmployerDetail,
  fetchOperationsEmployerJobs,
  fetchOperationsEmployers,
  fetchOperationsEmployersAnalytics,
  registerOperationsEmployer,
  resendOperationsEmployerOtp,
  updateOperationsEmployerStatus,
  updateOperationsEmployerVerification,
  verifyOperationsEmployerOtp,
} from "../services/operations-employers.service";
import type {
  CompleteOperationsEmployerInput,
  OperationsEmployersAnalyticsParams,
  OperationsEmployersExportParams,
  OperationsEmployersListParams,
  RegisterOperationsEmployerInput,
  UpdateOperationsEmployerStatusInput,
  UpdateOperationsEmployerVerificationInput,
} from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { OPERATIONS_JOBS_QUERY_KEY } from "./use-operations-jobs";
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

export function useRegisterOperationsEmployer() {
  return useMutation({
    mutationFn: (payload: RegisterOperationsEmployerInput) =>
      registerOperationsEmployer(payload),
  });
}

export function useResendOperationsEmployerOtp() {
  return useMutation({
    mutationFn: (employerId: string) => resendOperationsEmployerOtp(employerId),
  });
}

export function useVerifyOperationsEmployerOtp() {
  return useMutation({
    mutationFn: (input: { employerId: string; otp: string }) =>
      verifyOperationsEmployerOtp(input.employerId, input.otp),
  });
}

export function useCompleteOperationsEmployer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      employerId: string;
      payload: CompleteOperationsEmployerInput;
      imageFile?: File | null;
      documentFile: File;
    }) =>
      completeOperationsEmployer(input.employerId, input.payload, {
        imageFile: input.imageFile,
        documentFile: input.documentFile,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
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

export function useDeleteOperationsEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employerId: string) => deleteOperationsEmployer(employerId),
    onSuccess: async (_data, employerId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_EMPLOYERS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_EMPLOYERS_ANALYTICS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_VERIFICATIONS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_REGISTRATION_AWARENESS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: OPERATIONS_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: [...OPERATIONS_EMPLOYERS_QUERY_KEY, "detail", employerId],
        }),
      ]);
    },
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
