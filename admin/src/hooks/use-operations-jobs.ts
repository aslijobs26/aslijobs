import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOperationsJobs,
  updateOperationsJobStatus,
} from "../services/operations-jobs.service";
import type {
  OperationsJobsListParams,
  OperationsJobStatusAction,
} from "../types/operations-jobs";
import { OPERATIONS_JOB_DETAIL_QUERY_KEY } from "./use-operations-job-detail";

export const OPERATIONS_JOBS_QUERY_KEY = ["operations", "jobs"] as const;

export function useOperationsJobs(params: OperationsJobsListParams) {
  return useQuery({
    queryKey: [...OPERATIONS_JOBS_QUERY_KEY, params],
    queryFn: () => fetchOperationsJobs(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useUpdateOperationsJobStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      action,
      reason,
    }: {
      jobId: string;
      action: OperationsJobStatusAction;
      reason?: string;
    }) => updateOperationsJobStatus(jobId, action, reason),
    onSuccess: async (_data, { jobId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: OPERATIONS_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: [...OPERATIONS_JOB_DETAIL_QUERY_KEY, jobId],
        }),
      ]);
    },
  });
}
