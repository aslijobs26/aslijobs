export type DepartmentStatus = "active" | "inactive";

export type DepartmentColor =
  | "primary"
  | "sky"
  | "violet"
  | "amber"
  | "orange"
  | "rose"
  | "emerald"
  | "slate";

export type DepartmentIcon =
  | "building"
  | "users"
  | "briefcase"
  | "headphones"
  | "wallet"
  | "megaphone"
  | "settings"
  | "shield";

export type DepartmentHeadSummary = {
  id: string;
  fullName: string;
  email: string;
  status: string;
} | null;

export type DepartmentListItem = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: DepartmentStatus;
  color: DepartmentColor | "";
  icon: DepartmentIcon | "";
  email: string;
  phone: string;
  head: DepartmentHeadSummary;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentDetails = DepartmentListItem & {
  activeMemberCount: number;
  pendingInvitationCount: number;
  createdBy: string;
  updatedBy: string;
};

export type TeamStats = {
  totalMembers: number;
  activeMembers: number;
  roles: number;
  pendingInvitations: number;
  departments: number;
};

export type TeamMemberOption = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DepartmentsListResponse = {
  departments: DepartmentListItem[];
  pagination: PaginationMeta;
};

export type CreateDepartmentPayload = {
  name: string;
  code?: string;
  description?: string;
  headMemberId?: string | null;
  email?: string;
  phone?: string;
  status?: DepartmentStatus;
  color?: DepartmentColor;
  icon?: DepartmentIcon;
};

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export type ListDepartmentsParams = {
  search?: string;
  status?: DepartmentStatus;
  headMemberId?: string;
  createdFrom?: string;
  createdTo?: string;
  memberCountMin?: number;
  memberCountMax?: number;
  sort?:
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc"
    | "members_asc"
    | "members_desc";
  page?: number;
  limit?: number;
};

export type TeamMemberStatus =
  | "invited"
  | "active"
  | "inactive"
  | "suspended"
  | "removed";

export type TeamInvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled"
  | "rejected";

export type TeamInvitationEmailDeliveryStatus = "pending" | "sent" | "failed";

export type TeamAccessLevel =
  | "full_access"
  | "limited"
  | "view_only"
  | "custom";

export type TeamRoleSummary = {
  id: string;
  name: string;
  description: string;
  accessLevel: TeamAccessLevel;
  status: string;
  memberCount?: number;
  isSystem?: boolean;
  color?: string;
  icon?: string;
};

export type TeamRoleStatus = "active" | "inactive" | "archived";

export type TeamRoleColor =
  | "primary"
  | "sky"
  | "violet"
  | "amber"
  | "orange"
  | "rose"
  | "emerald"
  | "slate";

export type TeamRoleIcon =
  | "shield"
  | "users"
  | "briefcase"
  | "settings"
  | "eye"
  | "star"
  | "building"
  | "headphones";

export type TeamPermissionModule =
  | "dashboard"
  | "jobs"
  | "candidates"
  | "interviews"
  | "messages"
  | "campaigns"
  | "reports"
  | "subscription"
  | "company_profile"
  | "team_management"
  | "settings";

export type FieldAccessLevel = "hidden" | "view" | "mask" | "edit";

export type RoleFieldAccessMap = Partial<
  Record<TeamPermissionModule, Partial<Record<string, FieldAccessLevel>>>
>;

export type ModulePermission = {
  fullAccess: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  fields?: Record<string, boolean>;
};

export type RolePermissionsMatrix = Record<
  TeamPermissionModule,
  ModulePermission
>;

export type TeamRoleListItem = {
  id: string;
  name: string;
  description: string;
  accessLevel: TeamAccessLevel;
  status: TeamRoleStatus;
  isSystem: boolean;
  color: TeamRoleColor | "";
  icon: TeamRoleIcon | "";
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TeamRoleDetails = TeamRoleListItem & {
  permissions: RolePermissionsMatrix;
  fieldAccess: RoleFieldAccessMap | null;
  createdBy: string;
  updatedBy: string;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    departmentName: string | null;
  }>;
  recentChanges: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
};

export type TeamRoleStats = {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  archivedRoles: number;
  systemRoles: number;
  customRoles: number;
};

export type RolesListResponse = {
  roles: TeamRoleListItem[];
  pagination: PaginationMeta;
  stats: TeamRoleStats;
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  accessLevel?: TeamAccessLevel;
  status?: "active" | "inactive";
  color?: TeamRoleColor;
  icon?: TeamRoleIcon;
  cloneRoleId?: string;
  permissions?: Partial<Record<TeamPermissionModule, Partial<ModulePermission>>>;
};

