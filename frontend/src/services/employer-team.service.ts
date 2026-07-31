import { apiClient } from "@/services/api-client";
import type {
  CreateDepartmentPayload,
  CreateRolePayload,
  DepartmentDetails,
  DepartmentListItem,
  DepartmentsListResponse,
  InviteMemberPayload,
  ListDepartmentsParams,
  ListMembersParams,
  ListRolesParams,
  MembersListResponse,
  PermissionMatrixMeta,
  RolesListResponse,
  TeamMemberDetails,
  TeamMemberListItem,
  TeamMemberOption,
  TeamRoleDetails,
  TeamRoleListItem,
  TeamRoleSummary,
  TeamSidebarData,
  TeamStats,
  UpdateDepartmentPayload,
  UpdateMemberPayload,
  UpdateRolePayload,
} from "@/types/employer-team";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

function cleanParams(
  params: Record<string, string | number | undefined>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as Record<string, string | number>;
}

export async function fetchTeamStats() {
  const response = await apiClient.get<ApiSuccess<TeamStats>>("/team/stats");
  return response.data.data;
}

export async function fetchTeamSidebar() {
  const response = await apiClient.get<ApiSuccess<TeamSidebarData>>(
    "/team/sidebar",
  );
  return response.data.data;
}

export async function fetchTeamRoles() {
  const response = await apiClient.get<
    ApiSuccess<{ roles: TeamRoleSummary[] }>
  >("/team/roles");
  return response.data.data.roles;
}

export async function fetchDepartments(params: ListDepartmentsParams = {}) {
  const response = await apiClient.get<ApiSuccess<DepartmentsListResponse>>(
    "/team/departments",
    {
      params: cleanParams({
        search: params.search,
        status: params.status,
        headMemberId: params.headMemberId,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
        memberCountMin: params.memberCountMin,
        memberCountMax: params.memberCountMax,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      }),
    },
  );
  return response.data.data;
}

export async function fetchDepartment(departmentId: string) {
  const response = await apiClient.get<ApiSuccess<DepartmentListItem>>(
    `/team/departments/${departmentId}`,
  );
  return response.data.data;
}

export async function fetchDepartmentDetails(departmentId: string) {
  const response = await apiClient.get<ApiSuccess<DepartmentDetails>>(
    `/team/departments/${departmentId}/details`,
  );
  return response.data.data;
}

export async function createDepartment(payload: CreateDepartmentPayload) {
  const response = await apiClient.post<ApiSuccess<DepartmentListItem>>(
    "/team/departments",
    payload,
  );
  return response.data.data;
}

export async function updateDepartment(
  departmentId: string,
  payload: UpdateDepartmentPayload,
) {
  const response = await apiClient.patch<ApiSuccess<DepartmentListItem>>(
    `/team/departments/${departmentId}`,
    payload,
  );
  return response.data.data;
}

export async function deactivateDepartment(departmentId: string) {
  const response = await apiClient.post<ApiSuccess<DepartmentListItem>>(
    `/team/departments/${departmentId}/deactivate`,
  );
  return response.data.data;
}

export async function deleteDepartment(departmentId: string) {
  const response = await apiClient.delete<ApiSuccess<{ id: string }>>(
    `/team/departments/${departmentId}`,
  );
  return response.data.data;
}

export async function fetchTeamMemberOptions(params?: {
  status?: "active" | "inactive" | "invited";
  search?: string;
}) {
  const response = await apiClient.get<
    ApiSuccess<{ members: TeamMemberOption[] }>
  >("/team/members/options", {
    params: cleanParams({
      status: params?.status ?? "active",
      search: params?.search,
    }),
  });
  return response.data.data.members;
}

export async function fetchTeamMembers(params: ListMembersParams = {}) {
  const response = await apiClient.get<ApiSuccess<MembersListResponse>>(
    "/team/members",
    {
      params: cleanParams({
        search: params.search,
        departmentId: params.departmentId,
        roleId: params.roleId,
        status: params.status,
        invitationStatus: params.invitationStatus,
        joinedFrom: params.joinedFrom,
        joinedTo: params.joinedTo,
        lastActiveFrom: params.lastActiveFrom,
        lastActiveTo: params.lastActiveTo,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      }),
    },
  );
  return response.data.data;
}

export async function fetchTeamMember(memberId: string) {
  const response = await apiClient.get<ApiSuccess<TeamMemberDetails>>(
    `/team/members/${memberId}`,
  );
  return response.data.data;
}

export async function inviteTeamMember(payload: InviteMemberPayload) {
  const response = await apiClient.post<
    ApiSuccess<{ member: TeamMemberListItem }>
  >("/team/members/invite", payload);
  return response.data.data.member;
}

export async function updateTeamMember(
  memberId: string,
  payload: UpdateMemberPayload,
) {
  const response = await apiClient.patch<ApiSuccess<TeamMemberListItem>>(
    `/team/members/${memberId}`,
    payload,
  );
  return response.data.data;
}

export async function transferTeamMemberDepartment(
  memberId: string,
  departmentId: string,
) {
  const response = await apiClient.post<ApiSuccess<TeamMemberListItem>>(
    `/team/members/${memberId}/transfer-department`,
    { departmentId },
  );
  return response.data.data;
}

