import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  assignOperationsWork,
  bulkAssignOperationsWork,
  claimOperationsWork,
  createOperationsWork,
  exportOperationsWork,
  fetchEligibleWorkAssignees,
  fetchEligibleWorkDepartments,
  fetchOperationsWorkAnalytics,
  fetchOperationsWorkDetail,
  fetchOperationsWorkList,
  fetchOperationsWorkPerformance,
  updateOperationsWorkDue,
  updateOperationsWorkPriority,
  updateOperationsWorkStatus,
  type CreateOperationsWorkInput,
} from "../services/operations-work.service";
import type {
  AssignWorkInput,
  OperationsWorkListParams,
  UpdateWorkStatusInput,
  WorkItemPriority,
} from "../types/operations-work";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_WORK_QUERY_KEY = ["operations", "work"] as const;
export const OPERATIONS_WORK_ANALYTICS_KEY = [
  "operations",
  "work",
  "analytics",
] as const;
export const OPERATIONS_WORK_LIST_KEY = ["operations", "work", "list"] as const;
export const OPERATIONS_WORK_PERFORMANCE_KEY = [
  "operations",
  "work",
  "performance",
] as const;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isOperationsSessionTransientError(error);
}

function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

export function invalidateOperationsWorkQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: OPERATIONS_WORK_QUERY_KEY });
}

export function useOperationsWorkAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: OPERATIONS_WORK_ANALYTICS_KEY,
    queryFn: fetchOperationsWorkAnalytics,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    retryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsWorkList(
  params: OperationsWorkListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_WORK_LIST_KEY, params],
    queryFn: () => fetchOperationsWorkList(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    retry: shouldRetry,
    retryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsWorkDetail(
  id: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_WORK_QUERY_KEY, "detail", id],
    queryFn: () => fetchOperationsWorkDetail(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
    retry: shouldRetry,
    retryDelay,
  });
}

export function useOperationsWorkPerformance(
  params?: { from?: string; to?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_WORK_PERFORMANCE_KEY, params ?? {}],
    queryFn: () => fetchOperationsWorkPerformance(params),
    staleTime: 30_000,
    retry: shouldRetry,
    retryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useEligibleWorkAssignees(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...OPERATIONS_WORK_QUERY_KEY, "eligible-assignees"],
    queryFn: fetchEligibleWorkAssignees,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
    retry: shouldRetry,
    retryDelay,
  });
}

export function useEligibleWorkDepartments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...OPERATIONS_WORK_QUERY_KEY, "eligible-departments"],
    queryFn: fetchEligibleWorkDepartments,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
    retry: shouldRetry,
    retryDelay,
  });
}

export function useCreateOperationsWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperationsWorkInput) =>
      createOperationsWork(input),
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useAssignOperationsWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: AssignWorkInput;
    }) => assignOperationsWork(id, input),
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useBulkAssignOperationsWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkAssignOperationsWork,
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useClaimOperationsWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      expectedRevision,
    }: {
      id: string;
      expectedRevision: number;
    }) => claimOperationsWork(id, expectedRevision),
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useUpdateOperationsWorkStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateWorkStatusInput;
    }) => updateOperationsWorkStatus(id, input),
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useUpdateOperationsWorkPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      priority,
      expectedRevision,
    }: {
      id: string;
      priority: WorkItemPriority;
      expectedRevision: number;
    }) => updateOperationsWorkPriority(id, priority, expectedRevision),
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useUpdateOperationsWorkDue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dueAt,
      expectedRevision,
    }: {
      id: string;
      dueAt: string | null;
      expectedRevision: number;
    }) => updateOperationsWorkDue(id, dueAt, expectedRevision),
    onSuccess: () => invalidateOperationsWorkQueries(queryClient),
  });
}

export function useExportOperationsWork() {
  return useMutation({
    mutationFn: exportOperationsWork,
  });
}
