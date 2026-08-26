import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchOperationsCandidateDetail,
  fetchOperationsCandidates,
} from "../services/operations-candidates.service";
import type { OperationsCandidatesListParams } from "../types/operations-candidates";

export const OPERATIONS_CANDIDATES_QUERY_KEY = [
  "operations",
  "candidates",
] as const;

export function useOperationsCandidates(params: OperationsCandidatesListParams) {
  return useQuery({
    queryKey: [...OPERATIONS_CANDIDATES_QUERY_KEY, params],
    queryFn: () => fetchOperationsCandidates(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
    // Keep filters/search input mounted while the next page of results loads.
    placeholderData: keepPreviousData,
  });
}

export function useOperationsCandidateDetail(
  jobSeekerId: string | undefined,
) {
  return useQuery({
    queryKey: [...OPERATIONS_CANDIDATES_QUERY_KEY, "detail", jobSeekerId],
    queryFn: () => fetchOperationsCandidateDetail(jobSeekerId!),
    enabled: Boolean(jobSeekerId),
  });
}
