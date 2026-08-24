import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignOperationsJobEmployer,
  createOperationsJobDraft,
  publishOperationsJobDraft,
  updateOperationsJobDraft,
} from "../services/operations-jobs.service";
import { searchOperationsEmployers } from "../services/operations-employers.service";
import type { SaveOperationsJobDraftPayload } from "../types/operations-post-job";
import type { OperationsPublishJobPayload } from "../utils/map-operations-post-job-payload";
import { OPERATIONS_JOBS_QUERY_KEY } from "./use-operations-jobs";
import { OPERATIONS_JOB_DETAIL_QUERY_KEY } from "./use-operations-job-detail";

export const OPERATIONS_EMPLOYERS_QUERY_KEY = ["operations", "employers"] as const;

export function useOperationsEmployersSearch(search: string, enabled = true) {
  return useQuery({
    queryKey: [...OPERATIONS_EMPLOYERS_QUERY_KEY, search],
    queryFn: () => searchOperationsEmployers({ search, limit: 20 }),
    enabled: enabled && search.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useOperationsEmployersList(enabled = true) {
  return useQuery({
    queryKey: [...OPERATIONS_EMPLOYERS_QUERY_KEY, "__all__"],
    queryFn: () => searchOperationsEmployers({ search: "", limit: 50 }),
    enabled,
    staleTime: 60_000,
  });
}

function invalidateJobQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId?: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: OPERATIONS_JOBS_QUERY_KEY }),
    jobId
      ? queryClient.invalidateQueries({
          queryKey: [...OPERATIONS_JOB_DETAIL_QUERY_KEY, jobId],
        })
      : Promise.resolve(),
  ]);
}

export function useCreateOperationsJobDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveOperationsJobDraftPayload) =>
      createOperationsJobDraft(payload),
    onSuccess: async (data) => {
      await invalidateJobQueries(queryClient, data.jobId);
    },
  });
}

export function useUpdateOperationsJobDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      payload,
    }: {
      jobId: string;
      payload: SaveOperationsJobDraftPayload;
    }) => updateOperationsJobDraft(jobId, payload),
    onSuccess: async (data) => {
      await invalidateJobQueries(queryClient, data.jobId);
    },
  });
}

export function useAssignOperationsJobEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      employerId,
    }: {
      jobId: string;
      employerId: string;
    }) => assignOperationsJobEmployer(jobId, employerId),
    onSuccess: async (data) => {
      await invalidateJobQueries(queryClient, data.jobId);
    },
  });
}

export function usePublishOperationsJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      payload,
    }: {
      jobId: string;
      payload: OperationsPublishJobPayload;
    }) => publishOperationsJobDraft(jobId, payload),
    onSuccess: async (data) => {
      await invalidateJobQueries(queryClient, data.jobId);
    },
  });
}
