import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationsTeamMember,
  fetchOperationsTeamMembers,
  fetchOperationsTeamOverview,
  updateOperationsTeamMember,
  updateOperationsTeamMemberStatus,
} from "../services/operations-team.service";
import type {
  CreateOperationsTeamMemberInput,
  OperationsTeamListParams,
  UpdateOperationsTeamMemberInput,
} from "../types/operations-team";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_TEAM_QUERY_KEY = ["operations", "team"] as const;

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

export function useOperationsTeamMembers(params: OperationsTeamListParams) {
  return useQuery({
    queryKey: [...OPERATIONS_TEAM_QUERY_KEY, "list", params],
    queryFn: () => fetchOperationsTeamMembers(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}

export function useCreateOperationsTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperationsTeamMemberInput) =>
      createOperationsTeamMember(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_TEAM_QUERY_KEY });
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
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_TEAM_QUERY_KEY });
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
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_TEAM_QUERY_KEY });
    },
  });
}
