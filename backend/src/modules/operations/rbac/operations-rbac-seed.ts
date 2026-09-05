import { catalogKeysMatchingMatrix } from "./operations-permission-projection.js";
import { OperationsRoleModel } from "./operations-role.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import {
  OPERATIONS_ROLE_PERMISSION_DEFAULTS,
  type OperationsPermissionMap,
} from "../auth/operations-rbac.js";
import type { OperationsTeamRole } from "../operations.constants.js";

const LEGACY_ROLES_TO_SEED: Array<{
  role: Exclude<OperationsTeamRole, "SUPER_ADMIN" | "CUSTOM">;
  name: string;
}> = [
  { role: "OPERATIONS", name: "Operations" },
  { role: "SUPPORT", name: "Support" },
  { role: "MARKETING", name: "Marketing" },
  { role: "CONTENT_LANGUAGE", name: "Content Language" },
  { role: "SALES", name: "Sales" },
];

function grantsFromMatrix(matrix: OperationsPermissionMap) {
  return catalogKeysMatchingMatrix(matrix).map((item) => ({
    key: item.key,
    access: "allow" as const,
    canDelegate: false,
  }));
}

/**
 * Idempotent seed:
 * 1. Create custom role documents matching historical static role matrices.
 * 2. Attach those roles to existing users that still only have the enum field.
 * SUPER_ADMIN users are left as system-level accounts.
 */
export async function ensureOperationsRbacSeed(): Promise<void> {
  for (const item of LEGACY_ROLES_TO_SEED) {
    const slug = `legacy-${item.role.toLowerCase()}`;
    const matrix = OPERATIONS_ROLE_PERMISSION_DEFAULTS[item.role];
    const grants = grantsFromMatrix(matrix);

    const existing = await OperationsRoleModel.findOne({ slug });
    if (!existing) {
      await OperationsRoleModel.create({
        name: item.name,
        slug,
        description: `Migrated from the previous ${item.role} static role matrix.`,
        status: "active",
        grants,
        isSystemSeeded: true,
        legacyRoleKey: item.role,
        canCreateRoles: false,
        canManageUsers: false,
        canAssignRoles: false,
        revision: 1,
      });
    }
  }

  const seededRoles = await OperationsRoleModel.find({
    isSystemSeeded: true,
    legacyRoleKey: { $in: LEGACY_ROLES_TO_SEED.map((item) => item.role) },
    status: "active",
  })
    .select("_id legacyRoleKey")
    .lean();

  const roleIdByLegacy = new Map(
    seededRoles
      .filter((role) => role.legacyRoleKey)
      .map((role) => [role.legacyRoleKey as string, role._id]),
  );

  for (const item of LEGACY_ROLES_TO_SEED) {
    const roleId = roleIdByLegacy.get(item.role);
    if (!roleId) {
      continue;
    }

    await OperationsTeamUserModel.updateMany(
      {
        role: item.role,
        $or: [{ roleId: null }, { roleId: { $exists: false } }],
      },
      { $set: { roleId } },
    );
  }
}
