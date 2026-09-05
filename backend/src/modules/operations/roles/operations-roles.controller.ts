import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsRolesService } from "./operations-roles.service.js";
import type {
  ArchiveOperationsRoleBody,
  CreateOperationsRoleBody,
  ListOperationsRolesQuery,
  OperationsRoleIdParams,
  UpdateOperationsRoleBody,
} from "./operations-roles.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsRolesController = {
  async catalog(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Permission catalog fetched successfully.",
      data: operationsRolesService.catalog(),
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsRolesQuery;
    const data = await operationsRolesService.list(requireAccess(req), query);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Roles fetched successfully.",
      data,
    });
  },

  async hierarchy(req: Request, res: Response): Promise<void> {
    const data = await operationsRolesService.hierarchy(requireAccess(req));
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role hierarchy fetched successfully.",
      data,
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params as OperationsRoleIdParams;
    const data = await operationsRolesService.getById(requireAccess(req), roleId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role fetched successfully.",
      data,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateOperationsRoleBody;
    const data = await operationsRolesService.create(requireAccess(req), body);
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Role created successfully.",
      data,
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params as OperationsRoleIdParams;
    const body = req.body as UpdateOperationsRoleBody;
    const data = await operationsRolesService.update(
      requireAccess(req),
      roleId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role updated successfully.",
      data,
    });
  },

  async archive(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params as OperationsRoleIdParams;
    const body = req.body as ArchiveOperationsRoleBody;
    const data = await operationsRolesService.archive(
      requireAccess(req),
      roleId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role archived successfully.",
      data,
    });
  },

  async restore(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params as OperationsRoleIdParams;
    const data = await operationsRolesService.restore(
      requireAccess(req),
      roleId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role restored successfully.",
      data,
    });
  },
};
