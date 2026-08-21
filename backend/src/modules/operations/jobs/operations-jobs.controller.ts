import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsJobsService } from "./operations-jobs.service.js";
import type { ListOperationsJobsQuery } from "./operations-jobs.validation.js";

export const operationsJobsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsJobsQuery;
    const result = await operationsJobsService.listJobs(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations jobs fetched successfully.",
      data: result,
    });
  },
};
