import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { assertJobWriteFieldsAllowed } from "./job-write-field-access.js";
import { sanitizeJobDto } from "../rbac/field-access.response.js";
import { sendSuccess } from "../../utils/api-response.js";
import { jobService } from "./job.service.js";
import {
  resolveJobViewVisitor,
  setJobViewGuestCookie,
} from "./job-view.visitor.js";
import type {
  BulkDeleteJobsBody,
  CreateJobInput,
  ListEmployerJobsQuery,
  PublicJobsQuery,
  SaveDraftJobInput,
  SimilarPublicJobsQuery,
  UpdateJobStatusInput,
} from "./job.validation.js";

function resolveClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return req.ip ?? null;
}

function resolveActorDisplayName(req: Request): string {
  const companyName =
    typeof req.employer?.companyName === "string"
      ? req.employer.companyName.trim()
      : "";
  return companyName || "Employer";
}

export class JobController {
  create = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as CreateJobInput;
    assertJobWriteFieldsAllowed(req.rbac, body);
    const result = await jobService.createJob(employerId, body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Job posted successfully.",
      data: {
        ...result,
        job: sanitizeJobDto(
          req.rbac,
          result.job as unknown as Record<string, unknown>,
        ),
      },
    });
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const query = req.query as unknown as ListEmployerJobsQuery;
    const result = await jobService.listEmployerJobs(employerId, query);
    const jobs = result.jobs.map((job) =>
      sanitizeJobDto(req.rbac, job as unknown as Record<string, unknown>),
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Jobs fetched successfully.",
      data: { ...result, jobs },
    });
  };

  stats = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await jobService.getEmployerJobStats(employerId);
    const recentJobs = result.recentJobs.map((job) =>
      sanitizeJobDto(req.rbac, job as unknown as Record<string, unknown>),
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job statistics fetched successfully.",
      data: { ...result, recentJobs },
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
      data: {
        ...result,
        job: sanitizeJobDto(
          req.rbac,
          result.job as unknown as Record<string, unknown>,
        ),
      },
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const result = await jobService.deleteJob(employerId, jobId, {
      teamMemberId: req.teamMemberId,
      displayName: resolveActorDisplayName(req),
      ip: resolveClientIp(req),
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job deleted successfully.",
      data: result,
    });
  };

  bulkRemove = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as BulkDeleteJobsBody;
    const result = await jobService.bulkDeleteJobs({
      employerId,
      body,
      actor: {
        teamMemberId: req.teamMemberId,
        displayName: resolveActorDisplayName(req),
        ip: resolveClientIp(req),
      },
    });

    const orphanApps =
      "orphanCleanup" in result && result.orphanCleanup
        ? result.orphanCleanup.deletedApplicationsCount
        : 0;

    sendSuccess(res, HTTP_STATUS.OK, {
      message:
        result.deletedCount === 0
          ? orphanApps > 0
            ? `No jobs remained. Cleaned ${orphanApps} orphan application(s) and related hiring data.`
            : "No jobs matched the delete request."
          : `${result.deletedCount} job(s) deleted successfully.`,
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
    const job = sanitizeJobDto(
      req.rbac,
      result.job as unknown as Record<string, unknown>,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job fetched successfully.",
      data: { ...result, job },
    });
  };

  createDraft = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as SaveDraftJobInput;
    assertJobWriteFieldsAllowed(req.rbac, body);
    const result = await jobService.createDraft(employerId, body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Draft saved successfully.",
      data: {
        ...result,
        job: sanitizeJobDto(
          req.rbac,
          result.job as unknown as Record<string, unknown>,
        ),
      },
    });
  };

  updateDraft = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as SaveDraftJobInput;
    assertJobWriteFieldsAllowed(req.rbac, body);
    const result = await jobService.updateDraft(employerId, jobId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Draft updated successfully.",
      data: {
        ...result,
        job: sanitizeJobDto(
          req.rbac,
          result.job as unknown as Record<string, unknown>,
        ),
      },
    });
  };

  publishDraft = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as CreateJobInput;
    assertJobWriteFieldsAllowed(req.rbac, body);
    const result = await jobService.publishDraft(employerId, jobId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job published successfully.",
      data: {
        ...result,
        job: sanitizeJobDto(
          req.rbac,
          result.job as unknown as Record<string, unknown>,
        ),
      },
    });
  };

  updateActive = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { jobId } = req.params as { jobId: string };
    const body = req.body as CreateJobInput;
    assertJobWriteFieldsAllowed(req.rbac, body);
    const result = await jobService.updateActiveJob(employerId, jobId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job updated successfully.",
      data: {
        ...result,
        job: sanitizeJobDto(
          req.rbac,
          result.job as unknown as Record<string, unknown>,
        ),
      },
    });
  };

  getPublicByPublicId = async (req: Request, res: Response): Promise<void> => {
    const { publicJobId } = req.params as { publicJobId: string };
    const visitor = resolveJobViewVisitor(req, req.jobSeekerId);

    const result = await jobService.getPublicActiveJobByPublicId(publicJobId, {
      jobSeekerId: req.jobSeekerId,
      visitorType: visitor.visitorType,
      visitorId: visitor.visitorId,
    });

    if (visitor.shouldSetGuestCookie) {
      setJobViewGuestCookie(res, visitor.visitorId);
    }

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job fetched successfully.",
      data: result,
    });
  };

  listSimilarPublic = async (req: Request, res: Response): Promise<void> => {
    const { publicJobId } = req.params as { publicJobId: string };
    const query = req.query as unknown as SimilarPublicJobsQuery;
    const result = await jobService.listSimilarPublicJobs(
      publicJobId,
      query,
      req.jobSeekerId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Similar jobs fetched successfully.",
      data: result,
    });
  };

  listPublic = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PublicJobsQuery;
    const result = await jobService.listPublicActiveJobs(
      query,
      req.jobSeekerId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Active jobs fetched successfully.",
      data: result,
    });
  };
}

export const jobController = new JobController();
