import {
  coerceFieldAccessLevel,
  getCatalogField,
  normalizeFieldAccessMap,
  type FieldAccessLevel,
} from "../team/field-access.catalog.js";
import { generatePermissionsFromAccessLevel } from "../team/team-access-templates.js";
import type {
  ModulePermission,
  RoleFieldAccessMap,
  RolePermissionsMatrix,
  TeamPermissionModule,
} from "../team/team-permissions.js";
import {
  normalizePermissionsMatrix,
  TEAM_PERMISSION_MODULES,
} from "../team/team-permissions.js";
import type { TeamAccessLevel } from "../team/team.constants.js";

export type RbacPrincipalType = "owner" | "member";

export type ResolvedRbacContext = {
  principalType: RbacPrincipalType;
  employerId: string;
  memberId: string | null;
  roleId: string | null;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: RolePermissionsMatrix;
  fieldAccess: RoleFieldAccessMap | null;
};

export type RbacAction =
  | "fullAccess"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export";

const CRUD_ACTIONS: Exclude<RbacAction, "fullAccess">[] = [
  "create",
  "read",
  "update",
  "delete",
  "export",
];

const READ_LEVELS: FieldAccessLevel[] = ["view", "mask", "edit"];

export function buildOwnerRbacContext(employerId: string): ResolvedRbacContext {
  return {
    principalType: "owner",
    employerId,
    memberId: null,
    roleId: null,
    roleName: "Owner",
    isSuperAdmin: true,
    permissions: generatePermissionsFromAccessLevel("full_access"),
    fieldAccess: null,
  };
}

export function buildMemberRbacContext(input: {
  employerId: string;
  memberId: string;
  roleId: string;
  roleName: string;
  isSystem: boolean;
  permissions: unknown;
  fieldAccess: unknown;
  accessLevel?: string;
}): ResolvedRbacContext {
  const isSuperAdmin =
    input.isSystem && input.roleName.trim().toLowerCase() === "admin";
  const accessLevel = (input.accessLevel as TeamAccessLevel | undefined) ??
    "custom";

  const permissions =
    input.permissions == null
      ? generatePermissionsFromAccessLevel(accessLevel)
      : normalizePermissionsMatrix(
          input.permissions as RolePermissionsMatrix | null,
          accessLevel,
        );

  return {
    principalType: "member",
    employerId: input.employerId,
    memberId: input.memberId,
    roleId: input.roleId,
    roleName: input.roleName,
    isSuperAdmin,
    permissions,
    fieldAccess: normalizeFieldAccessMap(input.fieldAccess),
  };
}

function moduleAllows(
  modulePermission: ModulePermission,
  action: RbacAction,
): boolean {
  if (modulePermission.fullAccess) {
    return true;
  }
  if (action === "fullAccess") {
    return false;
  }
  return Boolean(modulePermission[action]);
}

export function canPerform(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  action: RbacAction,
): boolean {
  if (context.isSuperAdmin) {
    return true;
  }

  const modulePermission = context.permissions[moduleKey];
  if (!modulePermission) {
    return false;
  }

  return moduleAllows(modulePermission, action);
}

function resolveRawFieldLevel(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): FieldAccessLevel | null {
  const fromFieldAccess = context.fieldAccess?.[moduleKey]?.[fieldKey];
  const coercedFromMap = coerceFieldAccessLevel(fromFieldAccess);
  if (coercedFromMap) {
    return coercedFromMap;
  }

  const fromModuleFields = context.permissions[moduleKey]?.fields?.[fieldKey];
  return coerceFieldAccessLevel(fromModuleFields);
}

/**
 * Resolve the effective field access level for a module field.
 * Super-admin always gets `edit`. Without module read access → `hidden`.
 * Unset fields inherit module access as `edit`.
 */
export function getFieldLevel(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): FieldAccessLevel {
  if (context.isSuperAdmin) {
    return "edit";
  }

  if (!canPerform(context, moduleKey, "read")) {
    return "hidden";
  }

  const resolved = resolveRawFieldLevel(context, moduleKey, fieldKey);
  if (resolved) {
    return resolved;
  }

  return "edit";
}

export function isFieldMasked(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): boolean {
  return getFieldLevel(context, moduleKey, fieldKey) === "mask";
}

export function canAccessField(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
  mode: "read" | "write" = "read",
): boolean {
  if (context.isSuperAdmin) {
    return true;
  }

  if (mode === "write") {
    if (!canPerform(context, moduleKey, "update")) {
      return false;
    }
    return getFieldLevel(context, moduleKey, fieldKey) === "edit";
  }

  if (!canPerform(context, moduleKey, "read")) {
    return false;
  }

  return READ_LEVELS.includes(getFieldLevel(context, moduleKey, fieldKey));
}

export function canExportField(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): boolean {
  const level = getFieldLevel(context, moduleKey, fieldKey);
  return level === "view" || level === "edit";
}

export function listAllowedModules(
  context: ResolvedRbacContext,
  action: RbacAction = "read",
): TeamPermissionModule[] {
  return TEAM_PERMISSION_MODULES.filter((moduleKey) =>
    canPerform(context, moduleKey, action),
  );
}

export function serializeRbacContext(context: ResolvedRbacContext) {
  return {
    principalType: context.principalType,
    employerId: context.employerId,
    memberId: context.memberId,
    roleId: context.roleId,
    roleName: context.roleName,
    isSuperAdmin: context.isSuperAdmin,
    permissions: context.permissions,
    fieldAccess: context.fieldAccess,
    allowedModules: listAllowedModules(context, "read"),
    allowedActions: TEAM_PERMISSION_MODULES.reduce(
      (accumulator, moduleKey) => {
        accumulator[moduleKey] = {
          fullAccess: canPerform(context, moduleKey, "fullAccess"),
          create: canPerform(context, moduleKey, "create"),
          read: canPerform(context, moduleKey, "read"),
          update: canPerform(context, moduleKey, "update"),
          delete: canPerform(context, moduleKey, "delete"),
          export: canPerform(context, moduleKey, "export"),
        };
        return accumulator;
      },
      {} as Record<TeamPermissionModule, Record<RbacAction, boolean>>,
    ),
    actor: null as RbacSessionActor | null,
  };
}

export type RbacSessionActor = {
  fullName: string;
  email: string;
  roleName: string;
  departmentName: string | null;
  companyName: string;
  status: string;
  lastActiveAt: string | null;
};

export function getCatalogMaskStrategy(
  moduleKey: TeamPermissionModule,
  fieldKey: string,
) {
  return getCatalogField(moduleKey, fieldKey)?.maskStrategy ?? "generic";
}

export type { TeamPermissionModule, ModulePermission };
export { CRUD_ACTIONS, TEAM_PERMISSION_MODULES };
