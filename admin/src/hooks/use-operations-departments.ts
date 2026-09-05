import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationsDepartment,
  fetchOperationsDepartments,
  updateOperationsDepartment,
} from "../services/operations-departments.service";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_DEPARTMENTS_QUERY_KEY = [
  "operations",
  "departments",
] as const;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isOperationsSessionTransientError(error);
}

export function useOperationsDepartments(params?: {
  search?: string;
  status?: "active" | "archived" | "all";
}) {
  return useQuery({
    queryKey: [...OPERATIONS_DEPARTMENTS_QUERY_KEY, params],
    queryFn: () => fetchOperationsDepartments(params),
    staleTime: 30_000,
    retry: shouldRetry,
  });
}

export function useCreateOperationsDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      createOperationsDepartment(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: OPERATIONS_DEPARTMENTS_QUERY_KEY,
      });
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
      input: { name?: string; description?: string; status?: "active" | "archived" };
    }) => updateOperationsDepartment(departmentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: OPERATIONS_DEPARTMENTS_QUERY_KEY,
      });
    },
  });
}
