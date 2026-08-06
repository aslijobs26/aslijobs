import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { savedJobService } from "./saved-job.service.js";
import type {
  ListSavedJobsQuerySchema,
  SaveJobBodySchema,
} from "./saved-job.validation.js";

function requireJobSeekerId(req: Request): string {
  const jobSeekerId = req.jobSeekerId?.trim();
  if (!jobSeekerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return jobSeekerId;
}

export const savedJobController = {
  save: async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const body = req.body as SaveJobBodySchema;

    const result = await savedJobService.saveJob({
      jobSeekerId,
      publicJobId: body.publicJobId,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Job saved successfully.",
      data: result,
    });
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const publicJobId = String(req.params.publicJobId ?? "");

    const result = await savedJobService.removeJob({
      jobSeekerId,
      publicJobId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job removed from saved list.",
      data: result,
    });
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const query = req.query as unknown as ListSavedJobsQuerySchema;

    const result = await savedJobService.list({
      jobSeekerId,
      tab: query.tab,
      search: query.search,
      sort: query.sort,
      location: query.location,
      jobType: query.jobType,
      workMode: query.workMode,
      schedule: query.schedule,
      experience: query.experience,
      company: query.company,
      perk: query.perk,
      minSalary: query.minSalary,
      maxSalary: query.maxSalary,
      page: query.page,
      limit: query.limit,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved jobs retrieved.",
      data: result,
    });
  },

  getStats: async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const result = await savedJobService.getStats({ jobSeekerId });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved job stats retrieved.",
      data: result,
    });
  },

  listIds: async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const result = await savedJobService.listIds({ jobSeekerId });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved job IDs retrieved.",
      data: result,
    });
  },
};
