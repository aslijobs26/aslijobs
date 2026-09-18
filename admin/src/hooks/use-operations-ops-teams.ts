import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addOperationsOpsTeamMember,
  archiveOperationsOpsTeam,
  createOperationsOpsTeam,
  fetchOperationsOpsTeam,
  fetchOperationsOpsTeamMembers,
  fetchOperationsOpsTeamMetrics,
  fetchOperationsOpsTeams,
  fetchOperationsOpsTeamWorkSummary,
  removeOperationsOpsTeamMember,
  updateOperationsOpsTeam,
} from "../services/operations-ops-teams.service";
import type {
  CreateOperationsOpsTeamInput,
  OperationsOpsTeamListParams,
  UpdateOperationsOpsTeamInput,
} from "../types/operations-ops-teams";
import {
  operationsQueryRetryDelay,
  shouldRetryOperationsQuery,
} from "../utils/operations-session-errors";
import { OPERATIONS_ORGANIZATION_QUERY_KEY } from "./use-operations-organization";
import { OPERATIONS_TEAM_QUERY_KEY } from "./use-operations-team";
import { OPERATIONS_DEPARTMENTS_QUERY_KEY } from "./use-operations-departments";

export const OPERATIONS_OPS_TEAMS_QUERY_KEY = ["operations", "teams"] as const;

async function invalidateTeamCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: OPERATIONS_OPS_TEAMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: OPERATIONS_ORGANIZATION_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: OPERATIONS_TEAM_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: OPERATIONS_DEPARTMENTS_QUERY_KEY }),
  ]);
}

export function useOperationsOpsTeamMetrics() {
  return useQuery({
    queryKey: [...OPERATIONS_OPS_TEAMS_QUERY_KEY, "metrics"],
    queryFn: fetchOperationsOpsTeamMetrics,
    staleTime: 30_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOpsTeams(params: OperationsOpsTeamListParams) {
  return useQuery({
    queryKey: [...OPERATIONS_OPS_TEAMS_QUERY_KEY, "list", params],
    queryFn: () => fetchOperationsOpsTeams(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOpsTeam(teamId: string | null) {
  return useQuery({
    queryKey: [...OPERATIONS_OPS_TEAMS_QUERY_KEY, "detail", teamId],
    queryFn: () => fetchOperationsOpsTeam(teamId!),
    enabled: Boolean(teamId),
    staleTime: 15_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOpsTeamMembers(
  teamId: string | null,
  params?: { page?: number; limit?: number; search?: string; status?: string },
) {
  return useQuery({
    queryKey: [...OPERATIONS_OPS_TEAMS_QUERY_KEY, "members", teamId, params],
    queryFn: () => fetchOperationsOpsTeamMembers(teamId!, params),
    enabled: Boolean(teamId),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useOperationsOpsTeamWorkSummary(teamId: string | null) {
  return useQuery({
    queryKey: [...OPERATIONS_OPS_TEAMS_QUERY_KEY, "work", teamId],
    queryFn: () => fetchOperationsOpsTeamWorkSummary(teamId!),
    enabled: Boolean(teamId),
    staleTime: 15_000,
    retry: shouldRetryOperationsQuery,
    retryDelay: operationsQueryRetryDelay,
  });
}

export function useCreateOperationsOpsTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperationsOpsTeamInput) =>
      createOperationsOpsTeam(input),
    onSuccess: async () => {
      await invalidateTeamCaches(queryClient);
    },
  });
}

export function useUpdateOperationsOpsTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      input,
    }: {
      teamId: string;
      input: UpdateOperationsOpsTeamInput;
    }) => updateOperationsOpsTeam(teamId, input),
    onSuccess: async () => {
      await invalidateTeamCaches(queryClient);
    },
  });
}

export function useArchiveOperationsOpsTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      expectedRevision,
    }: {
      teamId: string;
      expectedRevision: number;
    }) => archiveOperationsOpsTeam(teamId, expectedRevision),
    onSuccess: async () => {
      await invalidateTeamCaches(queryClient);
    },
  });
}

export function useAddOperationsOpsTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      expectedRevision,
    }: {
      teamId: string;
      userId: string;
      expectedRevision: number;
    }) => addOperationsOpsTeamMember(teamId, userId, expectedRevision),
    onSuccess: async () => {
      await invalidateTeamCaches(queryClient);
    },
  });
}

export function useRemoveOperationsOpsTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      memberId,
      expectedRevision,
      replacementLeadUserId,
    }: {
      teamId: string;
      memberId: string;
      expectedRevision: number;
      replacementLeadUserId?: string;
    }) =>
      removeOperationsOpsTeamMember(
        teamId,
        memberId,
        expectedRevision,
        replacementLeadUserId,
      ),
    onSuccess: async () => {
      await invalidateTeamCaches(queryClient);
    },
  });
}
