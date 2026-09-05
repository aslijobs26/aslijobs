import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsDepartmentsService } from "./operations-departments.service.js";
import type {
  CreateOperationsDepartmentBody,
  ListOperationsDepartmentsQuery,
  OperationsDepartmentIdParams,
  UpdateOperationsDepartmentBody,
} from "./operations-departments.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsDepartmentsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsDepartmentsQuery;
    const data = await operationsDepartmentsService.list(query);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Departments fetched successfully.",
      data,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateOperationsDepartmentBody;
    const data = await operationsDepartmentsService.create(
      requireAccess(req),
      body,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Department created successfully.",
      data,
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { departmentId } = req.params as OperationsDepartmentIdParams;
    const body = req.body as UpdateOperationsDepartmentBody;
    const data = await operationsDepartmentsService.update(
      requireAccess(req),
      departmentId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Department updated successfully.",
      data,
    });
  },
};
