export type OperationsOpsTeamStatus = "active" | "archived";

export type OperationsOpsTeam = {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  status: OperationsOpsTeamStatus | string;
  departmentId: string;
  departmentName: string | null;
  orgUnitId: string;
  orgUnitName: string | null;
  orgUnitType: string | null;
  country: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  office: string | null;
  leadUserId: string | null;
  leadName: string | null;
  memberCount: number;
  activeMemberCount: number;
  openWorkCount: number;
  revision: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OperationsOpsTeamMetrics = {
  totalTeams: number;
  activeTeams: number;
  inactiveTeams: number;
  locations: number;
  departments: number;
  openWork: number;
};

export type OperationsOpsTeamListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "archived" | "all";
  departmentId?: string;
  orgUnitId?: string;
  regionId?: string;
  stateId?: string;
  cityId?: string;
  leadUserId?: string;
};

export type OperationsOpsTeamListResult = {
  teams: OperationsOpsTeam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type CreateOperationsOpsTeamInput = {
  name: string;
  code: string;
  description?: string;
  departmentId: string;
  orgUnitId: string;
  leadUserId?: string | null;
};

export type UpdateOperationsOpsTeamInput = {
  name?: string;
  code?: string;
  description?: string;
  departmentId?: string;
  orgUnitId?: string;
  leadUserId?: string | null;
  status?: "active" | "archived";
  expectedRevision: number;
};

export type OperationsOpsTeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roleName?: string | null;
  departmentName?: string | null;
  orgUnitName?: string | null;
  status: string;
  lastActiveAt: string | null;
  isLead?: boolean;
};

export type OperationsOpsTeamWorkSummary = {
  open: number;
  inProgress: number;
  waiting: number;
  completed: number;
  overdue: number;
};

export type OperationsOrganizationSettings = {
  organizationName: string;
  defaultCountryId: string | null;
  defaultTimezone: string;
  revision: number;
  countries: Array<{ id: string; name: string }>;
};
