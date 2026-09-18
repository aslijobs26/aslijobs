import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { slugifyOperationsName } from "../rbac/operations-slug.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  clearWorkDepartmentCache,
  OPEN_WORK_STATUSES,
} from "../work/operations-work-department.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import { OperationsTeamModel } from "../teams/operations-teams.model.js";
import { assertFineOrCoarsePermission } from "../rbac/operations-access.service.js";
import { DEPARTMENTS_ARCHIVE_KEY } from "../rbac/operations-permission-catalog.js";
import {
  buildDepartmentArchiveBlockedMessage,
  hasBlockingDepartmentDependencies,
  toDepartmentDependencyDetails,
  type OperationsDepartmentArchiveDependencies,
} from "./operations-departments-domain.js";
import type {
  CreateOperationsDepartmentBody,
  ListOperationsDepartmentsQuery,
  UpdateOperationsDepartmentBody,
} from "./operations-departments.validation.js";

type DepartmentDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  status: string;
  headUserId?: mongoose.Types.ObjectId | null;
  revision?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

function toPublicDepartment(
  doc: DepartmentDoc,
  counts?: { memberCount: number; teamCount: number; headName?: string | null },
) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    code: (doc.code && doc.code.trim()) || doc.slug,
    description: doc.description ?? "",
    status: doc.status,
    headUserId: doc.headUserId ? String(doc.headUserId) : null,
    headName: counts?.headName ?? null,
    revision: doc.revision ?? 1,
    memberCount: counts?.memberCount ?? 0,
    teamCount: counts?.teamCount ?? 0,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

function buildListFilter(
  query: ListOperationsDepartmentsQuery,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.status !== "all") {
    filter.status = query.status;
  }
  const search = query.search.trim();
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  return filter;
}

