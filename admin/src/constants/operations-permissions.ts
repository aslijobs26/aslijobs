import type { OperationsTeamRole } from "../types/roles";

/**
 * Operations RBAC catalog (admin mirror of backend operations-rbac).
 * Keep aligned with `backend/src/modules/operations/auth/operations-rbac.ts`.
 * Future Team Management UI will edit role matrices against this catalog.
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

export function buildSuperAdminPermissions(): OperationsPermissionMap {
  const map = {} as OperationsPermissionMap;
  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    map[moduleKey] = allowAllActions();
  }
  return map;
}

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

  return OPERATIONS_ROLE_PERMISSION_DEFAULTS[role] ?? buildPermissionMap({});
}

export function canOperationsPermission(
  permissions: OperationsPermissionMap | null | undefined,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): boolean {
  if (!permissions) {
    return false;
  }
  return Boolean(permissions[module]?.[action]);
}

/**
 * Prefer session.permissions from the API; fall back to role defaults when
 * cached/legacy session payloads lack the matrix (e.g. mid-deploy).
 */
export function resolveEffectiveOperationsPermissions(
  role: OperationsTeamRole,
  permissions?: OperationsPermissionMap | null,
): OperationsPermissionMap {
  if (permissions) {
    return permissions;
  }
  if (role === "CUSTOM") {
    return buildPermissionMap({});
  }
  return resolveOperationsPermissions(role);
}
