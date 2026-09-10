import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  exportOperationsPlacements,
  fetchOperationsPlacementDetail,
  fetchOperationsPlacementsAnalytics,
  fetchOperationsPlacementsList,
  updateOperationsPlacementJoiningStatus,
} from "../services/operations-placements.service";
import type {
  OperationsPlacementsAnalyticsParams,
  OperationsPlacementsExportParams,
  OperationsPlacementsListParams,
  UpdatePlacementJoiningStatusInput,
} from "../types/operations-placements";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_PLACEMENTS_QUERY_KEY = [
  "operations",
  "placements",
] as const;

export const OPERATIONS_PLACEMENTS_ANALYTICS_QUERY_KEY = [
  "operations",
  "placements",
  "analytics",
] as const;

export const OPERATIONS_PLACEMENTS_LIST_QUERY_KEY = [
  "operations",
  "placements",
  "list",
] as const;

function shouldRetryPlacementsQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 3) {
    return false;
  }
  return isOperationsSessionTransientError(error);
}

function placementsRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

function invalidatePlacementsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_PLACEMENTS_LIST_QUERY_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_PLACEMENTS_ANALYTICS_QUERY_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: OPERATIONS_PLACEMENTS_QUERY_KEY,
  });
}

export function useOperationsPlacementsAnalytics(
  params: OperationsPlacementsAnalyticsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_PLACEMENTS_ANALYTICS_QUERY_KEY, params],
    queryFn: () => fetchOperationsPlacementsAnalytics(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryPlacementsQuery,
    retryDelay: placementsRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsPlacementsList(
  params: OperationsPlacementsListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_PLACEMENTS_LIST_QUERY_KEY, params],
    queryFn: () => fetchOperationsPlacementsList(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryPlacementsQuery,
    retryDelay: placementsRetryDelay,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOperationsPlacementDetail(placementId: string | undefined) {
  return useQuery({
    queryKey: [...OPERATIONS_PLACEMENTS_QUERY_KEY, "detail", placementId],
    queryFn: () => fetchOperationsPlacementDetail(placementId!),
    enabled: Boolean(placementId),
    staleTime: 30_000,
    retry: shouldRetryPlacementsQuery,
    retryDelay: placementsRetryDelay,
  });
}

export function useExportOperationsPlacements() {
  return useMutation({
    mutationFn: (params: OperationsPlacementsExportParams) =>
      exportOperationsPlacements(params),
  });
}

export function useUpdateOperationsPlacementJoining(
  placementId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePlacementJoiningStatusInput) =>
      updateOperationsPlacementJoiningStatus(placementId!, payload),
    onSuccess: () => {
      invalidatePlacementsQueries(queryClient);
    },
  });
}
