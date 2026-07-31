import type {
  TeamAccessLevel,
  TeamRoleColor,
  TeamRoleIcon,
  TeamRoleStatus,
} from "./team.constants.js";
import type {
  RoleFieldAccessMap,
  RolePermissionsMatrix,
} from "./team-permissions.js";
import type { PaginationMeta } from "./department.types.js";

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

export type PermissionMatrixMeta = {
  modules: Array<{ key: string; label: string }>;
  actions: Array<{ key: string; label: string }>;
};
