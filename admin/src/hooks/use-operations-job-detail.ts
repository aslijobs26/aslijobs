import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOperationsJobApplications,
  fetchOperationsJobDetail,
  updateOperationsJobStatus,
} from "../services/operations-jobs.service";
import type {
  OperationsJobApplicationsParams,
  OperationsJobStatusAction,
} from "../types/operations-jobs";
import { OPERATIONS_JOBS_QUERY_KEY } from "./use-operations-jobs";

export const OPERATIONS_JOB_DETAIL_QUERY_KEY = [
  "operations",
  "jobs",
  "detail",
] as const;

export function useOperationsJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: [...OPERATIONS_JOB_DETAIL_QUERY_KEY, jobId],
    queryFn: () => fetchOperationsJobDetail(jobId!),
    enabled: Boolean(jobId),
  });
}

export function useOperationsJobApplications(
  jobId: string | undefined,
  params: OperationsJobApplicationsParams = {},
) {
  return useQuery({
    queryKey: [...OPERATIONS_JOB_DETAIL_QUERY_KEY, jobId, "applications", params],
    queryFn: () => fetchOperationsJobApplications(jobId!, params),
    enabled: Boolean(jobId),
  });
}

export function useUpdateOperationsJobStatus(jobId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: OperationsJobStatusAction) =>
      updateOperationsJobStatus(jobId!, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...OPERATIONS_JOB_DETAIL_QUERY_KEY, jobId],
        }),
        queryClient.invalidateQueries({ queryKey: OPERATIONS_JOBS_QUERY_KEY }),
      ]);
    },
  });
}
