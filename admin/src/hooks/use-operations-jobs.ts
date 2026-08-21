import { useQuery } from "@tanstack/react-query";
import { fetchOperationsJobs } from "../services/operations-jobs.service";
import type { OperationsJobsListParams } from "../types/operations-jobs";

export const OPERATIONS_JOBS_QUERY_KEY = ["operations", "jobs"] as const;

export function useOperationsJobs(params: OperationsJobsListParams) {
  return useQuery({
    queryKey: [...OPERATIONS_JOBS_QUERY_KEY, params],
    queryFn: () => fetchOperationsJobs(params),
    placeholderData: (previous) => previous,
  });
}
