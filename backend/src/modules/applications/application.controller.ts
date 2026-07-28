import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { applicationService } from "./application.service.js";
import { employerExportService } from "./employer-export.service.js";
import { employerResumeAccessService } from "./employer-resume-access.service.js";
import type { EmployerExportBodySchema } from "./employer-export.validation.js";
import type {
  ApplyToJobSchema,
  EmployerLocationSuggestionsQuerySchema,
  ListEmployerApplicationStatsQuerySchema,
  ListEmployerApplicationsQuerySchema,
  ListEmployerInterviewStatsQuerySchema,
  ListEmployerInterviewsQuerySchema,
  ListSeekerApplicationsQuerySchema,
  CancelApplicationInterviewSchema,
  UpdateApplicationHiringSchema,
  UpdateApplicationInterviewSchema,
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

function readEmployerDisplayName(req: Request): string {
  const employer = req.employer;
  if (!employer) {
    return "Employer";
  }

  const firstName =
    typeof employer.firstName === "string" ? employer.firstName.trim() : "";
  const lastName =
    typeof employer.lastName === "string" ? employer.lastName.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }

  const companyName =
    typeof employer.companyName === "string" ? employer.companyName.trim() : "";
  if (companyName) {
    return companyName;
  }

  const establishmentName =
    typeof employer.establishmentName === "string"
      ? employer.establishmentName.trim()
      : "";
  if (establishmentName) {
    return establishmentName;
  }

  return "Employer";
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
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      location: query.location,
      experience: query.experience,
      skills: query.skills,
      availability: query.availability,
      appliedFrom: query.appliedFrom,
      appliedTo: query.appliedTo,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Applications retrieved.",
      data: result,
    });
  };

  suggestLocationsForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as EmployerLocationSuggestionsQuerySchema;

    const result = await applicationService.suggestPreferredLocationsForEmployer({
      employerId,
      q: query.q,
      publicJobId: query.publicJobId,
      limit: query.limit,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Location suggestions retrieved.",
      data: result,
    });
  };

  getStatsForEmployer = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListEmployerApplicationStatsQuerySchema;

    const result = await applicationService.getStatsForEmployer({
      employerId,
      publicJobId: query.publicJobId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Application stats retrieved.",
      data: result,
    });
  };

  listInterviewsForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListEmployerInterviewsQuerySchema;

    const result = await applicationService.listInterviewsForEmployer({
      employerId,
      publicJobId: query.publicJobId,
      status: query.status,
      mode: query.mode,
      search: query.search,
      interviewer: query.interviewer,
      interviewFrom: query.interviewFrom,
      interviewTo: query.interviewTo,
      quickDate: query.quickDate,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      rescheduledOnly: query.rescheduledOnly,
      cancelledOnly: query.cancelledOnly,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Interviews retrieved.",
      data: result,
    });
  };

  getInterviewStatsForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query =
      req.query as unknown as ListEmployerInterviewStatsQuerySchema;

    const result = await applicationService.getInterviewStatsForEmployer({
      employerId,
      publicJobId: query.publicJobId,
      period: query.period,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Interview stats retrieved.",
      data: result,
    });
  };

  previewExportForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as EmployerExportBodySchema;

    const result = await employerExportService.preview({
      employerId,
      format: body.format,
      fields: body.fields,
      publicJobId: body.publicJobId || undefined,
      status: body.status,
      search: body.search,
      location: body.location,
      experience: body.experience,
      skills: body.skills,
      availability: body.availability,
      quickDateFilter: body.quickDateFilter,
      appliedFrom: body.appliedFrom,
      appliedTo: body.appliedTo,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Export preview retrieved.",
      data: result,
    });
  };

  exportForEmployer = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as EmployerExportBodySchema;

    const file = await employerExportService.export({
      employerId,
      format: body.format,
      fields: body.fields,
      publicJobId: body.publicJobId || undefined,
      status: body.status,
      search: body.search,
      location: body.location,
      experience: body.experience,
      skills: body.skills,
      availability: body.availability,
      quickDateFilter: body.quickDateFilter,
      appliedFrom: body.appliedFrom,
      appliedTo: body.appliedTo,
    });

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    res.setHeader("Content-Length", String(file.buffer.length));
    res.status(HTTP_STATUS.OK).send(file.buffer);
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

  openResumePdfFromAccessToken = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const token = String(req.params.token ?? "");
    const pdf = await employerResumeAccessService.openResumePdfFromToken(token);

    res.setHeader("Content-Type", pdf.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${pdf.fileName}"`,
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
      employerNotesVisibleToSeeker: body.employerNotesVisibleToSeeker === true,
      updatedByName: readEmployerDisplayName(req),
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notes saved successfully.",
      data: result,
    });
  };

  updateInterviewForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");
    const body = req.body as UpdateApplicationInterviewSchema;

    const result = await applicationService.updateInterviewForEmployer({
      employerId,
      applicationId,
      interview: {
        date: body.date,
        time: body.time,
        mode: body.mode,
        meetingLink: body.meetingLink,
        venue: body.venue,
        instructions: body.instructions,
        interviewerName: body.interviewerName,
        interviewerDesignation: body.interviewerDesignation,
        interviewerEmail: body.interviewerEmail,
        interviewerPhone: body.interviewerPhone,
        cancelledAt: null,
        cancellationReason: "",
        cancelledByName: "",
      },
      updatedByName: readEmployerDisplayName(req),
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message:
        result.action === "scheduled"
          ? "Interview scheduled successfully."
          : "Interview updated successfully.",
      data: {
        application: result.application,
        action: result.action,
      },
    });
  };

  cancelInterviewForEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const applicationId = String(req.params.applicationId ?? "");
    const body = req.body as CancelApplicationInterviewSchema;
    const reason =
      body.reason === "Other" ? body.otherReason.trim() : body.reason;

    const result = await applicationService.cancelInterviewForEmployer({
      employerId,
      applicationId,
      reason,
      cancelledByName: readEmployerDisplayName(req),
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Interview cancelled successfully.",
      data: { application: result },
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
