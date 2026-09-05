import { apiClient } from "./api-client";
import type {
  CreateOperationsTeamMemberInput,
  OperationsTeamListParams,
  OperationsTeamListResult,
  OperationsTeamMember,
  OperationsTeamOverview,
  UpdateOperationsTeamMemberInput,
} from "../types/operations-team";

const BASE = "/operations/team";

export async function fetchOperationsTeamOverview(): Promise<OperationsTeamOverview> {
  const response = await apiClient.get<{ data: OperationsTeamOverview }>(
    `${BASE}/overview`,
  );
  return response.data.data;
}

export async function fetchOperationsTeamMembers(
  params: OperationsTeamListParams,
): Promise<OperationsTeamListResult> {
  const response = await apiClient.get<{ data: OperationsTeamListResult }>(BASE, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      status: params.status || undefined,
      roleId: params.roleId || undefined,
      departmentId: params.departmentId || undefined,
    },
  });
  return response.data.data;
}

export async function createOperationsTeamMember(
  input: CreateOperationsTeamMemberInput,
): Promise<OperationsTeamMember> {
  const response = await apiClient.post<{ data: OperationsTeamMember }>(BASE, input);
  return response.data.data;
}

export async function updateOperationsTeamMember(
  memberId: string,
  input: UpdateOperationsTeamMemberInput,
): Promise<OperationsTeamMember> {
  const response = await apiClient.patch<{ data: OperationsTeamMember }>(
    `${BASE}/${encodeURIComponent(memberId)}`,
    input,
  );
  return response.data.data;
}

export async function updateOperationsTeamMemberStatus(
  memberId: string,
  status: "active" | "inactive" | "suspended",
  reason?: string,
): Promise<OperationsTeamMember> {
  const response = await apiClient.patch<{ data: OperationsTeamMember }>(
    `${BASE}/${encodeURIComponent(memberId)}/status`,
    { status, reason: reason ?? "" },
  );
  return response.data.data;
}
