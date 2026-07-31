export const DEPARTMENT_STATUSES = ["active", "inactive"] as const;
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];

export const TEAM_MEMBER_STATUSES = [
  "invited",
  "active",
  "inactive",
  "suspended",
  "removed",
] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export const TEAM_INVITATION_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "cancelled",
  "rejected",
] as const;
export type TeamInvitationStatus = (typeof TEAM_INVITATION_STATUSES)[number];

export const TEAM_ACCESS_LEVELS = [
  "full_access",
  "limited",
  "view_only",
  "custom",
] as const;
export type TeamAccessLevel = (typeof TEAM_ACCESS_LEVELS)[number];

export const TEAM_ROLE_STATUSES = ["active", "inactive", "archived"] as const;
export type TeamRoleStatus = (typeof TEAM_ROLE_STATUSES)[number];

export const TEAM_ACTIVITY_TYPES = [
  "invitation_sent",
  "invitation_resent",
  "invitation_cancelled",
  "invitation_accepted",
  "invitation_expired",
  "department_created",
  "department_updated",
  "department_deleted",
  "department_changed",
  "role_changed",
  "role_created",
  "role_updated",
  "permission_changed",
  "role_assigned",
  "role_archived",
  "role_deactivated",
  "role_activated",
  "role_duplicated",
  "role_deleted",
  "permission_denied",
  "member_activated",
  "member_deactivated",
  "member_suspended",
  "member_removed",
  "member_updated",
  "member_login",
  "member_logout",
] as const;
export type TeamActivityType = (typeof TEAM_ACTIVITY_TYPES)[number];

export const DEPARTMENT_NAME_MIN_LENGTH = 2;
export const DEPARTMENT_NAME_MAX_LENGTH = 80;
export const DEPARTMENT_CODE_MAX_LENGTH = 32;
export const DEPARTMENT_DESCRIPTION_MAX_LENGTH = 500;
export const DEPARTMENT_EMAIL_MAX_LENGTH = 120;
export const DEPARTMENT_PHONE_MAX_LENGTH = 20;

export const TEAM_MEMBER_NAME_MIN_LENGTH = 2;
export const TEAM_MEMBER_NAME_MAX_LENGTH = 100;
export const TEAM_MEMBER_PHONE_MAX_LENGTH = 20;
export const TEAM_MEMBER_DESIGNATION_MAX_LENGTH = 80;
export const TEAM_INVITE_MESSAGE_MAX_LENGTH = 500;
export const TEAM_INVITATION_EXPIRY_DAYS = 7;

export const TEAM_MEMBER_PASSWORD_MIN_LENGTH = 8;
export const TEAM_MEMBER_PASSWORD_MAX_LENGTH = 72;
export const TEAM_MEMBER_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export const TEAM_MEMBER_PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

export const INVITATION_INVALID_MESSAGE = "This invitation is invalid.";
export const INVITATION_EXPIRED_MESSAGE = "This invitation has expired.";
export const INVITATION_ALREADY_ACCEPTED_MESSAGE =
  "This invitation has already been accepted.";
export const INVITATION_CANCELLED_MESSAGE = "This invitation was cancelled.";
export const INVITATION_REJECTED_MESSAGE = "This invitation is no longer valid.";

export const DEPARTMENT_COLORS = [
  "primary",
  "sky",
  "violet",
  "amber",
  "orange",
  "rose",
  "emerald",
  "slate",
] as const;
export type DepartmentColor = (typeof DEPARTMENT_COLORS)[number];

export const DEPARTMENT_ICONS = [
  "building",
  "users",
  "briefcase",
  "headphones",
  "wallet",
  "megaphone",
  "settings",
  "shield",
] as const;
export type DepartmentIcon = (typeof DEPARTMENT_ICONS)[number];

export const DEPARTMENT_LIST_SORTS = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "members_asc",
  "members_desc",
] as const;
export type DepartmentListSort = (typeof DEPARTMENT_LIST_SORTS)[number];

export const TEAM_MEMBER_LIST_SORTS = [
  "name_asc",
  "name_desc",
  "department",
  "role",
  "joined_newest",
  "joined_oldest",
  "last_active_newest",
  "last_active_oldest",
  "status",
] as const;
export type TeamMemberListSort = (typeof TEAM_MEMBER_LIST_SORTS)[number];

export const TEAM_ROLE_NAME_MIN_LENGTH = 2;
export const TEAM_ROLE_NAME_MAX_LENGTH = 60;
export const TEAM_ROLE_DESCRIPTION_MAX_LENGTH = 300;

export const TEAM_ROLE_LIST_SORTS = [
  "name_asc",
  "name_desc",
  "members_asc",
  "members_desc",
  "newest",
  "oldest",
  "updated_newest",
  "status",
] as const;
export type TeamRoleListSort = (typeof TEAM_ROLE_LIST_SORTS)[number];

export const TEAM_ROLE_COLORS = [
  "primary",
  "sky",
  "violet",
  "amber",
  "orange",
  "rose",
  "emerald",
  "slate",
] as const;
export type TeamRoleColor = (typeof TEAM_ROLE_COLORS)[number];

export const TEAM_ROLE_ICONS = [
  "shield",
  "users",
  "briefcase",
  "settings",
  "eye",
  "star",
  "building",
  "headphones",
] as const;
export type TeamRoleIcon = (typeof TEAM_ROLE_ICONS)[number];

export const DEPARTMENT_DELETE_BLOCKED_MESSAGE =
  "This department still contains active members. Please move members before deleting.";

export const ROLE_DELETE_BLOCKED_MESSAGE =
  "This role still has members assigned. Please transfer members before deleting.";

export const SYSTEM_ROLE_DELETE_BLOCKED_MESSAGE =
  "System roles cannot be permanently deleted.";

export const DEFAULT_TEAM_ROLES = [
  {
    name: "Admin",
    description: "Full access to all modules and settings",
    accessLevel: "full_access" as const,
    color: "primary" as const,
    icon: "shield" as const,
  },
  {
    name: "HR Manager",
    description: "Manage hiring, candidates and team operations",
    accessLevel: "full_access" as const,
    color: "sky" as const,
    icon: "users" as const,
  },
  {
    name: "Recruiter",
    description: "Source and manage candidates for open roles",
    accessLevel: "limited" as const,
    color: "violet" as const,
    icon: "briefcase" as const,
  },
  {
    name: "Hiring Manager",
    description: "Lead hiring decisions for open positions",
    accessLevel: "limited" as const,
    color: "amber" as const,
    icon: "star" as const,
  },
  {
    name: "Coordinator",
    description: "Coordinate interviews and candidate communication",
    accessLevel: "limited" as const,
    color: "rose" as const,
    icon: "headphones" as const,
  },
  {
    name: "Viewer",
    description: "Read-only access to hiring information",
    accessLevel: "view_only" as const,
    color: "slate" as const,
    icon: "eye" as const,
  },
] as const;
