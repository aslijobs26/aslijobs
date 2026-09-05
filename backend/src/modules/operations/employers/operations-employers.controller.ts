import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { assertOperationsPermissionKey } from "../rbac/operations-access.service.js";
import {
  sanitizeEmployerDetail,
  sanitizeEmployerListItem,
} from "../rbac/operations-field-sanitize.js";
import { operationsEmployersService } from "./operations-employers.service.js";
import type {
  ListOperationsEmployerJobsQuery,
  ListOperationsEmployersQuery,
  OperationsEmployerIdParams,
  UpdateOperationsEmployerStatusBody,
  UpdateOperationsEmployerVerificationBody,
} from "./operations-employers.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsEmployersController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsEmployersQuery;
    const result = await operationsEmployersService.listEmployers(query);
    const access = requireAccess(req);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employers fetched successfully.",
      data: {
        ...result,
        employers: result.employers.map((item) =>
          sanitizeEmployerListItem(item, access),
        ),
      },
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.getEmployerById(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employer fetched successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },

  async listJobs(req: Request, res: Response): Promise<void> {
    assertOperationsPermissionKey(
      requireAccess(req),
      "employers.profile.jobs.view",
    );
    const { employerId } = req.params as OperationsEmployerIdParams;
    const query = req.query as unknown as ListOperationsEmployerJobsQuery;
    const result = await operationsEmployersService.listEmployerJobs(
      employerId,
      query,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employer jobs fetched successfully.",
      data: result,
    });
  },

  async updateVerification(req: Request, res: Response): Promise<void> {
    const body = req.body as UpdateOperationsEmployerVerificationBody;
    const key =
      body.verificationStatus === "rejected"
        ? "employers.profile.actions.reject"
        : "employers.profile.actions.verify";
    assertOperationsPermissionKey(requireAccess(req), key);

    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.updateVerification(
      employerId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer verification updated successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const body = req.body as UpdateOperationsEmployerStatusBody;
    const key =
      body.status === "active"
        ? "employers.profile.actions.activate"
        : "employers.profile.actions.suspend";
    assertOperationsPermissionKey(requireAccess(req), key);

    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.updateStatus(
      employerId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer status updated successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },
};
