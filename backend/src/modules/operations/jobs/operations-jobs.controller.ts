import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsJobsService } from "./operations-jobs.service.js";
import type {
  AssignOperationsJobEmployerBody,
  ListOperationsJobApplicationsQuery,
  ListOperationsJobsQuery,
  OperationsJobPublicIdParams,
  PublishOperationsJobBody,
  SaveOperationsJobDraftBody,
  UpdateOperationsJobStatusBody,
} from "./operations-jobs.validation.js";

export const operationsJobsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsJobsQuery;
    const result = await operationsJobsService.listJobs(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations jobs fetched successfully.",
      data: result,
    });
  },

  async getByJobId(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as OperationsJobPublicIdParams;
    const result = await operationsJobsService.getJobDetail(jobId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations job details fetched successfully.",
      data: result,
    });
  },

  async listApplications(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as OperationsJobPublicIdParams;
    const query = req.query as unknown as ListOperationsJobApplicationsQuery;
    const result = await operationsJobsService.listJobApplications(jobId, query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations job applications fetched successfully.",
      data: result,
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as OperationsJobPublicIdParams;
    const body = req.body as UpdateOperationsJobStatusBody;
    const operationsUserId = req.operationsUserId;

    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await operationsJobsService.updateJobStatus(
      jobId,
      body.action,
      operationsUserId,
      body.reason,
    );

    const closedSuccessfully = body.action === "close" && result.status === "closed";
    const approvedSuccessfully =
      body.action === "approve" && result.status === "active";
    const rejectedSuccessfully =
      body.action === "reject" && result.status === "rejected";

    let message = "Job status updated successfully.";
    if (closedSuccessfully) {
      message = result.employerNotified
        ? "Job closed and employer notified successfully."
        : "Job closed. The employer notification could not be sent. You can retry Close Job to send it.";
    } else if (approvedSuccessfully) {
      message = result.reviewNotificationSent
        ? "Job approved and published. Employer notified successfully."
        : "Job approved and published. The employer notification could not be sent.";
    } else if (rejectedSuccessfully) {
      message = result.reviewNotificationSent
        ? "Job rejected and employer notified successfully."
        : "Job rejected. The employer notification could not be sent.";
    }

    sendSuccess(res, HTTP_STATUS.OK, {
      message,
      data: result,
    });
  },

  async createDraft(req: Request, res: Response): Promise<void> {
    const body = req.body as SaveOperationsJobDraftBody;
    const operationsUserId = req.operationsUserId;

    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await operationsJobsService.createDraft(
      operationsUserId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Operations job draft saved successfully.",
      data: result,
    });
  },

  async updateDraft(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as OperationsJobPublicIdParams;
    const body = req.body as SaveOperationsJobDraftBody;
    const operationsUserId = req.operationsUserId;

    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await operationsJobsService.updateDraft(
      operationsUserId,
      jobId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job updated successfully.",
      data: result,
    });
  },

  async assignEmployer(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as OperationsJobPublicIdParams;
    const body = req.body as AssignOperationsJobEmployerBody;
    const operationsUserId = req.operationsUserId;

    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await operationsJobsService.assignEmployer(
      operationsUserId,
      jobId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer assigned successfully.",
      data: result,
    });
  },

  async publishDraft(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as OperationsJobPublicIdParams;
    const body = req.body as PublishOperationsJobBody;
    const operationsUserId = req.operationsUserId;

    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await operationsJobsService.publishDraft(
      operationsUserId,
      jobId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job published successfully.",
      data: result,
    });
  },
};
