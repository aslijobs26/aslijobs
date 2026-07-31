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

export type RoleFieldAccessMap = Partial<
  Record<TeamPermissionModule, Record<string, boolean>>
>;

function emptyModulePermission(): ModulePermission {
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

function fullModulePermission(): ModulePermission {
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

function readOnlyModulePermission(): ModulePermission {
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

function limitedModulePermission(): ModulePermission {
  return {
    fullAccess: false,
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    fields: {},
  };
}

export function createEmptyPermissionsMatrix(): RolePermissionsMatrix {
  return TEAM_PERMISSION_MODULES.reduce((accumulator, moduleKey) => {
    accumulator[moduleKey] = emptyModulePermission();
    return accumulator;
  }, {} as RolePermissionsMatrix);
}

export function createPermissionsForAccessLevel(
  accessLevel: TeamAccessLevel,
): RolePermissionsMatrix {
  const matrix = createEmptyPermissionsMatrix();

  for (const moduleKey of TEAM_PERMISSION_MODULES) {
    if (accessLevel === "full_access") {
      matrix[moduleKey] = fullModulePermission();
    } else if (accessLevel === "view_only") {
      matrix[moduleKey] = readOnlyModulePermission();
    } else if (accessLevel === "limited") {
      matrix[moduleKey] =
        moduleKey === "settings" || moduleKey === "subscription"
          ? readOnlyModulePermission()
          : limitedModulePermission();
    } else {
      matrix[moduleKey] = limitedModulePermission();
    }
  }

  return matrix;
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

export function normalizePermissionsMatrix(
  input: Partial<Record<string, Partial<ModulePermission>>> | null | undefined,
  accessLevel: TeamAccessLevel = "custom",
): RolePermissionsMatrix {
  const fallback = createPermissionsForAccessLevel(accessLevel);
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const matrix = createEmptyPermissionsMatrix();
  for (const moduleKey of TEAM_PERMISSION_MODULES) {
    matrix[moduleKey] = normalizeModulePermission(
      input[moduleKey] ?? fallback[moduleKey],
    );
  }
  return matrix;
}
