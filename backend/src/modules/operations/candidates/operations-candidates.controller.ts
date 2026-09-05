import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { assertOperationsPermissionKey } from "../rbac/operations-access.service.js";
import {
  sanitizeCandidateDetail,
  sanitizeCandidateListItem,
} from "../rbac/operations-field-sanitize.js";
import { operationsCandidatesService } from "./operations-candidates.service.js";
import type {
  ListOperationsCandidateApplicationsQuery,
  ListOperationsCandidatesQuery,
  OperationsCandidateApplicationIdParams,
  OperationsCandidateSeekerIdParams,
} from "./operations-candidates.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsCandidatesController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsCandidatesQuery;
    const result = await operationsCandidatesService.listCandidates(query);
    const access = requireAccess(req);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidates fetched successfully.",
      data: {
        ...result,
        applications: result.applications.map((item) =>
          sanitizeCandidateListItem(item, access),
        ),
      },
    });
  },

  async getBySeekerId(req: Request, res: Response): Promise<void> {
    const { jobSeekerId } = req.params as OperationsCandidateSeekerIdParams;
    const result = await operationsCandidatesService.getSeekerDetail(jobSeekerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidate details fetched successfully.",
      data: sanitizeCandidateDetail(result, requireAccess(req)),
    });
  },

  async listSeekerApplications(req: Request, res: Response): Promise<void> {
    assertOperationsPermissionKey(
      requireAccess(req),
      "candidates.profile.applications.view",
    );
    const { jobSeekerId } = req.params as OperationsCandidateSeekerIdParams;
    const query =
      req.query as unknown as ListOperationsCandidateApplicationsQuery;
    const result = await operationsCandidatesService.listSeekerApplications(
      jobSeekerId,
      query,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidate applications fetched successfully.",
      data: result,
    });
  },

  async getByApplicationId(req: Request, res: Response): Promise<void> {
    const { applicationId } =
      req.params as OperationsCandidateApplicationIdParams;
    const result =
      await operationsCandidatesService.getApplicationDetail(applicationId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidate details fetched successfully.",
      data: sanitizeCandidateDetail(result, requireAccess(req)),
    });
  },
};
