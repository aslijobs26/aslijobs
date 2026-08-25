import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsCandidatesService } from "./operations-candidates.service.js";
import type {
  ListOperationsCandidatesQuery,
  OperationsCandidateApplicationIdParams,
  OperationsCandidateSeekerIdParams,
} from "./operations-candidates.validation.js";

export const operationsCandidatesController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsCandidatesQuery;
    const result = await operationsCandidatesService.listCandidates(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidates fetched successfully.",
      data: result,
    });
  },

  async getBySeekerId(req: Request, res: Response): Promise<void> {
    const { jobSeekerId } = req.params as OperationsCandidateSeekerIdParams;
    const result = await operationsCandidatesService.getSeekerDetail(jobSeekerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidate details fetched successfully.",
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
      data: result,
    });
  },
};
