import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { departmentService } from "./department.service.js";
import type {
  CreateDepartmentInput,
  ListDepartmentsQuery,
  ListMemberOptionsQuery,
  UpdateDepartmentInput,
} from "./department.validation.js";

function requireEmployerId(req: Request): string {
  if (!req.employerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.employerId;
}

export class DepartmentController {
  getStats = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const result = await departmentService.getStats(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team statistics fetched successfully.",
      data: result,
    });
  };

  listMemberOptions = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListMemberOptionsQuery;
    const result = await departmentService.listMemberOptions(employerId, query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team members fetched successfully.",
      data: { members: result },
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as CreateDepartmentInput;
    const result = await departmentService.createDepartment(employerId, body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Department created successfully.",
      data: result,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListDepartmentsQuery;
    const result = await departmentService.listDepartments(employerId, query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Departments fetched successfully.",
      data: result,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { departmentId } = req.params as { departmentId: string };
    const result = await departmentService.getDepartment(
      employerId,
      departmentId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Department fetched successfully.",
      data: result,
    });
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { departmentId } = req.params as { departmentId: string };
    const result = await departmentService.getDepartmentDetails(
      employerId,
      departmentId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Department details fetched successfully.",
      data: result,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { departmentId } = req.params as { departmentId: string };
    const body = req.body as UpdateDepartmentInput;
    const result = await departmentService.updateDepartment(
      employerId,
      departmentId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Department updated successfully.",
      data: result,
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { departmentId } = req.params as { departmentId: string };
    const result = await departmentService.deactivateDepartment(
      employerId,
      departmentId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Department deactivated successfully.",
      data: result,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { departmentId } = req.params as { departmentId: string };
    const result = await departmentService.deleteDepartment(
      employerId,
      departmentId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Department deleted successfully.",
      data: result,
    });
  };
}

export const departmentController = new DepartmentController();
