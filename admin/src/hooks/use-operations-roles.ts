import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveOperationsRole,
  createOperationsRole,
  fetchOperationsPermissionCatalog,
  fetchOperationsRoleDetail,
  fetchOperationsRoleHierarchy,
  fetchOperationsRoles,
  restoreOperationsRole,
  updateOperationsRole,
} from "../services/operations-roles.service";
import type { CreateOperationsRoleInput } from "../types/operations-team";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_ROLES_QUERY_KEY = ["operations", "roles"] as const;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isOperationsSessionTransientError(error);
}

export function useOperationsRoles(params?: {
  search?: string;
  status?: "active" | "archived" | "all";
}) {
  return useQuery({
    queryKey: [...OPERATIONS_ROLES_QUERY_KEY, "list", params],
    queryFn: () => fetchOperationsRoles(params),
    staleTime: 30_000,
    retry: shouldRetry,
  });
}

export function useOperationsRoleHierarchy() {
  return useQuery({
    queryKey: [...OPERATIONS_ROLES_QUERY_KEY, "hierarchy"],
    queryFn: fetchOperationsRoleHierarchy,
    staleTime: 30_000,
    retry: shouldRetry,
  });
}

export function useOperationsPermissionCatalog() {
  return useQuery({
    queryKey: [...OPERATIONS_ROLES_QUERY_KEY, "catalog"],
    queryFn: fetchOperationsPermissionCatalog,
    staleTime: 60_000,
    retry: shouldRetry,
  });
}

export function useOperationsRoleDetail(roleId: string | undefined) {
  return useQuery({
    queryKey: [...OPERATIONS_ROLES_QUERY_KEY, "detail", roleId],
    queryFn: () => fetchOperationsRoleDetail(roleId!),
    enabled: Boolean(roleId),
    staleTime: 15_000,
    retry: shouldRetry,
  });
}

export function useCreateOperationsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperationsRoleInput) => createOperationsRole(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_ROLES_QUERY_KEY });
    },
  });
}

export function useUpdateOperationsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      input,
    }: {
      roleId: string;
      input: CreateOperationsRoleInput;
    }) => updateOperationsRole(roleId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_ROLES_QUERY_KEY });
    },
  });
}

export function useArchiveOperationsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      reassignRoleId,
    }: {
      roleId: string;
      reassignRoleId?: string;
    }) => archiveOperationsRole(roleId, reassignRoleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_ROLES_QUERY_KEY });
    },
  });
}

export function useRestoreOperationsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => restoreOperationsRole(roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_ROLES_QUERY_KEY });
    },
  });
}
