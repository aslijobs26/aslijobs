import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOperationsOrganizationSettings,
  updateOperationsOrganizationSettings,
} from "../services/operations-organization-settings.service";
import {
  operationsQueryRetryDelay,
  shouldRetryOperationsQuery,
} from "../utils/operations-session-errors";
import { OPERATIONS_ORGANIZATION_QUERY_KEY } from "./use-operations-organization";

export const OPERATIONS_SETTINGS_QUERY_KEY = [
  "operations",
  "settings",
] as const;

export function useOperationsOrganizationSettings() {
  return useQuery({
    queryKey: OPERATIONS_SETTINGS_QUERY_KEY,
    queryFn: fetchOperationsOrganizationSettings,
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useUpdateOperationsOrganizationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOperationsOrganizationSettings,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_SETTINGS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: OPERATIONS_ORGANIZATION_QUERY_KEY,
        }),
      ]);
    },
  });
}
