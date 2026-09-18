import { apiClient } from "./api-client";
import type {
  CreateOperationsOpsTeamInput,
  OperationsOpsTeam,
  OperationsOpsTeamListParams,
  OperationsOpsTeamListResult,
  OperationsOpsTeamMember,
  OperationsOpsTeamMetrics,
  OperationsOpsTeamWorkSummary,
  UpdateOperationsOpsTeamInput,
} from "../types/operations-ops-teams";

const BASE = "/operations/teams";

export async function fetchOperationsOpsTeamMetrics(): Promise<OperationsOpsTeamMetrics> {
  const response = await apiClient.get<{ data: OperationsOpsTeamMetrics }>(
    `${BASE}/metrics`,
  );
  return response.data.data;
}

export async function fetchOperationsOpsTeams(
  params: OperationsOpsTeamListParams,
): Promise<OperationsOpsTeamListResult> {
  const response = await apiClient.get<{ data: OperationsOpsTeamListResult }>(
    BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        status: params.status || "active",
        departmentId: params.departmentId || undefined,
        orgUnitId: params.orgUnitId || undefined,
        regionId: params.regionId || undefined,
        stateId: params.stateId || undefined,
        cityId: params.cityId || undefined,
        leadUserId: params.leadUserId || undefined,
      },
    },
  );
  return response.data.data;
}

export async function fetchOperationsOpsTeam(
  teamId: string,
): Promise<OperationsOpsTeam> {
  const response = await apiClient.get<{ data: OperationsOpsTeam }>(
    `${BASE}/${encodeURIComponent(teamId)}`,
  );
  return response.data.data;
}

export async function createOperationsOpsTeam(
  input: CreateOperationsOpsTeamInput,
): Promise<OperationsOpsTeam> {
  const response = await apiClient.post<{ data: OperationsOpsTeam }>(BASE, input);
  return response.data.data;
}

export async function updateOperationsOpsTeam(
  teamId: string,
  input: UpdateOperationsOpsTeamInput,
): Promise<OperationsOpsTeam> {
  const response = await apiClient.patch<{ data: OperationsOpsTeam }>(
    `${BASE}/${encodeURIComponent(teamId)}`,
    input,
  );
  return response.data.data;
}

export async function archiveOperationsOpsTeam(
  teamId: string,
  expectedRevision: number,
): Promise<OperationsOpsTeam> {
  const response = await apiClient.delete<{ data: OperationsOpsTeam }>(
    `${BASE}/${encodeURIComponent(teamId)}`,
    { data: { expectedRevision } },
  );
  return response.data.data;
}

export async function fetchOperationsOpsTeamMembers(
  teamId: string,
  params?: { page?: number; limit?: number; search?: string; status?: string },
): Promise<{ members: OperationsOpsTeamMember[]; pagination: OperationsOpsTeamListResult["pagination"] }> {
  const response = await apiClient.get<{
    data: {
      members: OperationsOpsTeamMember[];
      pagination: OperationsOpsTeamListResult["pagination"];
    };
  }>(`${BASE}/${encodeURIComponent(teamId)}/members`, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      search: params?.search || undefined,
      status: params?.status || "active",
    },
  });
  return response.data.data;
}

export async function addOperationsOpsTeamMember(
  teamId: string,
  userId: string,
  expectedRevision: number,
): Promise<OperationsOpsTeam> {
  const response = await apiClient.post<{ data: OperationsOpsTeam }>(
    `${BASE}/${encodeURIComponent(teamId)}/members`,
    { userId, expectedRevision },
  );
  return response.data.data;
}

export async function removeOperationsOpsTeamMember(
  teamId: string,
  memberId: string,
  expectedRevision: number,
  replacementLeadUserId?: string,
): Promise<OperationsOpsTeam> {
  const response = await apiClient.post<{ data: OperationsOpsTeam }>(
    `${BASE}/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}/remove`,
    { expectedRevision, replacementLeadUserId: replacementLeadUserId ?? "" },
  );
  return response.data.data;
}

export async function fetchOperationsOpsTeamWorkSummary(
  teamId: string,
): Promise<OperationsOpsTeamWorkSummary> {
  const response = await apiClient.get<{ data: OperationsOpsTeamWorkSummary }>(
    `${BASE}/${encodeURIComponent(teamId)}/work-summary`,
  );
  return response.data.data;
}
