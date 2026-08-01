import type { TeamAccessLevel } from "./team.constants.js";

export const TEAM_PERMISSION_MODULES = [
  "dashboard",
  "jobs",
  "candidates",
  "interviews",
  "messages",
  "campaigns",
  "reports",
  "subscription",
  "company_profile",
  "team_management",
  "settings",
] as const;

export type TeamPermissionModule = (typeof TEAM_PERMISSION_MODULES)[number];

export const TEAM_PERMISSION_MODULE_LABELS: Record<
  TeamPermissionModule,
  string
> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  candidates: "Candidates",
  interviews: "Interviews",
  messages: "Messages",
  campaigns: "Campaigns",
  reports: "Reports",
  subscription: "Subscription",
  company_profile: "Company Profile",
  team_management: "Team Management",
  settings: "Settings",
};

export const TEAM_PERMISSION_ACTIONS = [
  "fullAccess",
  "create",
  "read",
  "update",
  "delete",
  "export",
] as const;

export type TeamPermissionAction = (typeof TEAM_PERMISSION_ACTIONS)[number];

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

export type FieldAccessLevel = "hidden" | "view" | "mask" | "edit";

export type RoleFieldAccessMap = Partial<
  Record<TeamPermissionModule, Partial<Record<string, FieldAccessLevel>>>
>;

export function emptyModulePermission(): ModulePermission {
  return {
    fullAccess: false,
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    fields: {},
  };
}

export function fullModulePermission(): ModulePermission {
  return {
    fullAccess: true,
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    fields: {},
  };
}

export function readOnlyModulePermission(): ModulePermission {
  return {
    fullAccess: false,
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    fields: {},
  };
}

export function createEmptyPermissionsMatrix(): RolePermissionsMatrix {
  return TEAM_PERMISSION_MODULES.reduce((accumulator, moduleKey) => {
    accumulator[moduleKey] = emptyModulePermission();
    return accumulator;
  }, {} as RolePermissionsMatrix);
}

export function normalizeModulePermission(
  input: Partial<ModulePermission> | undefined,
): ModulePermission {
  const base = emptyModulePermission();
  if (!input) {
    return base;
  }

  const fullAccess = Boolean(input.fullAccess);
  if (fullAccess) {
    return {
      fullAccess: true,
      create: true,
      read: true,
      update: true,
      delete: true,
      export: true,
      fields: input.fields ?? {},
    };
  }

  return {
    fullAccess: false,
    create: Boolean(input.create),
    read: Boolean(input.read),
    update: Boolean(input.update),
    delete: Boolean(input.delete),
    export: Boolean(input.export),
    fields: input.fields ?? {},
  };
}

/**
 * Normalize a partial matrix. Missing modules default to empty (unchecked).
 * Access-level templates are applied separately via team-access-templates.
 */
export function normalizePermissionsMatrix(
  input: Partial<Record<string, Partial<ModulePermission>>> | null | undefined,
  _accessLevel: TeamAccessLevel = "custom",
): RolePermissionsMatrix {
  const empty = createEmptyPermissionsMatrix();
  if (!input || typeof input !== "object") {
    return empty;
  }

  const matrix = createEmptyPermissionsMatrix();
  for (const moduleKey of TEAM_PERMISSION_MODULES) {
    matrix[moduleKey] = normalizeModulePermission(
      input[moduleKey] ?? empty[moduleKey],
    );
  }
  return matrix;
}
