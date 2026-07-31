import type {
  ModulePermission,
  RolePermissionsMatrix,
  TeamAccessLevel,
  TeamPermissionModule,
} from "@/types/employer-team";
import {
  PERMISSION_MODULES,
} from "@/constants/employer-team-management";

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

function readOnlyModule(): ModulePermission {
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

function limitedModule(): ModulePermission {
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
  return PERMISSION_MODULES.reduce((accumulator, moduleKey) => {
    accumulator[moduleKey] = emptyModule();
    return accumulator;
  }, {} as RolePermissionsMatrix);
}

export function createPermissionsForAccessLevel(
  accessLevel: TeamAccessLevel,
): RolePermissionsMatrix {
  const matrix = createEmptyPermissionsMatrix();
  for (const moduleKey of PERMISSION_MODULES) {
    if (accessLevel === "full_access") {
      matrix[moduleKey] = fullModule();
    } else if (accessLevel === "view_only") {
      matrix[moduleKey] = readOnlyModule();
    } else if (accessLevel === "limited") {
      matrix[moduleKey] =
        moduleKey === "settings" || moduleKey === "subscription"
          ? readOnlyModule()
          : limitedModule();
    } else {
      matrix[moduleKey] = limitedModule();
    }
  }
  return matrix;
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
