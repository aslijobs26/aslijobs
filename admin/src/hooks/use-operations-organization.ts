import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationsOrgSubUnit,
  createOperationsOrgUnit,
  fetchOperationsOrgOverview,
  fetchOperationsOrgPeople,
  fetchOperationsOrgTree,
  fetchOperationsOrgUnit,
  updateOperationsOrgUnit,
} from "../services/operations-organization.service";
import type {
  CreateOperationsOrgUnitInput,
  UpdateOperationsOrgUnitInput,
} from "../types/operations-organization";
import { OPERATIONS_AUTH_QUERY_KEY } from "../utils/operations-session";
import {
  operationsQueryRetryDelay,
  shouldRetryOperationsQuery,
} from "../utils/operations-session-errors";

export const OPERATIONS_ORGANIZATION_QUERY_KEY = [
  "operations",
  "organization",
] as const;

export function useOperationsOrgTree(params?: {
  search?: string;
  status?: "active" | "archived" | "all";
  scopeId?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: [...OPERATIONS_ORGANIZATION_QUERY_KEY, "tree", queryParams],
    queryFn: () => fetchOperationsOrgTree(queryParams),
    enabled,
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOrgUnit(
  unitId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_ORGANIZATION_QUERY_KEY, "unit", unitId],
    queryFn: () => fetchOperationsOrgUnit(unitId!),
    enabled: Boolean(unitId) && (options?.enabled ?? true),
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOrgOverview(
  unitId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_ORGANIZATION_QUERY_KEY, "overview", unitId],
    queryFn: () => fetchOperationsOrgOverview(unitId!),
    enabled: Boolean(unitId) && (options?.enabled ?? true),
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOrgPeople(
  unitId: string | null,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "inactive" | "suspended" | "all";
    enabled?: boolean;
  },
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: [
      ...OPERATIONS_ORGANIZATION_QUERY_KEY,
      "people",
      unitId,
      queryParams,
    ],
    queryFn: () => fetchOperationsOrgPeople(unitId!, queryParams),
    enabled: Boolean(unitId) && enabled,
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

async function invalidateOrganizationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: OPERATIONS_ORGANIZATION_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: OPERATIONS_AUTH_QUERY_KEY,
    }),
  ]);
}

export function useCreateOperationsOrgUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperationsOrgUnitInput) =>
      createOperationsOrgUnit(input),
    onSuccess: async () => {
      await invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useCreateOperationsOrgSubUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      parentId,
      input,
    }: {
      parentId: string;
      input: Omit<CreateOperationsOrgUnitInput, "parentId">;
    }) => createOperationsOrgSubUnit(parentId, input),
    onSuccess: async () => {
      await invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUpdateOperationsOrgUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      unitId,
      input,
    }: {
      unitId: string;
      input: UpdateOperationsOrgUnitInput;
    }) => updateOperationsOrgUnit(unitId, input),
    onSuccess: async () => {
      await invalidateOrganizationQueries(queryClient);
    },
  });
}
