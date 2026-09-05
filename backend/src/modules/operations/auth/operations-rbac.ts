import type { OperationsTeamRole } from "../operations.constants.js";

/**
 * Operations RBAC catalog — foundation for Team Management.
 *
 * Today permissions are resolved from a static role → matrix.
 * Future Team Management can replace/overlay this with DB-backed
 * role and permission documents without changing call sites that use
 * `canOperationsPermission` / `requireOperationsPermission`.
 */

export const OPERATIONS_PERMISSION_MODULES = [
  "dashboard",
  "my_work",
  "work_queue",
  "whatsapp",
  "journey_alerts",
  "support",
  "employers",
  "candidates",
  "jobs",
  "verifications",
  "escalations",
  "team",
  "roles",
  "departments",
  "activity_logs",
  "reports",
  "campaigns",
  "billing",
  "settings",
] as const;

export type OperationsPermissionModule =
  (typeof OPERATIONS_PERMISSION_MODULES)[number];

export const OPERATIONS_PERMISSION_ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
] as const;

export type OperationsPermissionAction =
  (typeof OPERATIONS_PERMISSION_ACTIONS)[number];

export type OperationsModulePermissions = Record<
  OperationsPermissionAction,
  boolean
>;

export type OperationsPermissionMap = Record<
  OperationsPermissionModule,
  OperationsModulePermissions
>;

function denyAllActions(): OperationsModulePermissions {
  return {
    read: false,
    create: false,
    update: false,
    delete: false,
  };
}

function allowAllActions(): OperationsModulePermissions {
  return {
    read: true,
    create: true,
    update: true,
    delete: true,
  };
}

function readOnlyActions(): OperationsModulePermissions {
  return {
    read: true,
    create: false,
    update: false,
    delete: false,
  };
}

function readWriteActions(): OperationsModulePermissions {
  return {
    read: true,
    create: true,
    update: true,
    delete: true,
  };
}

function buildPermissionMap(
  overrides: Partial<
    Record<OperationsPermissionModule, OperationsModulePermissions>
  >,
): OperationsPermissionMap {
  const map = {} as OperationsPermissionMap;
  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    map[moduleKey] = overrides[moduleKey] ?? denyAllActions();
  }
  return map;
}

/** Full access — current Operations Admin / Super Admin. */
export function buildSuperAdminPermissions(): OperationsPermissionMap {
  const map = {} as OperationsPermissionMap;
  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    map[moduleKey] = allowAllActions();
  }
  return map;
}

/**
 * Default role matrices matching current API access patterns.
 * Team Management can later override these per custom role.
 */
export const OPERATIONS_ROLE_PERMISSION_DEFAULTS: Record<
  OperationsTeamRole,
  OperationsPermissionMap
> = {
  SUPER_ADMIN: buildSuperAdminPermissions(),
  OPERATIONS: buildPermissionMap({
    dashboard: readOnlyActions(),
    my_work: readWriteActions(),
    work_queue: readWriteActions(),
    whatsapp: readWriteActions(),
    journey_alerts: readOnlyActions(),
    support: readWriteActions(),
    employers: readWriteActions(),
    candidates: readWriteActions(),
    jobs: readWriteActions(),
    verifications: readWriteActions(),
    escalations: readWriteActions(),
    reports: readOnlyActions(),
  }),
  SUPPORT: buildPermissionMap({
    dashboard: readOnlyActions(),
    my_work: readWriteActions(),
    work_queue: readOnlyActions(),
    whatsapp: readWriteActions(),
    journey_alerts: readOnlyActions(),
    support: readWriteActions(),
    candidates: readOnlyActions(),
    jobs: readOnlyActions(),
    escalations: readOnlyActions(),
  }),
  MARKETING: buildPermissionMap({
    dashboard: readOnlyActions(),
    campaigns: readWriteActions(),
    reports: readOnlyActions(),
    employers: readOnlyActions(),
    jobs: readOnlyActions(),
  }),
  CONTENT_LANGUAGE: buildPermissionMap({
    dashboard: readOnlyActions(),
    jobs: readOnlyActions(),
    campaigns: readOnlyActions(),
  }),
  SALES: buildPermissionMap({
    dashboard: readOnlyActions(),
    employers: readWriteActions(),
    jobs: readOnlyActions(),
    billing: readOnlyActions(),
    reports: readOnlyActions(),
  }),
  CUSTOM: buildPermissionMap({}),
};

export function resolveOperationsPermissions(
  role: OperationsTeamRole,
): OperationsPermissionMap {
  if (role === "SUPER_ADMIN") {
    return buildSuperAdminPermissions();
  }

  return (
    OPERATIONS_ROLE_PERMISSION_DEFAULTS[role] ?? buildPermissionMap({})
  );
}

export function canOperationsPermission(
  permissions: OperationsPermissionMap,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): boolean {
  return Boolean(permissions[module]?.[action]);
}

export function canOperationsRolePermission(
  role: OperationsTeamRole,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): boolean {
  return canOperationsPermission(
    resolveOperationsPermissions(role),
    module,
    action,
  );
}

export function listGrantedOperationsPermissions(
  permissions: OperationsPermissionMap,
): string[] {
  const granted: string[] = [];
  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    for (const action of OPERATIONS_PERMISSION_ACTIONS) {
      if (permissions[moduleKey][action]) {
        granted.push(`${moduleKey}:${action}`);
      }
    }
  }
  return granted;
}
