import type {
  ModulePermission,
  RolePermissionsMatrix,
  TeamAccessLevel,
  TeamPermissionModule,
} from "@/types/employer-team";
import { PERMISSION_MODULES } from "@/constants/employer-team-management";

function emptyModule(): ModulePermission {
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

function fullModule(): ModulePermission {
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

function modulePermission(
  partial: Partial<Omit<ModulePermission, "fields">>,
): ModulePermission {
  return {
    fullAccess: false,
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    fields: {},
    ...partial,
  };
}

export function createEmptyPermissionsMatrix(): RolePermissionsMatrix {
  return PERMISSION_MODULES.reduce((accumulator, moduleKey) => {
    accumulator[moduleKey] = emptyModule();
    return accumulator;
  }, {} as RolePermissionsMatrix);
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

function buildMatrix(
  overrides: Partial<Record<TeamPermissionModule, ModulePermission>>,
): RolePermissionsMatrix {
  const matrix = createEmptyPermissionsMatrix();
  for (const moduleKey of PERMISSION_MODULES) {
    matrix[moduleKey] = overrides[moduleKey] ?? NONE;
  }
  return matrix;
}

export const FULL_ACCESS_TEMPLATE: RolePermissionsMatrix = buildMatrix(
  Object.fromEntries(PERMISSION_MODULES.map((key) => [key, fullModule()])) as Record<
    TeamPermissionModule,
    ModulePermission
  >,
);

export const VIEW_ONLY_TEMPLATE: RolePermissionsMatrix = buildMatrix(
  Object.fromEntries(PERMISSION_MODULES.map((key) => [key, READ])) as Record<
    TeamPermissionModule,
    ModulePermission
  >,
);

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

export const EMPTY_TEMPLATE: RolePermissionsMatrix =
  createEmptyPermissionsMatrix();

export function createPermissionsForAccessLevel(
  accessLevel: TeamAccessLevel,
): RolePermissionsMatrix {
  switch (accessLevel) {
    case "full_access":
      return structuredClone(FULL_ACCESS_TEMPLATE);
    case "view_only":
      return structuredClone(VIEW_ONLY_TEMPLATE);
    case "limited":
      return structuredClone(LIMITED_TEMPLATE);
    case "custom":
    default:
      return structuredClone(EMPTY_TEMPLATE);
  }
}

export function shouldReplacePermissionsOnAccessLevelChange(
  previousLevel: TeamAccessLevel,
  nextLevel: TeamAccessLevel,
): boolean {
  if (previousLevel === nextLevel) return false;
  if (nextLevel === "custom") return false;
  return true;
}

export function applyFullAccessToggle(
  current: ModulePermission,
  enabled: boolean,
): ModulePermission {
  if (enabled) {
    return fullModule();
  }
  return {
    ...current,
    fullAccess: false,
  };
}

export function toggleModuleAction(
  current: ModulePermission,
  action: keyof Omit<ModulePermission, "fields">,
  enabled: boolean,
): ModulePermission {
  if (action === "fullAccess") {
    return applyFullAccessToggle(current, enabled);
  }

  const next: ModulePermission = {
    ...current,
    fullAccess: false,
    [action]: enabled,
  };

  if (
    next.create &&
    next.read &&
    next.update &&
    next.delete &&
    next.export
  ) {
    next.fullAccess = true;
  }

  return next;
}

export function isAssignableRole(status: string): boolean {
  return status === "active";
}

export type MatrixActionKey = Exclude<keyof ModulePermission, "fields">;

export function getModuleKeys(
  matrix: RolePermissionsMatrix,
): TeamPermissionModule[] {
  return PERMISSION_MODULES.filter((key) => key in matrix);
}

/**
 * Build a complete permissions payload for PATCH /roles/:id/permissions.
 * Every module and every action is always present as a boolean (never undefined).
 */
export function normalizePermissionsForSave(
  matrix: RolePermissionsMatrix | null | undefined,
): RolePermissionsMatrix {
  const source = matrix ?? createEmptyPermissionsMatrix();
  return PERMISSION_MODULES.reduce((accumulator, moduleKey) => {
    const modulePermissionValue = source[moduleKey] ?? emptyModule();
    accumulator[moduleKey] = {
      fullAccess: Boolean(modulePermissionValue.fullAccess),
      create: Boolean(modulePermissionValue.create),
      read: Boolean(modulePermissionValue.read),
      update: Boolean(modulePermissionValue.update),
      delete: Boolean(modulePermissionValue.delete),
      export: Boolean(modulePermissionValue.export),
      fields:
        modulePermissionValue.fields &&
        typeof modulePermissionValue.fields === "object"
          ? modulePermissionValue.fields
          : {},
    };
    return accumulator;
  }, {} as RolePermissionsMatrix);
}

/**
 * Serialize field-access draft for API.
 * Never returns undefined — uses {} when there is nothing to persist.
 */
export function normalizeFieldAccessForSave(
  draft: Partial<
    Record<TeamPermissionModule, Partial<Record<string, string>>>
  > | null | undefined,
): Record<string, Record<string, string>> {
  if (!draft || typeof draft !== "object") {
    return {};
  }

  const result: Record<string, Record<string, string>> = {};
  for (const [moduleKey, fields] of Object.entries(draft)) {
    if (!fields || typeof fields !== "object") {
      continue;
    }
    const cleaned: Record<string, string> = {};
    for (const [fieldKey, level] of Object.entries(fields)) {
      if (typeof level === "string" && level.length > 0) {
        cleaned[fieldKey] = level;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      result[moduleKey] = cleaned;
    }
  }
  return result;
}
