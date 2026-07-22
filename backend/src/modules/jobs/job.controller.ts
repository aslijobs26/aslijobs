import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { jobService } from "./job.service.js";
import type {
  CreateJobInput,
  ListEmployerJobsQuery,
  PublicJobsQuery,
  SaveDraftJobInput,
  UpdateJobStatusInput,
} from "./job.validation.js";

export class JobController {
  create = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as CreateJobInput;
    const result = await jobService.createJob(employerId, body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Job posted successfully.",
      data: result,
    });
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const query = req.query as unknown as ListEmployerJobsQuery;
    const result = await jobService.listEmployerJobs(employerId, query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Jobs fetched successfully.",
      data: result,
    });
  };

  stats = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await jobService.getEmployerJobStats(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job statistics fetched successfully.",
      data: result,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as UpdateJobStatusInput;
    const result = await jobService.updateJobStatus(
      employerId,
      jobId,
      body.action,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job status updated successfully.",
      data: result,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const result = await jobService.deleteJob(employerId, jobId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job deleted successfully.",
      data: result,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const result = await jobService.getOwnedJob(employerId, jobId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job fetched successfully.",
      data: result,
    });
  };

  createDraft = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as SaveDraftJobInput;
    const result = await jobService.createDraft(employerId, body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Draft saved successfully.",
      data: result,
    });
  };

  updateDraft = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as SaveDraftJobInput;
    const result = await jobService.updateDraft(employerId, jobId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Draft updated successfully.",
      data: result,
    });
  };

  publishDraft = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as CreateJobInput;
    const result = await jobService.publishDraft(employerId, jobId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job published successfully.",
      data: result,
    });
  };

  updateActive = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as CreateJobInput;
    const result = await jobService.updateActiveJob(employerId, jobId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job updated successfully.",
      data: result,
    });
  };

  getPublicByPublicId = async (req: Request, res: Response): Promise<void> => {
    const { publicJobId } = req.params as { publicJobId: string };
    const result = await jobService.getPublicActiveJobByPublicId(publicJobId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job fetched successfully.",
      data: result,
    });
  };

  listPublic = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PublicJobsQuery;
    const result = await jobService.listPublicActiveJobs(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Active jobs fetched successfully.",
      data: result,
    });
  };
}

export const jobController = new JobController();
