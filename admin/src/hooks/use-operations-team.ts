import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationsTeamMember,
  deleteOperationsTeamMember,
  fetchOperationsTeamMembers,
  fetchOperationsTeamOverview,
  resendOperationsTeamInvitation,
  updateOperationsTeamMember,
  updateOperationsTeamMemberStatus,
} from "../services/operations-team.service";
import type {
  CreateOperationsTeamMemberInput,
  OperationsTeamListParams,
  UpdateOperationsTeamMemberInput,
} from "../types/operations-team";
import { OPERATIONS_AUTH_QUERY_KEY } from "../utils/operations-session";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";
import { OPERATIONS_ORGANIZATION_QUERY_KEY } from "./use-operations-organization";
import { OPERATIONS_DEPARTMENTS_QUERY_KEY } from "./use-operations-departments";

export const OPERATIONS_TEAM_QUERY_KEY = ["operations", "team"] as const;

async function invalidatePeopleRelatedCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: OPERATIONS_TEAM_QUERY_KEY }),
    // Inline key avoids circular import with use-operations-ops-teams.
    queryClient.invalidateQueries({ queryKey: ["operations", "teams"] }),
    queryClient.invalidateQueries({ queryKey: OPERATIONS_ORGANIZATION_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: OPERATIONS_DEPARTMENTS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: OPERATIONS_AUTH_QUERY_KEY }),
  ]);
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isOperationsSessionTransientError(error);
}

export function useOperationsTeamOverview() {
  return useQuery({
    queryKey: [...OPERATIONS_TEAM_QUERY_KEY, "overview"],
    queryFn: fetchOperationsTeamOverview,
    staleTime: 30_000,
    retry: shouldRetry,
  });
}

export function useOperationsTeamMembers(
  params: OperationsTeamListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_TEAM_QUERY_KEY, "list", params],
    queryFn: () => fetchOperationsTeamMembers(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetry,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateOperationsTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperationsTeamMemberInput) =>
      createOperationsTeamMember(input),
    onSuccess: async () => {
      await invalidatePeopleRelatedCaches(queryClient);
    },
  });
}

export function useUpdateOperationsTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      input,
    }: {
      memberId: string;
      input: UpdateOperationsTeamMemberInput;
    }) => updateOperationsTeamMember(memberId, input),
    onSuccess: async () => {
      await invalidatePeopleRelatedCaches(queryClient);
    },
  });
}

export function useUpdateOperationsTeamMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      status,
      reason,
    }: {
      memberId: string;
      status: "active" | "inactive" | "suspended";
      reason?: string;
    }) => updateOperationsTeamMemberStatus(memberId, status, reason),
    onSuccess: async () => {
      await invalidatePeopleRelatedCaches(queryClient);
    },
  });
}

export function useResendOperationsTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => resendOperationsTeamInvitation(memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_TEAM_QUERY_KEY });
    },
  });
}

export function useDeleteOperationsTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => deleteOperationsTeamMember(memberId),
    onSuccess: async () => {
      await invalidatePeopleRelatedCaches(queryClient);
    },
  });
}
