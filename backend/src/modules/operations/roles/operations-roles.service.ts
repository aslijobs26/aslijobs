import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import type { OperationsRoleGrant } from "../rbac/operations-role.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { wouldCreateRoleCycle } from "../rbac/operations-delegation.js";
import {
  getRoleAncestorIds,
  getRoleDescendantIds,
  isRoleWithinActorScope,
} from "../rbac/operations-access.service.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { slugifyOperationsName } from "../rbac/operations-slug.js";
import { buildOperationsPermissionCatalogTree, listOperationsPermissionProjectionDefinitions } from "../rbac/operations-permission-catalog.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { prepareRoleGrants } from "./operations-role-grants.js";
import {
  scheduleRoleCreatedNotifications,
  roleCreatedNotifyFromActor,
} from "./operations-role-notify.js";
import type {
  ArchiveOperationsRoleBody,
  CreateOperationsRoleBody,
  ListOperationsRolesQuery,
  RestoreOperationsRoleBody,
  UpdateOperationsRoleBody,
} from "./operations-roles.validation.js";

function toPublicRole(
  role: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string | null;
    status: string;
    departmentId?: mongoose.Types.ObjectId | null;
    parentRoleId?: mongoose.Types.ObjectId | null;
    depth?: number;
    canCreateRoles?: boolean;
    canManageUsers?: boolean;
    canAssignRoles?: boolean;
    grants?: OperationsRoleGrant[];
    isSystemSeeded?: boolean;
    revision?: number;
    createdBy?: mongoose.Types.ObjectId | null;
    updatedBy?: mongoose.Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
    archivedAt?: Date | null;
  },
  extras?: {
    departmentName?: string | null;
    parentRoleName?: string | null;
    createdByName?: string | null;
    updatedByName?: string | null;
    memberCount?: number;
    childCount?: number;
  },
) {
  return {
    id: String(role._id),
    name: role.name,
    slug: role.slug,
    description: role.description ?? "",
    status: role.status,
    departmentId: role.departmentId ? String(role.departmentId) : null,
    departmentName: extras?.departmentName ?? null,
    parentRoleId: role.parentRoleId ? String(role.parentRoleId) : null,
    parentRoleName: extras?.parentRoleName ?? null,
    depth: role.depth ?? 0,
    canCreateRoles: Boolean(role.canCreateRoles),
    canManageUsers: Boolean(role.canManageUsers),
    canAssignRoles: Boolean(role.canAssignRoles),
    grants: role.grants ?? [],
    isSystemSeeded: Boolean(role.isSystemSeeded),
    revision: role.revision ?? 1,
    memberCount: extras?.memberCount ?? 0,
    childCount: extras?.childCount ?? 0,
    createdBy: role.createdBy ? String(role.createdBy) : null,
    createdByName: extras?.createdByName ?? null,
    updatedBy: role.updatedBy ? String(role.updatedBy) : null,
    updatedByName: extras?.updatedByName ?? null,
    createdAt: role.createdAt?.toISOString() ?? null,
    updatedAt: role.updatedAt?.toISOString() ?? null,
    archivedAt: role.archivedAt?.toISOString() ?? null,
  };
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugifyOperationsName(name);
  if (!base) {
    throw new AppError("Role name is invalid.", HTTP_STATUS.BAD_REQUEST);
  }
  let slug = base;
  let suffix = 2;
  while (
    await OperationsRoleModel.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function assertDepartment(departmentId: string | null) {
  if (!departmentId) {
    return null;
  }
  const department = await OperationsDepartmentModel.findOne({
    _id: departmentId,
    status: "active",
  }).lean();
  if (!department) {
    throw new AppError("Department not found.", HTTP_STATUS.BAD_REQUEST);
  }
  return department;
}

class OperationsRolesService {
  catalog() {
    return {
      tree: buildOperationsPermissionCatalogTree(),
      definitions: listOperationsPermissionProjectionDefinitions(),
    };
  }

  async list(actor: OperationsResolvedAccess, query: ListOperationsRolesQuery) {
    const filter: Record<string, unknown> = {};
    if (query.status !== "all") {
      filter.status = query.status;
    }
    if (query.search.trim()) {
      filter.name = { $regex: query.search.trim(), $options: "i" };
    }
    if (query.departmentId) {
      filter.departmentId = query.departmentId;
    }

    if (!actor.isSuperAdmin) {
      if (!actor.roleId) {
        return {
          roles: [],
          pagination: buildListPagination(query.page, query.limit, 0),
        };
      }
      const descendantIds = await getRoleDescendantIds(actor.roleId);
      filter._id = { $in: [actor.roleId, ...descendantIds] };
    }

    const total = await OperationsRoleModel.countDocuments(filter);
    const pagination = buildListPagination(query.page, query.limit, total);
    const roles = await OperationsRoleModel.find(filter)
      .sort({ name: 1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean();
    const roleIds = roles.map((role) => role._id);
    const [memberCounts, childCounts, departments, parents, users] =
      await Promise.all([
        OperationsTeamUserModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
          { $match: { roleId: { $in: roleIds } } },
          { $group: { _id: "$roleId", count: { $sum: 1 } } },
        ]),
        OperationsRoleModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
          { $match: { parentRoleId: { $in: roleIds } } },
          { $group: { _id: "$parentRoleId", count: { $sum: 1 } } },
        ]),
        OperationsDepartmentModel.find({
          _id: {
            $in: roles
              .map((role) => role.departmentId)
              .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
          },
        })
          .select("name")
          .lean(),
        OperationsRoleModel.find({
          _id: {
            $in: roles
              .map((role) => role.parentRoleId)
              .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
          },
        })
          .select("name")
          .lean(),
        OperationsTeamUserModel.find({
          _id: {
            $in: roles
              .flatMap((role) => [role.createdBy, role.updatedBy])
              .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
          },
        })
          .select("fullName")
          .lean(),
      ]);

    const memberCountById = new Map(
      memberCounts.map((row) => [String(row._id), row.count]),
    );
    const childCountById = new Map(
      childCounts.map((row) => [String(row._id), row.count]),
    );
    const departmentNameById = new Map(
      departments.map((row) => [String(row._id), row.name]),
    );
    const parentNameById = new Map(
      parents.map((row) => [String(row._id), row.name]),
    );
    const userNameById = new Map(
      users.map((row) => [String(row._id), row.fullName]),
    );

    return {
      roles: roles.map((role) =>
        toPublicRole(role, {
          departmentName: role.departmentId
            ? departmentNameById.get(String(role.departmentId)) ?? null
            : null,
          parentRoleName: role.parentRoleId
            ? parentNameById.get(String(role.parentRoleId)) ?? null
            : null,
          createdByName: role.createdBy
            ? userNameById.get(String(role.createdBy)) ?? null
            : null,
          updatedByName: role.updatedBy
            ? userNameById.get(String(role.updatedBy)) ?? null
            : null,
          memberCount: memberCountById.get(String(role._id)) ?? 0,
          childCount: childCountById.get(String(role._id)) ?? 0,
        }),
      ),
      pagination,
    };
  }

  async getById(actor: OperationsResolvedAccess, roleId: string) {
    const role = await OperationsRoleModel.findById(roleId).lean();
    if (!role) {
      throw new AppError("Role not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!(await isRoleWithinActorScope(actor, roleId))) {
      throw new AppError(
        "Access denied. You do not have permission to view this role.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const [memberCount, children, department, parent, createdBy, updatedBy, members, audit] =
      await Promise.all([
        OperationsTeamUserModel.countDocuments({ roleId: role._id }),
        OperationsRoleModel.find({ parentRoleId: role._id })
          .select("name status")
          .lean(),
        role.departmentId
          ? OperationsDepartmentModel.findById(role.departmentId)
              .select("name")
              .lean()
          : null,
        role.parentRoleId
          ? OperationsRoleModel.findById(role.parentRoleId).select("name").lean()
          : null,
        role.createdBy
          ? OperationsTeamUserModel.findById(role.createdBy)
              .select("fullName")
              .lean()
          : null,
        role.updatedBy
          ? OperationsTeamUserModel.findById(role.updatedBy)
              .select("fullName")
              .lean()
          : null,
        OperationsTeamUserModel.find({ roleId: role._id })
          .select("fullName email status lastActiveAt")
          .limit(50)
          .lean(),
        actor.isSuperAdmin || actor.permissions.activity_logs.read
          ? OperationsAuditLogModel.find({
              targetType: "role",
              targetId: roleId,
            })
              .sort({ createdAt: -1 })
              .limit(50)
              .lean()
          : [],
      ]);

    return {
      role: toPublicRole(role, {
        departmentName: department?.name ?? null,
        parentRoleName: parent?.name ?? null,
        createdByName: createdBy?.fullName ?? null,
        updatedByName: updatedBy?.fullName ?? null,
        memberCount,
        childCount: children.length,
      }),
      members: members.map((member) => ({
        id: String(member._id),
        fullName: member.fullName,
        email: member.email ?? "",
        status: member.status,
        lastActiveAt: member.lastActiveAt
          ? new Date(member.lastActiveAt).toISOString()
          : null,
      })),
      childRoles: children.map((child) => ({
        id: String(child._id),
        name: child.name,
        status: child.status,
      })),
      auditEvents: audit.map((event) => ({
        id: String(event._id),
        action: event.action,
        actorName: event.actorName,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : null,
        reason: event.reason,
      })),
    };
  }

  async hierarchy(actor: OperationsResolvedAccess) {
    const { roles } = await this.list(actor, {
      search: "",
      status: "active",
      departmentId: "",
      page: 1,
      limit: 100,
    });

    const listedIds = new Set(roles.map((role) => role.id));
    const byParent = new Map<string | null, typeof roles>();
    for (const role of roles) {
      const parentId =
        role.parentRoleId && listedIds.has(role.parentRoleId)
          ? role.parentRoleId
          : null;
      const list = byParent.get(parentId) ?? [];
      list.push(role);
      byParent.set(parentId, list);
    }

    type RoleTreeNode = (typeof roles)[number] & { children: RoleTreeNode[] };
    const build = (parentId: string | null): RoleTreeNode[] =>
      (byParent.get(parentId) ?? []).map((role) => ({
        ...role,
        children: build(role.id),
      }));

    const roots = build(null);

    return {
      tree: actor.isSuperAdmin
        ? [
            {
              id: "SUPER_ADMIN",
              name: "Super Admin",
              slug: "super-admin",
              description: "Highest level role with full system access.",
              status: "active",
              departmentId: null,
              departmentName: null,
              parentRoleId: null,
              parentRoleName: null,
              depth: 0,
              canCreateRoles: true,
              canManageUsers: true,
              canAssignRoles: true,
              grants: [],
              isSystemSeeded: true,
              memberCount: 0,
              childCount: roots.length,
              createdBy: null,
              createdByName: null,
              updatedBy: null,
              updatedByName: null,
              createdAt: null,
              updatedAt: null,
              archivedAt: null,
              revision: 1,
              isSystemRoot: true,
              children: roots,
            },
          ]
        : roots,
    };
  }

  async create(actor: OperationsResolvedAccess, body: CreateOperationsRoleBody) {
    if (!actor.isSuperAdmin && !actor.canCreateRoles) {
      throw new AppError(
        "You are not allowed to create roles.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const name = body.name.trim();
    const clash = await OperationsRoleModel.findOne({
      name,
      status: "active",
    }).lean();
    if (clash) {
      throw new AppError(
        "A role with this name already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }

    let grants;
    try {
      grants = prepareRoleGrants({
        requestedGrants: body.grants ?? [],
        isSuperAdmin: actor.isSuperAdmin,
        actorDelegatableKeys: actor.delegatableKeys,
      });
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 403) {
        await recordOperationsAuditEvent({
          actorUserId: actor.userId,
          actorName: actor.roleName ?? "",
          action: "role.creation_rejected_permission_escalation",
          targetType: "role",
          targetId: "pending",
          targetLabel: name,
          nextState: {
            reason: error.message,
            requestedGrantCount: body.grants?.length ?? 0,
          },
        }).catch(() => undefined);
      }
      throw error;
    }

    let parentRoleId =
      body.parentRoleId && body.parentRoleId !== ""
        ? String(body.parentRoleId)
        : actor.isSuperAdmin
          ? null
          : actor.roleId;

    if (!actor.isSuperAdmin) {
      if (!actor.roleId) {
        throw new AppError(
          "You cannot create roles until a custom role is assigned to you.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      if (!parentRoleId) {
        parentRoleId = actor.roleId;
      }
      if (!(await isRoleWithinActorScope(actor, parentRoleId))) {
        throw new AppError(
          "You can only create roles under your own hierarchy.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
    }

    if (parentRoleId) {
      const parent = await OperationsRoleModel.findById(parentRoleId).lean();
      if (!parent || parent.status !== "active") {
        throw new AppError(
          "Parent role is not available.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    const departmentId =
      body.departmentId && body.departmentId !== ""
        ? String(body.departmentId)
        : actor.departmentId;
    await assertDepartment(departmentId);

    if (!actor.isSuperAdmin) {
      if (body.canCreateRoles && !actor.canCreateRoles) {
        throw new AppError(
          "You cannot grant role-creation to a child role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      if (body.canManageUsers && !actor.canManageUsers) {
        throw new AppError(
          "You cannot grant user management to a child role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      if (body.canAssignRoles && !actor.canAssignRoles) {
        throw new AppError(
          "You cannot grant role assignment to a child role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
    }

    const parentDepth = parentRoleId
      ? ((await OperationsRoleModel.findById(parentRoleId).select("depth").lean())
          ?.depth ?? 0)
      : -1;

    const role = await OperationsRoleModel.create({
      name,
      slug: await uniqueSlug(name),
      description: body.description?.trim() ?? "",
      status: "active",
      departmentId: departmentId || null,
      parentRoleId: parentRoleId || null,
      depth: parentDepth + 1,
      canCreateRoles: Boolean(body.canCreateRoles),
      canManageUsers: Boolean(body.canManageUsers),
      canAssignRoles: Boolean(body.canAssignRoles),
      grants,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "role.created",
      targetType: "role",
      targetId: String(role._id),
      targetLabel: role.name,
      nextState: {
        name: role.name,
        parentRoleId,
        grants,
        canCreateRoles: role.canCreateRoles,
      },
    });

    scheduleRoleCreatedNotifications(
      roleCreatedNotifyFromActor(role, actor, actor.departmentName),
    );

    return toPublicRole(role);
  }

  async update(
    actor: OperationsResolvedAccess,
    roleId: string,
    body: UpdateOperationsRoleBody,
  ) {
    const role = await OperationsRoleModel.findById(roleId);
    if (!role) {
      throw new AppError("Role not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!(await isRoleWithinActorScope(actor, roleId))) {
      throw new AppError(
        "You cannot modify this role.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    if (!actor.isSuperAdmin && actor.roleId === roleId) {
      throw new AppError(
        "You cannot modify your own role.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const previous = {
      name: role.name,
      grants: role.grants,
      canCreateRoles: role.canCreateRoles,
      parentRoleId: role.parentRoleId ? String(role.parentRoleId) : null,
    };

    const expectedRevision = Number(body.expectedRevision);
    const currentRevision = Number(role.revision ?? 1);
    if (
      !Number.isInteger(expectedRevision) ||
      expectedRevision < 1 ||
      expectedRevision !== currentRevision
    ) {
      throw new AppError(
        "This role was updated by someone else. Reload and try again.",
        HTTP_STATUS.CONFLICT,
        { expectedRevision: body.expectedRevision, currentRevision },
      );
    }

    const $set: Record<string, unknown> = {
      updatedBy: new mongoose.Types.ObjectId(actor.userId),
    };

    if (body.grants) {
      $set.grants = prepareRoleGrants({
        requestedGrants: body.grants,
        isSuperAdmin: actor.isSuperAdmin,
        actorDelegatableKeys: actor.delegatableKeys,
      });
    }

    if (body.name && body.name.trim() !== role.name) {
      const clash = await OperationsRoleModel.findOne({
        name: body.name.trim(),
        status: "active",
        _id: { $ne: role._id },
      }).lean();
      if (clash) {
        throw new AppError(
          "A role with this name already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }
      $set.name = body.name.trim();
      $set.slug = await uniqueSlug(String($set.name), String(role._id));
    }

    if (body.description !== undefined) {
      $set.description = body.description.trim();
    }

    if (body.parentRoleId !== undefined) {
      const nextParentId =
        body.parentRoleId && body.parentRoleId !== ""
          ? String(body.parentRoleId)
          : null;
      if (nextParentId) {
        const ancestors = await getRoleAncestorIds(nextParentId);
        if (wouldCreateRoleCycle(roleId, nextParentId, ancestors)) {
          throw new AppError(
            "This parent would create a circular role hierarchy.",
            HTTP_STATUS.BAD_REQUEST,
          );
        }
        if (
          !actor.isSuperAdmin &&
          !(await isRoleWithinActorScope(actor, nextParentId))
        ) {
          throw new AppError(
            "You can only place roles inside your hierarchy.",
            HTTP_STATUS.FORBIDDEN,
          );
        }
        const parent = await OperationsRoleModel.findById(nextParentId).lean();
        if (!parent || parent.status !== "active") {
          throw new AppError(
            "Parent role is not available.",
            HTTP_STATUS.BAD_REQUEST,
          );
        }
        $set.parentRoleId = new mongoose.Types.ObjectId(nextParentId);
        $set.depth = (parent.depth ?? 0) + 1;
      } else if (actor.isSuperAdmin) {
        $set.parentRoleId = null;
        $set.depth = 0;
      }
    }

    if (body.departmentId !== undefined) {
      const departmentId =
        body.departmentId && body.departmentId !== ""
          ? String(body.departmentId)
          : null;
      await assertDepartment(departmentId);
      $set.departmentId = departmentId
        ? new mongoose.Types.ObjectId(departmentId)
        : null;
    }

    if (body.canCreateRoles !== undefined) {
      if (!actor.isSuperAdmin && body.canCreateRoles && !actor.canCreateRoles) {
        throw new AppError(
          "You cannot grant role-creation to this role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      $set.canCreateRoles = body.canCreateRoles;
    }
    if (body.canManageUsers !== undefined) {
      if (!actor.isSuperAdmin && body.canManageUsers && !actor.canManageUsers) {
        throw new AppError(
          "You cannot grant user management to this role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      $set.canManageUsers = body.canManageUsers;
    }
    if (body.canAssignRoles !== undefined) {
      if (!actor.isSuperAdmin && body.canAssignRoles && !actor.canAssignRoles) {
        throw new AppError(
          "You cannot grant role assignment to this role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      $set.canAssignRoles = body.canAssignRoles;
    }

    // Atomic CAS: only one concurrent writer with this revision can win.
    const updated = await OperationsRoleModel.findOneAndUpdate(
      { _id: roleId, revision: expectedRevision },
      { $set, $inc: { revision: 1 } },
      { new: true },
    );

    if (!updated) {
      const latest = await OperationsRoleModel.findById(roleId)
        .select("revision")
        .lean();
      throw new AppError(
        "This role was updated by someone else. Reload and try again.",
        HTTP_STATUS.CONFLICT,
        {
          expectedRevision,
          currentRevision: latest?.revision ?? null,
        },
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "role.updated",
      targetType: "role",
      targetId: roleId,
      targetLabel: updated.name,
      previousState: previous,
      nextState: {
        name: updated.name,
        grants: updated.grants,
        canCreateRoles: updated.canCreateRoles,
        parentRoleId: updated.parentRoleId
          ? String(updated.parentRoleId)
          : null,
        revision: updated.revision,
      },
    });

    return toPublicRole(updated);
  }

  async archive(
    actor: OperationsResolvedAccess,
    roleId: string,
    body: ArchiveOperationsRoleBody,
  ) {
    const role = await OperationsRoleModel.findById(roleId);
    if (!role) {
      throw new AppError("Role not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!(await isRoleWithinActorScope(actor, roleId))) {
      throw new AppError("You cannot archive this role.", HTTP_STATUS.FORBIDDEN);
    }

    const expectedRevision = Number(body.expectedRevision);
    const currentRevision = role.revision ?? 1;
    if (
      !Number.isInteger(expectedRevision) ||
      expectedRevision < 1 ||
      expectedRevision !== currentRevision
    ) {
      throw new AppError(
        "This role was updated by someone else. Reload and try again.",
        HTTP_STATUS.CONFLICT,
        { expectedRevision: body.expectedRevision, currentRevision },
      );
    }

    const [memberCount, childCount] = await Promise.all([
      OperationsTeamUserModel.countDocuments({ roleId: role._id }),
      OperationsRoleModel.countDocuments({
        parentRoleId: role._id,
        status: "active",
      }),
    ]);

    if (childCount > 0) {
      throw new AppError(
        "Archive or reparent child roles before archiving this role.",
        HTTP_STATUS.CONFLICT,
      );
    }

    if (memberCount > 0) {
      if (!body.reassignRoleId) {
        throw new AppError(
          "Reassign assigned members before archiving this role.",
          HTTP_STATUS.CONFLICT,
        );
      }
      if (!(await isRoleWithinActorScope(actor, body.reassignRoleId))) {
        throw new AppError(
          "You cannot reassign members to that role.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      const target = await OperationsRoleModel.findOne({
        _id: body.reassignRoleId,
        status: "active",
      }).lean();
      if (!target) {
        throw new AppError("Reassignment role was not found.", HTTP_STATUS.BAD_REQUEST);
      }
      await OperationsTeamUserModel.updateMany(
        { roleId: role._id },
        { $set: { roleId: target._id, role: "CUSTOM" } },
      );
    }

    const archivedAt = new Date();
    const updated = await OperationsRoleModel.findOneAndUpdate(
      { _id: roleId, revision: expectedRevision, status: { $ne: "archived" } },
      {
        $set: {
          status: "archived",
          archivedAt,
          archivedBy: new mongoose.Types.ObjectId(actor.userId),
          updatedBy: new mongoose.Types.ObjectId(actor.userId),
        },
        $inc: { revision: 1 },
      },
      { new: true },
    );

    if (!updated) {
      const latest = await OperationsRoleModel.findById(roleId)
        .select("revision status")
        .lean();
      throw new AppError(
        "This role was updated by someone else. Reload and try again.",
        HTTP_STATUS.CONFLICT,
        {
          expectedRevision,
          currentRevision: latest?.revision ?? null,
        },
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "role.archived",
      targetType: "role",
      targetId: roleId,
      targetLabel: updated.name,
      metadata: {
        reassignRoleId: body.reassignRoleId || null,
        memberCount,
        revision: updated.revision,
      },
    });

    return toPublicRole(updated);
  }

  async restore(
    actor: OperationsResolvedAccess,
    roleId: string,
    body: RestoreOperationsRoleBody,
  ) {
    const role = await OperationsRoleModel.findById(roleId);
    if (!role) {
      throw new AppError("Role not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!(await isRoleWithinActorScope(actor, roleId))) {
      throw new AppError("You cannot restore this role.", HTTP_STATUS.FORBIDDEN);
    }

    const expectedRevision = Number(body.expectedRevision);
    const currentRevision = role.revision ?? 1;
    if (
      !Number.isInteger(expectedRevision) ||
      expectedRevision < 1 ||
      expectedRevision !== currentRevision
    ) {
      throw new AppError(
        "This role was updated by someone else. Reload and try again.",
        HTTP_STATUS.CONFLICT,
        { expectedRevision: body.expectedRevision, currentRevision },
      );
    }

    const updated = await OperationsRoleModel.findOneAndUpdate(
      { _id: roleId, revision: expectedRevision, status: "archived" },
      {
        $set: {
          status: "active",
          archivedAt: null,
          archivedBy: null,
          updatedBy: new mongoose.Types.ObjectId(actor.userId),
        },
        $inc: { revision: 1 },
      },
      { new: true },
    );

    if (!updated) {
      const latest = await OperationsRoleModel.findById(roleId)
        .select("revision status")
        .lean();
      throw new AppError(
        "This role was updated by someone else. Reload and try again.",
        HTTP_STATUS.CONFLICT,
        {
          expectedRevision,
          currentRevision: latest?.revision ?? null,
        },
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "role.restored",
      targetType: "role",
      targetId: roleId,
      targetLabel: updated.name,
      metadata: { revision: updated.revision },
    });

    return toPublicRole(updated);
  }
}

export const operationsRolesService = new OperationsRolesService();
