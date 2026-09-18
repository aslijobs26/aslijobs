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
  departments: Array<{
    id: string;
    name: string;
    teamCount: number;
    memberCount: number;
    status: string;
  }>;
  roles: Array<{
    id: string;
    name: string;
    departmentName: string | null;
    memberCount: number;
  }>;
  peopleByDepartment: OperationsOrgDepartmentShare[];
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    available: boolean;
  }>;
};
