import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationsDepartment,
  deleteOperationsDepartment,
  fetchOperationsDepartment,
  fetchOperationsDepartmentDependencies,
  fetchOperationsDepartmentMetrics,
  fetchOperationsDepartments,
  updateOperationsDepartment,
} from "../services/operations-departments.service";
import type { OperationsDepartmentListParams } from "../types/operations-team";
import {
  operationsQueryRetryDelay,
  shouldRetryOperationsQuery,
} from "../utils/operations-session-errors";
import { OPERATIONS_AUTH_QUERY_KEY } from "../utils/operations-session";
import { OPERATIONS_ORGANIZATION_QUERY_KEY } from "./use-operations-organization";
import { OPERATIONS_WORK_QUERY_KEY } from "./use-operations-work";

export const OPERATIONS_DEPARTMENTS_QUERY_KEY = [
  "operations",
  "departments",
] as const;

async function invalidateDepartmentRelatedCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: OPERATIONS_DEPARTMENTS_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: OPERATIONS_ORGANIZATION_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: OPERATIONS_WORK_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: OPERATIONS_AUTH_QUERY_KEY,
    }),
  ]);
}

export function useOperationsDepartments(
  params?: OperationsDepartmentListParams,
) {
  return useQuery({
    queryKey: [...OPERATIONS_DEPARTMENTS_QUERY_KEY, "list", params],
    queryFn: () => fetchOperationsDepartments(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsDepartmentMetrics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...OPERATIONS_DEPARTMENTS_QUERY_KEY, "metrics"],
    queryFn: fetchOperationsDepartmentMetrics,
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsDepartment(
  departmentId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [...OPERATIONS_DEPARTMENTS_QUERY_KEY, "detail", departmentId],
    queryFn: () => fetchOperationsDepartment(departmentId!),
    enabled: Boolean(departmentId) && enabled,
    staleTime: 15_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsDepartmentDependencies(
  departmentId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...OPERATIONS_DEPARTMENTS_QUERY_KEY,
      "dependencies",
      departmentId,
    ],
    queryFn: () => fetchOperationsDepartmentDependencies(departmentId!),
    enabled: Boolean(departmentId) && enabled,
    staleTime: 5_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useCreateOperationsDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      code?: string;
      description?: string;
    }) => createOperationsDepartment(input),
    onSuccess: async () => {
      await invalidateDepartmentRelatedCaches(queryClient);
    },
  });
}

export function useUpdateOperationsDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      departmentId,
      input,
    }: {
      departmentId: string;
      input: {
        name?: string;
        description?: string;
        status?: "active" | "archived";
        expectedRevision: number;
      };
    }) => updateOperationsDepartment(departmentId, input),
    onSuccess: async () => {
      await invalidateDepartmentRelatedCaches(queryClient);
    },
  });
}

export function useDeleteOperationsDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      departmentId,
      expectedRevision,
    }: {
      departmentId: string;
      expectedRevision: number;
    }) => deleteOperationsDepartment(departmentId, expectedRevision),
    onSuccess: async () => {
      await invalidateDepartmentRelatedCaches(queryClient);
    },
  });
}
