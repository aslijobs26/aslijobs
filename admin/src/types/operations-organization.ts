export const OPERATIONS_ORG_UNIT_TYPES = [
  "global",
  "country",
  "region",
  "state",
  "city",
  "office",
] as const;

export type OperationsOrgUnitType = (typeof OPERATIONS_ORG_UNIT_TYPES)[number];

export const OPERATIONS_ORG_UNIT_STATUSES = ["active", "archived"] as const;

export type OperationsOrgUnitStatus =
  (typeof OPERATIONS_ORG_UNIT_STATUSES)[number];

/** Valid child types for each org unit type (mirrors backend). */
export const ORG_UNIT_CHILD_TYPES: Record<
  OperationsOrgUnitType,
  OperationsOrgUnitType[]
> = {
  global: ["country"],
  country: ["region", "state", "city", "office"],
  region: ["state", "city", "office"],
  state: ["city", "office"],
  city: ["office"],
  office: [],
};

export type OperationsOrgUnitPublic = {
  id: string;
  name: string;
  slug: string;
  type: string;
  parentId: string | null;
  ancestorIds: string[];
  depth: number;
  status: string;
  code: string;
  timezone: string;
  primaryOffice: string;
  latitude: number | null;
  longitude: number | null;
  headUserId: string | null;
  headName: string | null;
  establishedAt: string | null;
  peopleCount: number;
  childCount: number;
  isSystemSeeded: boolean;
  revision: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OperationsOrgTreeNode = OperationsOrgUnitPublic & {
  children: OperationsOrgTreeNode[];
};

export type OperationsOrgTreeResponse = {
  roots: OperationsOrgTreeNode[];
  scopeId: string | null;
  search: string;
};

export type OperationsOrgOverviewKpi = {
  id: "people" | "teams" | "departments" | "cities";
  label: string;
  value: number;
  trendPercent: number | null;
  trendDirection: "up" | "down" | "neutral";
  caption: string;
};

export type OperationsOrgKeyInfo = {
  region: string | null;
  country: string | null;
  state: string | null;
  head: { id: string; name: string } | null;
  establishedAt: string | null;
  totalPeople: number;
  totalTeams: number;
  primaryOffice: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  timezone: string;
};

export type OperationsOrgDepartmentShare = {
  id: string;
  label: string;
  count: number;
  percent: number | null;
};

export type OperationsOrgTeamRow = {
  id: string;
  name: string;
  departmentName: string;
  peopleCount: number;
  leadName: string | null;
  status: string;
};

export type OperationsOrgLocationPoint = {
  id: string;
  name: string;
  type: string;
  peopleCount: number;
  latitude: number | null;
  longitude: number | null;
};

export type OperationsOrgOverviewResponse = {
  unit: OperationsOrgUnitPublic;
  breadcrumbs: Array<{ id: string; name: string; type: string }>;
  kpis: OperationsOrgOverviewKpi[];
  keyInfo: OperationsOrgKeyInfo;
  mapPoints: OperationsOrgLocationPoint[];
  teams: OperationsOrgTeamRow[];
  peopleByDepartment: OperationsOrgDepartmentShare[];
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    available: boolean;
  }>;
};

export type OperationsOrgPerson = {
  id: string;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  status: string;
  role: string;
  roleId: string | null;
  departmentId: string | null;
  orgUnitId: string | null;
  lastActiveAt: string | null;
  createdAt: string | null;
};

export type OperationsOrgPeopleResponse = {
  unitId: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: OperationsOrgPerson[];
};

export type CreateOperationsOrgUnitInput = {
  name: string;
  type: OperationsOrgUnitType;
  parentId?: string | null;
  code?: string;
  timezone?: string;
  primaryOffice?: string;
  latitude?: number | null;
  longitude?: number | null;
  headUserId?: string | null;
  establishedAt?: string | null;
};

export type UpdateOperationsOrgUnitInput = {
  name?: string;
  code?: string;
  timezone?: string;
  primaryOffice?: string;
  latitude?: number | null;
  longitude?: number | null;
  headUserId?: string | null;
  establishedAt?: string | null;
  parentId?: string | null;
  status?: "active" | "archived";
  revision?: number;
};

export type OperationsOrganizationTab =
  | "structure"
  | "people"
  | "roles"
  | "departments"
  | "locations"
  | "teams"
  | "settings";

export type OperationsOrgUnitDetailTab =
  | "overview"
  | "teams"
  | "people"
  | "departments"
  | "roles"
  | "settings";
