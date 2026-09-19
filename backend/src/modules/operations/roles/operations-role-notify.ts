import { OperationsNotificationModel } from "../registration-awareness/operations-notification.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";

export type RoleCreatedNotifyInput = {
  roleId: string;
  roleName: string;
  actorUserId: string;
  actorName: string;
  departmentName?: string | null;
  parentRoleId?: string | null;
};

function idempotencyKey(roleId: string): string {
  return `role.created:${roleId}`;
}

/**
 * Notify Super Admins and role administrators about a new role.
 * Best-effort; never throws to the caller. Idempotent via role.created:{roleId}.
 */
export async function emitRoleCreatedNotifications(
  input: RoleCreatedNotifyInput,
): Promise<void> {
  const now = new Date();
  const key = idempotencyKey(input.roleId);
  const title = "New role created";
  const departmentLabel = input.departmentName?.trim() || "Unassigned";
  const body = `${input.roleName} · created by ${input.actorName || "Operations"} · ${departmentLabel}`;
  const actionPath = `/operations/roles/${encodeURIComponent(input.roleId)}/edit`;

  try {
    const [superAdmins, roleAdminRoleIds] = await Promise.all([
      OperationsTeamUserModel.find({
        role: "SUPER_ADMIN",
        status: "active",
      })
        .select("_id")
        .lean(),
      OperationsRoleModel.find({
        status: "active",
        $or: [
          { canCreateRoles: true },
          { canManageUsers: true },
          { "grants.key": "roles.view" },
          { "grants.key": "roles.create" },
        ],
      })
        .select("_id")
        .lean(),
    ]);

    const roleAdminUsers =
      roleAdminRoleIds.length > 0
        ? await OperationsTeamUserModel.find({
            status: "active",
            roleId: { $in: roleAdminRoleIds.map((role: { _id: unknown }) => role._id) },
          })
            .select("_id")
            .lean()
        : [];

    const recipientIds = new Set<string>();
    for (const user of superAdmins) {
      recipientIds.add(String(user._id));
    }
    for (const user of roleAdminUsers) {
      recipientIds.add(String(user._id));
    }
    // Creator already knows; skip duplicate personal noise unless they are the only admin.
    recipientIds.delete(input.actorUserId);

    if (recipientIds.size === 0) {
      // Fall back to a workspace broadcast for Super-Admin-only tenants where
      // the actor is the sole Super Admin (they still see it in inbox filters).
      await OperationsNotificationModel.updateOne(
        { idempotencyKey: key },
        {
          $setOnInsert: {
            idempotencyKey: key,
            type: "role.created",
            title,
            body,
            entityType: "role",
            entityId: input.roleId,
            actionPath,
            actorName: input.actorName || "SYSTEM",
            recipientUserId: null,
            metadata: {
              roleId: input.roleId,
              roleName: input.roleName,
              departmentName: input.departmentName ?? null,
              parentRoleId: input.parentRoleId ?? null,
              actorUserId: input.actorUserId,
            },
            reads: [],
            createdAt: now,
          },
        },
        { upsert: true },
      );
      return;
    }

    await Promise.all(
      [...recipientIds].map((recipientUserId) =>
        OperationsNotificationModel.updateOne(
          {
            idempotencyKey: `${key}:user:${recipientUserId}`,
          },
          {
            $setOnInsert: {
              idempotencyKey: `${key}:user:${recipientUserId}`,
              type: "role.created",
              title,
              body,
              entityType: "role",
              entityId: input.roleId,
              actionPath,
              actorName: input.actorName || "SYSTEM",
              recipientUserId,
              metadata: {
                roleId: input.roleId,
                roleName: input.roleName,
                departmentName: input.departmentName ?? null,
                parentRoleId: input.parentRoleId ?? null,
                actorUserId: input.actorUserId,
              },
              reads: [],
              createdAt: now,
            },
          },
          { upsert: true },
        ),
      ),
    );
  } catch (error) {
    console.error("[operations-roles] role.created notification failed", {
      roleId: input.roleId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

export function scheduleRoleCreatedNotifications(
  input: RoleCreatedNotifyInput,
): void {
  void emitRoleCreatedNotifications(input).catch((error) => {
    console.error("[operations-roles] role.created notification rejected", {
      roleId: input.roleId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export function roleCreatedNotifyFromActor(
  role: {
    _id: { toString(): string };
    name: string;
    parentRoleId?: { toString(): string } | null;
  },
  actor: OperationsResolvedAccess,
  departmentName?: string | null,
): RoleCreatedNotifyInput {
  return {
    roleId: String(role._id),
    roleName: role.name,
    actorUserId: actor.userId,
    actorName: actor.roleName ?? "Operations",
    departmentName: departmentName ?? actor.departmentName,
    parentRoleId: role.parentRoleId ? String(role.parentRoleId) : null,
  };
}