async function countMapForDepartments(
  departmentIds: mongoose.Types.ObjectId[],
): Promise<{
  memberCountById: Map<string, number>;
  teamCountById: Map<string, number>;
}> {
  if (departmentIds.length === 0) {
    return {
      memberCountById: new Map(),
      teamCountById: new Map(),
    };
  }

  const [memberRows, teamRows] = await Promise.all([
    OperationsTeamUserModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          departmentId: { $in: departmentIds },
          status: { $ne: "inactive" },
        },
      },
      { $group: { _id: "$departmentId", count: { $sum: 1 } } },
    ]),
    OperationsTeamModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          departmentId: { $in: departmentIds },
          status: "active",
        },
      },
      { $group: { _id: "$departmentId", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    memberCountById: new Map(
      memberRows.map((row) => [String(row._id), row.count]),
    ),
    teamCountById: new Map(teamRows.map((row) => [String(row._id), row.count])),
  };
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugifyOperationsName(name);
  if (!base) {
    throw new AppError("Department name is invalid.", HTTP_STATUS.BAD_REQUEST);
  }

  let slug = base;
  let suffix = 2;
  while (
    await OperationsDepartmentModel.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function resolveCreateCode(
  body: CreateOperationsDepartmentBody,
  excludeId?: string,
): Promise<string> {
  const rawCode = body.code?.trim() ?? "";
  const code = slugifyOperationsName(rawCode || body.name.trim());
  if (!code) {
    throw new AppError("Department code is invalid.", HTTP_STATUS.BAD_REQUEST);
  }
  const clash = await OperationsDepartmentModel.exists({
    code,
    status: "active",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (clash) {
    throw new AppError(
      "A department with this code already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }
  return code;
}

class OperationsDepartmentsService {
  async list(query: ListOperationsDepartmentsQuery) {
    const filter = buildListFilter(query);
    const total = await OperationsDepartmentModel.countDocuments(filter);
    const pagination = buildListPagination(query.page, query.limit, total);

    const departments = (await OperationsDepartmentModel.find(filter)
      .sort({ name: 1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean()) as DepartmentDoc[];

    const { memberCountById, teamCountById } = await countMapForDepartments(
      departments.map((department) => department._id),
    );

    return {
      departments: departments.map((department) =>
        toPublicDepartment(department, {
          memberCount: memberCountById.get(String(department._id)) ?? 0,
          teamCount: teamCountById.get(String(department._id)) ?? 0,
        }),
      ),
      pagination,
    };
  }

  async metrics() {
    const [
      totalDepartments,
      activeDepartments,
      memberAgg,
      departmentsWithTeams,
    ] = await Promise.all([
      OperationsDepartmentModel.countDocuments({}),
      OperationsDepartmentModel.countDocuments({ status: "active" }),
      OperationsTeamUserModel.aggregate<{
        _id: null;
        totalMembers: number;
      }>([
        {
          $match: {
            departmentId: { $ne: null },
            status: { $ne: "inactive" },
          },
        },
        {
          $group: {
            _id: null,
            totalMembers: { $sum: 1 },
          },
        },
      ]),
      // Teams = first-class OperationsTeam documents, never roles.
      OperationsTeamModel.distinct("departmentId", {
        status: "active",
        departmentId: { $ne: null },
      }),
    ]);

    return {
      totalDepartments,
      activeDepartments,
      departmentsWithTeams: departmentsWithTeams.filter(Boolean).length,
      totalMembers: memberAgg[0]?.totalMembers ?? 0,
    };
  }

  async getById(departmentId: string) {
    const department = (await OperationsDepartmentModel.findById(departmentId)
      .lean()) as DepartmentDoc | null;
    if (!department) {
      throw new AppError("Department not found.", HTTP_STATUS.NOT_FOUND);
    }

    const { memberCountById, teamCountById } = await countMapForDepartments([
      department._id,
    ]);

    return toPublicDepartment(department, {
      memberCount: memberCountById.get(String(department._id)) ?? 0,
      teamCount: teamCountById.get(String(department._id)) ?? 0,
    });
  }

  async getDependencies(departmentId: string) {
    const department = await OperationsDepartmentModel.findById(departmentId)
      .select("_id name status")
      .lean();
    if (!department) {
      throw new AppError("Department not found.", HTTP_STATUS.NOT_FOUND);
    }

    const dependencies = await this.collectArchiveDependencies(department._id);
    return {
      department: {
        id: String(department._id),
        name: department.name,
        status: department.status,
      },
      ...toDepartmentDependencyDetails(dependencies),
    };
  }

  async create(
    actor: OperationsResolvedAccess,
    body: CreateOperationsDepartmentBody,
  ) {
    const name = body.name.trim();
    if (name.length < 2) {
      throw new AppError(
        "Department name is required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existing = await OperationsDepartmentModel.findOne({
      name,
      status: "active",
    }).lean();
    if (existing) {
      throw new AppError(
        "A department with this name already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const slug = await uniqueSlug(name);
    const code = await resolveCreateCode(body);

    const department = await OperationsDepartmentModel.create({
      name,
      slug,
      code,
      description: body.description?.trim() ?? "",
      status: "active",
      headUserId: body.headUserId ? body.headUserId : null,
      revision: 1,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    clearWorkDepartmentCache();

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "department.created",
      targetType: "department",
      targetId: String(department._id),
      targetLabel: department.name,
      nextState: { name: department.name, slug: department.slug, code: department.code },
    });

    return toPublicDepartment(department.toObject() as DepartmentDoc, {
      memberCount: 0,
      teamCount: 0,
    });
  }

  async update(
    actor: OperationsResolvedAccess,
    departmentId: string,
    body: UpdateOperationsDepartmentBody,
  ) {
    const department = await OperationsDepartmentModel.findById(departmentId);
    if (!department) {
      throw new AppError("Department not found.", HTTP_STATUS.NOT_FOUND);
    }

    const previous = {
      name: department.name,
      code: department.code,
      description: department.description,
      status: department.status,
      revision: department.revision ?? 1,
    };

    if (
      body.expectedRevision != null &&
      (department.revision ?? 1) !== body.expectedRevision
    ) {
      throw new AppError(
        "This department was updated by someone else. Refresh and try again.",
        HTTP_STATUS.CONFLICT,
        { code: "STALE_REVISION" },
      );
    }

    if (body.name && body.name.trim() !== department.name) {
      const clash = await OperationsDepartmentModel.findOne({
        name: body.name.trim(),
        status: "active",
        _id: { $ne: department._id },
      }).lean();
      if (clash) {
        throw new AppError(
          "A department with this name already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }
      department.name = body.name.trim();
    }

    if (body.code && slugifyOperationsName(body.code) !== department.code) {
      department.code = await resolveCreateCode(
        { name: department.name, code: body.code, description: "" },
        String(department._id),
      );
    }

    if (body.description !== undefined) {
      department.description = body.description.trim();
    }
    if (body.headUserId !== undefined) {
      department.headUserId = body.headUserId
        ? new mongoose.Types.ObjectId(body.headUserId)
        : null;
    }

    let statusAction: "activated" | "deactivated" | null = null;
    if (body.status && body.status !== department.status) {
      if (body.status === "archived") {
        await this.assertCanArchive(actor, department);
        department.status = "archived";
        department.archivedAt = new Date();
        department.archivedBy = new mongoose.Types.ObjectId(actor.userId);
        statusAction = "deactivated";
      } else {
        department.status = "active";
        department.archivedAt = null;
        department.archivedBy = null;
        statusAction = "activated";
      }
    }

    department.updatedBy = new mongoose.Types.ObjectId(actor.userId);
    department.revision = (department.revision ?? 1) + 1;
    await department.save();
    clearWorkDepartmentCache();

    const auditAction =
      statusAction === "deactivated"
        ? "department.deactivated"
        : statusAction === "activated"
          ? "department.activated"
          : "department.updated";

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: auditAction,
      targetType: "department",
      targetId: String(department._id),
      targetLabel: department.name,
      previousState: previous,
      nextState: {
        name: department.name,
        code: department.code,
        description: department.description,
        status: department.status,
        revision: department.revision,
      },
      metadata:
        statusAction === "deactivated"
          ? { mode: "soft_archive" }
          : undefined,
    });

    const { memberCountById, teamCountById } = await countMapForDepartments([
      department._id,
    ]);

    return toPublicDepartment(department.toObject() as DepartmentDoc, {
      memberCount: memberCountById.get(String(department._id)) ?? 0,
      teamCount: teamCountById.get(String(department._id)) ?? 0,
    });
  }

  /**
   * Soft-deletes (archives) a department after authoritative dependency checks.
   * Hard delete is not used — matches existing Operations archive convention.
   */
  async remove(actor: OperationsResolvedAccess, departmentId: string) {
    const department = await OperationsDepartmentModel.findById(departmentId);
    if (!department) {
      throw new AppError("Department not found.", HTTP_STATUS.NOT_FOUND);
    }

    await this.assertCanArchive(actor, department);

    const previous = {
      name: department.name,
      description: department.description,
      status: department.status,
    };

    department.status = "archived";
    department.archivedAt = new Date();
    department.archivedBy = new mongoose.Types.ObjectId(actor.userId);
    department.updatedBy = new mongoose.Types.ObjectId(actor.userId);
    department.revision = (department.revision ?? 1) + 1;
    await department.save();
    clearWorkDepartmentCache();

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "department.deleted",
      targetType: "department",
      targetId: String(department._id),
      targetLabel: department.name,
      previousState: previous,
      nextState: {
        name: department.name,
        description: department.description,
        status: department.status,
      },
      metadata: { mode: "soft_archive" },
    });

    return toPublicDepartment(department.toObject() as DepartmentDoc, {
      memberCount: 0,
      teamCount: 0,
    });
  }

  private async collectArchiveDependencies(
    departmentId: mongoose.Types.ObjectId,
  ): Promise<OperationsDepartmentArchiveDependencies> {
    const [activeMembers, scopedRoles, openWorkItems, activeTeams] = await Promise.all([
      OperationsTeamUserModel.countDocuments({
        departmentId,
        status: { $ne: "inactive" },
      }),
      OperationsRoleModel.countDocuments({
        departmentId,
        status: "active",
      }),
      OperationsWorkItemModel.countDocuments({
        departmentId,
        status: { $in: [...OPEN_WORK_STATUSES] },
      }),
      OperationsTeamModel.countDocuments({
        departmentId,
        status: "active",
      }),
    ]);

    return { activeMembers, scopedRoles, openWorkItems, activeTeams };
  }

  private async assertCanArchive(
    actor: OperationsResolvedAccess,
    department: {
      _id: mongoose.Types.ObjectId;
      name: string;
    },
  ): Promise<void> {
    assertFineOrCoarsePermission(
      actor,
      DEPARTMENTS_ARCHIVE_KEY,
      "departments",
      "update",
    );
    const dependencies = await this.collectArchiveDependencies(department._id);
    if (!hasBlockingDepartmentDependencies(dependencies)) {
      return;
    }

    const details = toDepartmentDependencyDetails(dependencies);
    const message =
      dependencies.activeMembers > 0 &&
      dependencies.scopedRoles === 0 &&
      dependencies.openWorkItems === 0 &&
      dependencies.activeTeams === 0
        ? `This department cannot be deleted because it still has members assigned to it. Remove or reassign all members before deleting the department.`
        : buildDepartmentArchiveBlockedMessage(department.name, dependencies);

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "department.delete_blocked",
      targetType: "department",
      targetId: String(department._id),
      targetLabel: department.name,
      reason: message,
      metadata: details,
    });

    throw new AppError(message, HTTP_STATUS.CONFLICT, details);
  }
}

export const operationsDepartmentsService = new OperationsDepartmentsService();
