import mongoose, { type Types } from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  buildSuperAdminPermissions,
  canOperationsPermission,
  resolveOperationsPermissions,
  type OperationsPermissionAction,
  type OperationsPermissionModule,
} from "../auth/operations-rbac.js";
import type { OperationsTeamRole } from "../operations.constants.js";
import { OperationsDepartmentModel } from "./operations-department.model.js";
import { OperationsRoleModel } from "./operations-role.model.js";
import { catalogKeysMatchingMatrix } from "./operations-permission-projection.js";
import { projectGrantedKeysToMatrix } from "./operations-permission-projection.js";
import { isOperationsPermissionKey } from "./operations-permission-catalog.js";
import type { OperationsResolvedAccess } from "./operations-access.types.js";

export function operationsAccessCan(
  access: OperationsResolvedAccess | undefined,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): boolean {
  if (!access) {
    return false;
  }
  if (access.isSuperAdmin) {
    return true;
  }
  return canOperationsPermission(access.permissions, module, action);
}

export function operationsAccessCanKey(
  access: OperationsResolvedAccess | undefined,
  key: string,
): boolean {
  if (!access) {
    return false;
  }
  if (access.isSuperAdmin) {
    return true;
  }
  return access.grantedKeys.includes(key);
}

export function operationsAccessCanDelegate(
  access: OperationsResolvedAccess | undefined,
  key: string,
): boolean {
  if (!access) {
    return false;
  }
  if (access.isSuperAdmin) {
    return true;
  }
  return access.delegatableKeys.includes(key);
}

export function assertOperationsPermission(
  access: OperationsResolvedAccess | undefined,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): void {
  if (!operationsAccessCan(access, module, action)) {
    throw new AppError(
      "Access denied. You do not have permission to perform this action.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

export function assertOperationsPermissionKey(
  access: OperationsResolvedAccess | undefined,
  key: string,
): void {
  if (!operationsAccessCanKey(access, key)) {
    throw new AppError(
      "Access denied. You do not have permission to perform this action.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

function toIdString(value: Types.ObjectId | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return String(value);
}

export async function resolveOperationsUserAccess(user: {
  _id: Types.ObjectId | string;
  role: OperationsTeamRole;
  roleId?: Types.ObjectId | string | null;
  departmentId?: Types.ObjectId | string | null;
}): Promise<OperationsResolvedAccess> {
  const userId = String(user._id);
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (isSuperAdmin) {
    const allKeys = catalogKeysMatchingMatrix(buildSuperAdminPermissions()).map(
      (item) => item.key,
    );
    return {
      userId,
      role: user.role,
      roleId: null,
      roleName: "Super Admin",
      departmentId: toIdString(user.departmentId),
      departmentName: null,
      isSuperAdmin: true,
      canCreateRoles: true,
      canManageUsers: true,
      canAssignRoles: true,
      grantedKeys: allKeys,
      delegatableKeys: allKeys,
      permissions: buildSuperAdminPermissions(),
      parentRoleId: null,
    };
  }

  const roleId = toIdString(user.roleId);
  if (roleId && mongoose.isValidObjectId(roleId)) {
    const customRole = await OperationsRoleModel.findById(roleId).lean();
    if (customRole && customRole.status === "active") {
      const grantedKeys = customRole.grants
        .filter((grant) => grant.access === "allow")
        .map((grant) => grant.key)
        .filter((key) => isOperationsPermissionKey(key));
      const delegatableKeys = customRole.grants
        .filter((grant) => grant.access === "allow" && grant.canDelegate)
        .map((grant) => grant.key)
        .filter((key) => isOperationsPermissionKey(key));

      let departmentName: string | null = null;
      const departmentId =
        toIdString(user.departmentId) ?? toIdString(customRole.departmentId);
      if (departmentId && mongoose.isValidObjectId(departmentId)) {
        const department = await OperationsDepartmentModel.findById(departmentId)
          .select("name status")
          .lean();
        if (department && department.status === "active") {
          departmentName = department.name;
        }
      }

      return {
        userId,
        role: user.role,
        roleId,
        roleName: customRole.name,
        departmentId,
        departmentName,
        isSuperAdmin: false,
        canCreateRoles: Boolean(customRole.canCreateRoles),
        canManageUsers: Boolean(customRole.canManageUsers),
        canAssignRoles: Boolean(customRole.canAssignRoles),
        grantedKeys,
        delegatableKeys,
        permissions: projectGrantedKeysToMatrix(grantedKeys, false),
        parentRoleId: toIdString(customRole.parentRoleId),
      };
    }
  }

  if (user.role === "CUSTOM") {
    return {
      userId,
      role: user.role,
      roleId,
      roleName: "Unassigned",
      departmentId: toIdString(user.departmentId),
      departmentName: null,
      isSuperAdmin: false,
      canCreateRoles: false,
      canManageUsers: false,
      canAssignRoles: false,
      grantedKeys: [],
      delegatableKeys: [],
      permissions: projectGrantedKeysToMatrix([], false),
      parentRoleId: null,
    };
  }

  const fallbackMatrix = resolveOperationsPermissions(user.role);
  const fallbackKeys = catalogKeysMatchingMatrix(fallbackMatrix).map(
    (item) => item.key,
  );

  return {
    userId,
    role: user.role,
    roleId,
    roleName: user.role,
    departmentId: toIdString(user.departmentId),
    departmentName: null,
    isSuperAdmin: false,
    canCreateRoles: false,
    canManageUsers: false,
    canAssignRoles: false,
    grantedKeys: fallbackKeys,
    delegatableKeys: [],
    permissions: fallbackMatrix,
    parentRoleId: null,
  };
}

export async function getRoleAncestorIds(
  roleId: string | null,
): Promise<string[]> {
  if (!roleId || !mongoose.isValidObjectId(roleId)) {
    return [];
  }

  const ancestors: string[] = [];
  let currentId: string | null = roleId;
  const seen = new Set<string>();

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const roleDoc: { parentRoleId?: unknown } | null =
      await OperationsRoleModel.findById(currentId)
        .select("parentRoleId")
        .lean();
    if (!roleDoc?.parentRoleId) {
      break;
    }
    currentId = String(roleDoc.parentRoleId);
    ancestors.push(currentId);
  }

  return ancestors;
}

export async function getRoleDescendantIds(roleId: string): Promise<string[]> {
  const descendants: string[] = [];
  const queue = [roleId];
  const seen = new Set<string>([roleId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const children = await OperationsRoleModel.find({
      parentRoleId: current,
    })
      .select("_id")
      .lean();

    for (const child of children) {
      const childId = String(child._id);
      if (seen.has(childId)) {
        continue;
      }
      seen.add(childId);
      descendants.push(childId);
      queue.push(childId);
    }
  }

  return descendants;
}

export async function isRoleWithinActorScope(
  access: OperationsResolvedAccess,
  targetRoleId: string,
): Promise<boolean> {
  if (access.isSuperAdmin) {
    return true;
  }

  if (!access.roleId) {
    return false;
  }

  if (access.roleId === targetRoleId) {
    return true;
  }

  const descendants = await getRoleDescendantIds(access.roleId);
  return descendants.includes(targetRoleId);
}
