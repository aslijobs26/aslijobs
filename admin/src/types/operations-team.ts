export type OperationsTeamMemberStatus = "active" | "inactive" | "suspended";

export type OperationsTeamMember = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  role: string;
  roleId: string | null;
  roleName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  orgUnitId: string | null;
  orgUnitName: string | null;
  teamId: string | null;
  teamName: string | null;
  status: OperationsTeamMemberStatus;
  lastActiveAt: string | null;
  invitedAt: string | null;
  invitationLastSentAt?: string | null;
  invitationResendCount?: number;
  invitationEmailStatus?: string | null;
  invitationEmailError?: string | null;
  invitationEmailSent?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OperationsTeamOverview = {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  pendingInvitations: number;
  totalRoles: number;
  totalDepartments: number;
  totalTeams?: number;
};

export type OperationsTeamListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: OperationsTeamMemberStatus | "";
  roleId?: string;
  departmentId?: string;
  orgUnitId?: string;
  teamId?: string;
};

export type OperationsTeamListResult = {
  members: OperationsTeamMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type CreateOperationsTeamMemberInput = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password?: string;
  roleId: string;
  departmentId?: string | null;
  orgUnitId?: string | null;
  teamId?: string | null;
  status?: "active" | "inactive";
};

export type UpdateOperationsTeamMemberInput = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  roleId?: string;
  departmentId?: string | null;
  orgUnitId?: string | null;
  teamId?: string | null;
};

export type OperationsRoleGrant = {
  key: string;
  access: "allow";
  canDelegate: boolean;
};

export type OperationsRole = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  departmentId: string | null;
  departmentName: string | null;
  parentRoleId: string | null;
  parentRoleName: string | null;
  depth: number;
  canCreateRoles: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  grants: OperationsRoleGrant[];
  isSystemSeeded: boolean;
  revision: number;
  memberCount: number;
  childCount: number;
  createdBy: string | null;
  createdByName: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
  isSystemRoot?: boolean;
};

export type OperationsRoleTreeNode = OperationsRole & {
  children: OperationsRoleTreeNode[];
};

export type OperationsRoleDetail = {
  role: OperationsRole;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    lastActiveAt: string | null;
  }>;
  childRoles: Array<{ id: string; name: string; status: string }>;
  auditEvents: Array<{
    id: string;
    action: string;
    actorName: string;
    createdAt: string | null;
    reason: string;
  }>;
};

export type OperationsCatalogTreeNode = {
  key: string;
  label: string;
  children: OperationsCatalogTreeNode[];
};

export type CreateOperationsRoleInput = {
  name: string;
  description?: string;
  departmentId?: string | null;
  parentRoleId?: string | null;
  canCreateRoles?: boolean;
  canManageUsers?: boolean;
  canAssignRoles?: boolean;
  grants?: OperationsRoleGrant[];
  expectedRevision?: number;
};

export type OperationsDepartment = {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  status: string;
  headUserId?: string | null;
  headName?: string | null;
  revision?: number;
  memberCount: number;
  teamCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OperationsDepartmentMetrics = {
  totalDepartments: number;
  activeDepartments: number;
  departmentsWithTeams: number;
  totalMembers: number;
};

export type OperationsDepartmentListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "archived" | "all";
};

export type OperationsDepartmentListResult = {
  departments: OperationsDepartment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type OperationsAuditEvent = {
  id: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  previousState: unknown;
  nextState: unknown;
  reason: string;
  createdAt: string | null;
};