export type UpdateRolePayload = Partial<CreateRolePayload> & {
  status?: TeamRoleStatus;
};

export type ListRolesParams = {
  search?: string;
  status?: TeamRoleStatus;
  roleType?: "system" | "custom";
  accessLevel?: TeamAccessLevel;
  createdFrom?: string;
  createdTo?: string;
  sort?:
    | "name_asc"
    | "name_desc"
    | "members_asc"
    | "members_desc"
    | "newest"
    | "oldest"
    | "updated_newest"
    | "status";
  page?: number;
  limit?: number;
};

export type PermissionMatrixMeta = {
  modules: Array<{ key: string; label: string }>;
  actions: Array<{ key: string; label: string }>;
};

export type RbacActionKey =
  | "fullAccess"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export";

export type RbacSessionActor = {
  fullName: string;
  email: string;
  roleName: string;
  departmentName: string | null;
  companyName: string;
  status: string;
  lastActiveAt: string | null;
};

export type RbacSession = {
  principalType: "owner" | "member";
  employerId: string;
  memberId: string | null;
  roleId: string | null;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: RolePermissionsMatrix;
  fieldAccess: RoleFieldAccessMap | null;
  allowedModules: TeamPermissionModule[];
  allowedActions: Record<
    TeamPermissionModule,
    Record<RbacActionKey, boolean>
  >;
  /** Authenticated member identity only (null for employer owner). */
  actor: RbacSessionActor | null;
};

export type TeamMemberLoginResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  member: {
    id: string;
    fullName: string;
    email: string;
    employerId: string;
  };
  employer: {
    id: string;
    companyName: string;
    accountType: string;
  };
  rbac: RbacSession;
};

export type TeamInvitationPreviewState =
  | "valid"
  | "invalid"
  | "expired"
  | "accepted"
  | "cancelled"
  | "rejected";

export type TeamInvitationPreview = {
  state: TeamInvitationPreviewState;
  message: string;
  fullName: string | null;
  email: string | null;
  companyName: string | null;
  roleName: string | null;
  departmentName: string | null;
  expiresAt: string | null;
};

export type AcceptTeamInvitationPayload = {
  token: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: true;
};

export type AcceptTeamInvitationResult = {
  memberId: string;
  employerId: string;
};

export type TeamMemberListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  status: TeamMemberStatus;
  invitationStatus: TeamInvitationStatus | "";
  emailDeliveryStatus: TeamInvitationEmailDeliveryStatus | null;
  accessLevel: TeamAccessLevel;
  department: { id: string; name: string; status: string } | null;
  role: TeamRoleSummary | null;
  lastActiveAt: string | null;
  joinedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberDetails = TeamMemberListItem & {
  invitationHistory: Array<{
    id: string;
    status: TeamInvitationStatus;
    invitedAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    cancelledAt: string | null;
    resendCount: number;
  }>;
};

/** Authenticated team member's own profile (session-scoped). */
export type TeamMemberSelfProfile = TeamMemberDetails & {
  companyName: string;
  createdByLabel: string;
};

export type MembersListResponse = {
  members: TeamMemberListItem[];
  pagination: PaginationMeta;
};

export type InviteMemberPayload = {
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  roleId: string;
  designation?: string;
  accessLevel?: TeamAccessLevel;
  message?: string;
};

export type UpdateMemberPayload = {
  fullName?: string;
  phone?: string;
  designation?: string;
  departmentId?: string;
  roleId?: string;
  accessLevel?: TeamAccessLevel;
  status?: "active" | "inactive" | "suspended";
};

export type ListMembersParams = {
  search?: string;
  departmentId?: string;
  roleId?: string;
  status?: TeamMemberStatus;
  invitationStatus?: TeamInvitationStatus;
  joinedFrom?: string;
  joinedTo?: string;
  lastActiveFrom?: string;
  lastActiveTo?: string;
  sort?:
    | "name_asc"
    | "name_desc"
    | "department"
    | "role"
    | "joined_newest"
    | "joined_oldest"
    | "last_active_newest"
    | "last_active_oldest"
    | "status";
  page?: number;
  limit?: number;
};

export type TeamSidebarData = {
  roleDistribution: {
    total: number;
    slices: Array<{
      roleId: string;
      roleName: string;
      count: number;
      percentage: number;
    }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    memberId: string | null;
  }>;
};
