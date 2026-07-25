import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { applicationService } from "./application.service.js";
import type {
  ApplyToJobSchema,
  ListEmployerApplicationsQuerySchema,
  ListSeekerApplicationsQuerySchema,
  UpdateApplicationHiringSchema,
  UpdateApplicationNotesSchema,
  UpdateApplicationStatusSchema,
} from "./application.validation.js";

function requireEmployerId(req: Request): string {
  const employerId = req.employerId?.trim();
  if (!employerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return employerId;
}

function requireJobSeekerId(req: Request): string {
  const jobSeekerId = req.jobSeekerId?.trim();
  if (!jobSeekerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return jobSeekerId;
}

export class ApplicationController {
  apply = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const body = req.body as ApplyToJobSchema;
    const result = await applicationService.applyToJob({
      jobSeekerId,
      publicJobId: body.publicJobId,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Application submitted successfully.",
      data: result,
    });
  };

  listForSeeker = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const query = req.query as unknown as ListSeekerApplicationsQuerySchema;

    const result = await applicationService.listForSeeker({
      jobSeekerId,
      status: query.status,
      search: query.search,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Applications retrieved.",
      data: result,
    });
  };

  getStatsForSeeker = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const result = await applicationService.getStatsForSeeker({ jobSeekerId });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Application stats retrieved.",
      data: result,
    });
  };

  getForSeeker = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const applicationId = String(req.params.applicationId ?? "");

    const result = await applicationService.getForSeeker({
      jobSeekerId,
      applicationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Application retrieved.",
      data: result,
    });
  };

  withdrawForSeeker = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireJobSeekerId(req);
    const applicationId = String(req.params.applicationId ?? "");

    const result = await applicationService.withdrawForSeeker({
      jobSeekerId,
      applicationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Application withdrawn.",
      data: result,
    });
  };

  listForEmployer = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListEmployerApplicationsQuerySchema;

    const result = await applicationService.listForEmployer({
      employerId,
      publicJobId: query.publicJobId,
      status: query.status,
      search: query.search,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Applications retrieved.",
      data: result,
    });
  };

  getForEmployer = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");

    const result = await applicationService.getForEmployer({
      employerId,
      applicationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Application retrieved.",
      data: result,
    });
  };

  downloadPdfForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");

    const pdf = await applicationService.downloadSnapshotPdfForEmployer({
      employerId,
      applicationId,
    });

    res.setHeader("Content-Type", pdf.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdf.fileName}"`,
    );
    res.setHeader("Content-Length", String(pdf.buffer.length));
    res.status(HTTP_STATUS.OK).send(pdf.buffer);
  };

  updateStatusForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");
    const body = req.body as UpdateApplicationStatusSchema;

    const result = await applicationService.updateStatusForEmployer({
      employerId,
      applicationId,
      status: body.status,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Application status updated.",
      data: result,
    });
  };

  updateNotesForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");
    const body = req.body as UpdateApplicationNotesSchema;

    const result = await applicationService.updateNotesForEmployer({
      employerId,
      applicationId,
      notes: body.notes,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notes saved.",
      data: result,
    });
  };

  updateHiringForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");
    const body = req.body as UpdateApplicationHiringSchema;

    const result = await applicationService.updateHiringForEmployer({
      employerId,
      applicationId,
      status: body.status,
      interview: body.interview,
      offer: body.offer,
      rejectReason: body.rejectReason,
      employerNotesVisibleToSeeker: body.employerNotesVisibleToSeeker,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Hiring details updated.",
      data: result,
    });
  };
}

export const applicationController = new ApplicationController();
