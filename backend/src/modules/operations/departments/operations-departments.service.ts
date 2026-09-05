import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { slugifyOperationsName } from "../rbac/operations-slug.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import type {
  CreateOperationsDepartmentBody,
  ListOperationsDepartmentsQuery,
  UpdateOperationsDepartmentBody,
} from "./operations-departments.validation.js";

function toPublicDepartment(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    status: doc.status,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
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

class OperationsDepartmentsService {
  async list(query: ListOperationsDepartmentsQuery) {
    const filter: Record<string, unknown> = {};
    if (query.status !== "all") {
      filter.status = query.status;
    }
    if (query.search.trim()) {
      filter.name = { $regex: query.search.trim(), $options: "i" };
    }

    const departments = await OperationsDepartmentModel.find(filter)
      .sort({ name: 1 })
      .lean();

    return {
      departments: departments.map(toPublicDepartment),
    };
  }

  async create(
    actor: OperationsResolvedAccess,
    body: CreateOperationsDepartmentBody,
  ) {
    const name = body.name.trim();
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

    const department = await OperationsDepartmentModel.create({
      name,
      slug: await uniqueSlug(name),
      description: body.description?.trim() ?? "",
      status: "active",
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "department.created",
      targetType: "department",
      targetId: String(department._id),
      targetLabel: department.name,
      nextState: { name: department.name },
    });

    return toPublicDepartment(department);
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
      description: department.description,
      status: department.status,
    };

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
      department.slug = await uniqueSlug(department.name, String(department._id));
    }

    if (body.description !== undefined) {
      department.description = body.description.trim();
    }

    if (body.status && body.status !== department.status) {
      if (body.status === "archived") {
        const [roleCount, userCount] = await Promise.all([
          OperationsRoleModel.countDocuments({
            departmentId: department._id,
            status: "active",
          }),
          OperationsTeamUserModel.countDocuments({
            departmentId: department._id,
            status: { $ne: "inactive" },
          }),
        ]);
        if (roleCount > 0 || userCount > 0) {
          throw new AppError(
            "Reassign roles and members before archiving this department.",
            HTTP_STATUS.CONFLICT,
          );
        }
        department.status = "archived";
        department.archivedAt = new Date();
        department.archivedBy = new mongoose.Types.ObjectId(actor.userId);
      } else {
        department.status = "active";
        department.archivedAt = null;
        department.archivedBy = null;
      }
    }

    department.updatedBy = new mongoose.Types.ObjectId(actor.userId);
    await department.save();

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action:
        body.status === "archived"
          ? "department.archived"
          : "department.updated",
      targetType: "department",
      targetId: String(department._id),
      targetLabel: department.name,
      previousState: previous,
      nextState: {
        name: department.name,
        description: department.description,
        status: department.status,
      },
    });

    return toPublicDepartment(department);
  }
}

export const operationsDepartmentsService = new OperationsDepartmentsService();
