import type {
  TeamAccessLevel,
  TeamInvitationStatus,
  TeamMemberStatus,
} from "./team.constants.js";

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

export type TeamDepartmentSummary = {
  id: string;
  name: string;
  status: string;
} | null;

export type TeamMemberListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  status: TeamMemberStatus;
  invitationStatus: TeamInvitationStatus | "";
  accessLevel: TeamAccessLevel;
  department: TeamDepartmentSummary;
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

export type TeamInvitationListItem = {
  id: string;
  email: string;
  fullName: string;
  status: TeamInvitationStatus;
  departmentId: string;
  roleId: string;
  memberId: string;
  expiresAt: string;
  lastSentAt: string;
  resendCount: number;
  createdAt: string;
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

export type RoleDistributionSlice = {
  roleId: string;
  roleName: string;
  count: number;
  percentage: number;
};

export type TeamActivityItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  memberId: string | null;
};

export type TeamSidebarData = {
  roleDistribution: {
    total: number;
    slices: RoleDistributionSlice[];
  };
  recentActivity: TeamActivityItem[];
};
