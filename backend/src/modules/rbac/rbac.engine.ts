import type {
  ModulePermission,
  RoleFieldAccessMap,
  RolePermissionsMatrix,
  TeamPermissionAction,
  TeamPermissionModule,
} from "../team/team-permissions.js";
import {
  createPermissionsForAccessLevel,
  normalizePermissionsMatrix,
  TEAM_PERMISSION_MODULES,
} from "../team/team-permissions.js";

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

export function buildOwnerRbacContext(employerId: string): ResolvedRbacContext {
  return {
    principalType: "owner",
    employerId,
    memberId: null,
    roleId: null,
    roleName: "Owner",
    isSuperAdmin: true,
    permissions: createPermissionsForAccessLevel("full_access"),
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

  return {
    principalType: "member",
    employerId: input.employerId,
    memberId: input.memberId,
    roleId: input.roleId,
    roleName: input.roleName,
    isSuperAdmin,
    permissions: normalizePermissionsMatrix(
      input.permissions as RolePermissionsMatrix | null,
      (input.accessLevel as "full_access" | "limited" | "view_only" | "custom") ??
        "custom",
    ),
    fieldAccess: (input.fieldAccess as RoleFieldAccessMap | null) ?? null,
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

export function canAccessField(
  context: ResolvedRbacContext,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
  mode: "read" | "write" = "read",
): boolean {
  if (context.isSuperAdmin) {
    return true;
  }

  if (!canPerform(context, moduleKey, mode === "write" ? "update" : "read")) {
    return false;
  }

  const fromFieldAccess = context.fieldAccess?.[moduleKey]?.[fieldKey];
  if (typeof fromFieldAccess === "boolean") {
    return fromFieldAccess;
  }

  const fromModuleFields = context.permissions[moduleKey]?.fields?.[fieldKey];
  if (typeof fromModuleFields === "boolean") {
    return fromModuleFields;
  }

  // Field-level map not configured → inherit module access.
  return true;
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
      {} as Record<
        TeamPermissionModule,
        Record<RbacAction, boolean>
      >,
    ),
  };
}

export type { TeamPermissionAction, TeamPermissionModule, ModulePermission };
export { CRUD_ACTIONS, TEAM_PERMISSION_MODULES };
