import type { TeamAccessLevel } from "./team.constants.js";
import {
  createEmptyPermissionsMatrix,
  normalizeModulePermission,
  normalizePermissionsMatrix,
  TEAM_PERMISSION_MODULES,
  type ModulePermission,
  type RolePermissionsMatrix,
  type TeamPermissionModule,
} from "./team-permissions.js";

function modulePermission(
  partial: Partial<Omit<ModulePermission, "fields">>,
): ModulePermission {
  return normalizeModulePermission({
    fullAccess: false,
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    ...partial,
    fields: {},
  });
}

const NONE = modulePermission({});
const READ = modulePermission({ read: true });
const READ_UPDATE = modulePermission({ read: true, update: true });
const READ_CREATE_UPDATE = modulePermission({
  create: true,
  read: true,
  update: true,
});
const READ_EXPORT = modulePermission({ read: true, export: true });
const FULL = modulePermission({
  fullAccess: true,
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
});

function buildMatrix(
  overrides: Partial<Record<TeamPermissionModule, ModulePermission>>,
): RolePermissionsMatrix {
  const matrix = createEmptyPermissionsMatrix();
  for (const moduleKey of TEAM_PERMISSION_MODULES) {
    matrix[moduleKey] = overrides[moduleKey] ?? NONE;
  }
  return matrix;
}

/** Every module, every action enabled. */
export const FULL_ACCESS_TEMPLATE: RolePermissionsMatrix = buildMatrix(
  Object.fromEntries(
    TEAM_PERMISSION_MODULES.map((moduleKey) => [moduleKey, FULL]),
  ) as Record<TeamPermissionModule, ModulePermission>,
);

/** Read-only across the entire application. */
export const VIEW_ONLY_TEMPLATE: RolePermissionsMatrix = buildMatrix(
  Object.fromEntries(
    TEAM_PERMISSION_MODULES.map((moduleKey) => [moduleKey, READ]),
  ) as Record<TeamPermissionModule, ModulePermission>,
);

/**
 * Hiring-manager style template.
 * Admin surfaces (company profile, settings, team, subscription) stay disabled.
 */
export const LIMITED_TEMPLATE: RolePermissionsMatrix = buildMatrix({
  dashboard: READ,
  jobs: READ_CREATE_UPDATE,
  candidates: READ_UPDATE,
  interviews: READ_UPDATE,
  messages: READ,
  campaigns: READ,
  reports: READ_EXPORT,
  subscription: NONE,
  company_profile: NONE,
  team_management: NONE,
  settings: NONE,
});

/** Custom starts with nothing checked — user configures manually. */
export const EMPTY_TEMPLATE: RolePermissionsMatrix =
  createEmptyPermissionsMatrix();

export const ACCESS_LEVEL_TEMPLATES: Record<
  TeamAccessLevel,
  RolePermissionsMatrix
> = {
  full_access: FULL_ACCESS_TEMPLATE,
  view_only: VIEW_ONLY_TEMPLATE,
  limited: LIMITED_TEMPLATE,
  custom: EMPTY_TEMPLATE,
};

export function generatePermissionsFromAccessLevel(
  accessLevel: TeamAccessLevel,
): RolePermissionsMatrix {
  const template = ACCESS_LEVEL_TEMPLATES[accessLevel] ?? EMPTY_TEMPLATE;
  return normalizePermissionsMatrix(template, accessLevel);
}

/** @deprecated Alias — use generatePermissionsFromAccessLevel */
export const createPermissionsForAccessLevel =
  generatePermissionsFromAccessLevel;

export function applyPermissionTemplate(
  accessLevel: TeamAccessLevel,
): RolePermissionsMatrix {
  return generatePermissionsFromAccessLevel(accessLevel);
}

export function replacePermissionMatrix(
  accessLevel: TeamAccessLevel,
): RolePermissionsMatrix {
  return generatePermissionsFromAccessLevel(accessLevel);
}

export function shouldReplacePermissionsOnAccessLevelChange(
  previousLevel: TeamAccessLevel,
  nextLevel: TeamAccessLevel,
): boolean {
  if (previousLevel === nextLevel) {
    return false;
  }
  // Switching to Custom keeps the current matrix for manual editing.
  if (nextLevel === "custom") {
    return false;
  }
  return true;
}

export function accessLevelTemplateLabel(accessLevel: TeamAccessLevel): string {
  switch (accessLevel) {
    case "full_access":
      return "Full Access";
    case "limited":
      return "Limited Access";
    case "view_only":
      return "View Only";
    case "custom":
      return "Custom Access";
    default:
      return accessLevel;
  }
}