export async function changeTeamMemberRole(memberId: string, roleId: string) {
  const response = await apiClient.post<ApiSuccess<TeamMemberListItem>>(
    `/team/members/${memberId}/change-role`,
    { roleId },
  );
  return response.data.data;
}

export async function activateTeamMember(memberId: string) {
  const response = await apiClient.post<ApiSuccess<TeamMemberListItem>>(
    `/team/members/${memberId}/activate`,
  );
  return response.data.data;
}

export async function deactivateTeamMember(memberId: string) {
  const response = await apiClient.post<ApiSuccess<TeamMemberListItem>>(
    `/team/members/${memberId}/deactivate`,
  );
  return response.data.data;
}

export async function removeTeamMember(memberId: string) {
  const response = await apiClient.delete<ApiSuccess<{ id: string }>>(
    `/team/members/${memberId}`,
  );
  return response.data.data;
}

export async function resendTeamInvitation(memberId: string) {
  const response = await apiClient.post<ApiSuccess<unknown>>(
    `/team/members/${memberId}/resend-invitation`,
  );
  return response.data.data;
}

export async function cancelTeamInvitation(memberId: string) {
  const response = await apiClient.post<ApiSuccess<TeamMemberListItem>>(
    `/team/members/${memberId}/cancel-invitation`,
  );
  return response.data.data;
}

export async function fetchManagedRoles(params: ListRolesParams = {}) {
  const response = await apiClient.get<ApiSuccess<RolesListResponse>>(
    "/team/roles/manage",
    {
      params: cleanParams({
        search: params.search,
        status: params.status,
        roleType: params.roleType,
        accessLevel: params.accessLevel,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      }),
    },
  );
  return response.data.data;
}

export async function fetchRole(roleId: string) {
  const response = await apiClient.get<ApiSuccess<TeamRoleListItem>>(
    `/team/roles/${roleId}`,
  );
  return response.data.data;
}

export async function fetchRoleDetails(roleId: string) {
  const response = await apiClient.get<ApiSuccess<TeamRoleDetails>>(
    `/team/roles/${roleId}/details`,
  );
  return response.data.data;
}

export async function fetchPermissionMatrixMeta() {
  const response = await apiClient.get<ApiSuccess<PermissionMatrixMeta>>(
    "/team/roles/permission-matrix",
  );
  return response.data.data;
}

export async function createRole(payload: CreateRolePayload) {
  const response = await apiClient.post<ApiSuccess<TeamRoleListItem>>(
    "/team/roles",
    payload,
  );
  return response.data.data;
}

export async function updateRole(roleId: string, payload: UpdateRolePayload) {
  const response = await apiClient.patch<ApiSuccess<TeamRoleListItem>>(
    `/team/roles/${roleId}`,
    payload,
  );
  return response.data.data;
}

export async function updateRolePermissions(
  roleId: string,
  payload: {
    permissions: TeamRoleDetails["permissions"];
    fieldAccess?: TeamRoleDetails["fieldAccess"];
  },
) {
  const response = await apiClient.patch<ApiSuccess<TeamRoleDetails>>(
    `/team/roles/${roleId}/permissions`,
    payload,
  );
  return response.data.data;
}

export async function duplicateRole(roleId: string, name?: string) {
  const response = await apiClient.post<ApiSuccess<TeamRoleListItem>>(
    `/team/roles/${roleId}/duplicate`,
    name ? { name } : {},
  );
  return response.data.data;
}

export async function archiveRole(roleId: string) {
  const response = await apiClient.post<ApiSuccess<TeamRoleListItem>>(
    `/team/roles/${roleId}/archive`,
  );
  return response.data.data;
}

export async function deactivateRole(roleId: string) {
  const response = await apiClient.post<ApiSuccess<TeamRoleListItem>>(
    `/team/roles/${roleId}/deactivate`,
  );
  return response.data.data;
}

export async function activateRole(roleId: string) {
  const response = await apiClient.post<ApiSuccess<TeamRoleListItem>>(
    `/team/roles/${roleId}/activate`,
  );
  return response.data.data;
}

export async function deleteRole(roleId: string) {
  const response = await apiClient.delete<ApiSuccess<{ id: string }>>(
    `/team/roles/${roleId}`,
  );
  return response.data.data;
}

export async function fetchRbacSession() {
  const response = await apiClient.get<
    ApiSuccess<import("@/types/employer-team").RbacSession>
  >("/team/rbac/session");
  return response.data.data;
}

export async function loginTeamMember(payload: {
  email: string;
  password: string;
}) {
  const response = await apiClient.post<
    ApiSuccess<import("@/types/employer-team").TeamMemberLoginResponse>
  >("/team/auth/login", payload);
  return response.data.data;
}

export async function previewTeamInvitation(token: string) {
  const response = await apiClient.get<
    ApiSuccess<import("@/types/employer-team").TeamInvitationPreview>
  >("/team/invitations/preview", {
    params: { token },
  });
  return response.data.data;
}

export async function acceptTeamInvitation(
  payload: import("@/types/employer-team").AcceptTeamInvitationPayload,
) {
  const response = await apiClient.post<
    ApiSuccess<import("@/types/employer-team").AcceptTeamInvitationResult>
  >("/team/invitations/accept", payload);
  return {
    data: response.data.data,
    message: response.data.message ?? "",
  };
}

