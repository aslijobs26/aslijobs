import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  assertOperationsPermissionKey,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import {
  sanitizeCandidateDetail,
  sanitizeCandidateListItem,
} from "../rbac/operations-field-sanitize.js";
import {
  CANDIDATE_DOCUMENTS_PERMISSION_KEY,
  CANDIDATE_EXPORT_PERMISSION_KEY,
  CANDIDATE_LIST_FILTER_PERMISSION_KEY,
  CANDIDATE_LIST_SEARCH_PERMISSION_KEY,
  CANDIDATE_LIST_VIEW_PERMISSION_KEY,
  CANDIDATE_PROFILE_VIEW_PERMISSION_KEY,
} from "../rbac/operations-permission-catalog.js";
import { operationsRegistrationAwarenessService } from "../registration-awareness/operations-registration-awareness.service.js";
import { operationsCandidatesService } from "./operations-candidates.service.js";
import { getOperationsCandidatesAnalytics } from "./operations-candidates-analytics.js";
import type {
  CandidatesAnalyticsQuery,
  ExportOperationsCandidatesQuery,
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

function stripUnauthorizedListQuery(
  query: ListOperationsCandidatesQuery,
  access: ReturnType<typeof requireAccess>,
): ListOperationsCandidatesQuery {
  const next = { ...query };
  if (!operationsAccessCanKey(access, CANDIDATE_LIST_SEARCH_PERMISSION_KEY)) {
    next.search = "";
  }
  if (!operationsAccessCanKey(access, CANDIDATE_LIST_FILTER_PERMISSION_KEY)) {
    next.tab = "all";
    next.status = "";
    next.jobId = "";
    next.employerId = "";
    next.location = "";
    next.experience = "";
    next.gender = "";
    next.preferredRole = "";
    next.profileStatus = "";
    next.verificationStatus = "";
    next.applicationPresence = "";
    next.overviewTab = "all";
    next.datePreset = "all";
    next.dateFrom = "";
    next.dateTo = "";
  }
  return next;
}

export const operationsCandidatesController = {
  async list(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_LIST_VIEW_PERMISSION_KEY);
    const query = stripUnauthorizedListQuery(
      req.query as unknown as ListOperationsCandidatesQuery,
      access,
    );
    const result = await operationsCandidatesService.listCandidates(query);

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

  async analytics(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_LIST_VIEW_PERMISSION_KEY);
    const query = req.query as unknown as CandidatesAnalyticsQuery;
    const data = await getOperationsCandidatesAnalytics(query);
    // Aggregate-only payload — no per-candidate PII fields.
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidates analytics fetched successfully.",
      data,
    });
  },

  async export(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_LIST_VIEW_PERMISSION_KEY);
    assertOperationsPermissionKey(access, CANDIDATE_EXPORT_PERMISSION_KEY);
    const query = req.query as unknown as ExportOperationsCandidatesQuery;
    const format = query.format === "csv" ? "csv" : "xlsx";

    const file = await operationsCandidatesService.exportCandidates(
      {
        page: 1,
        limit: 100,
        tab: query.tab,
        search: query.search,
        status: query.status,
        jobId: query.jobId,
        employerId: query.employerId,
        location: query.location,
        experience: query.experience,
        gender: query.gender,
        preferredRole: query.preferredRole,
        profileStatus: query.profileStatus,
        verificationStatus: query.verificationStatus,
        applicationPresence: query.applicationPresence,
        overviewTab: query.overviewTab,
        datePreset: query.datePreset,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        dateField: query.dateField,
        analyticsPreset: query.analyticsPreset,
        analyticsFrom: query.analyticsFrom,
        analyticsTo: query.analyticsTo,
        sort: query.sort,
      },
      access,
      format,
    );

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    res.status(HTTP_STATUS.OK).send(file.buffer);
  },

  async getBySeekerId(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_PROFILE_VIEW_PERMISSION_KEY);
    const { jobSeekerId } = req.params as OperationsCandidateSeekerIdParams;
    const result = await operationsCandidatesService.getSeekerDetail(jobSeekerId);

    if (result.isNewRegistration && req.operationsUserId) {
      void operationsRegistrationAwarenessService
        .markEntitySeen({
          entityType: "candidate",
          entityId: jobSeekerId,
          userId: req.operationsUserId,
        })
        .catch(() => {
          /* non-blocking awareness side-effect */
        });
    }

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidate details fetched successfully.",
      data: sanitizeCandidateDetail(result, access),
    });
  },

  async downloadResume(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_PROFILE_VIEW_PERMISSION_KEY);
    assertOperationsPermissionKey(access, CANDIDATE_DOCUMENTS_PERMISSION_KEY);
    const { jobSeekerId } = req.params as OperationsCandidateSeekerIdParams;
    const file =
      await operationsCandidatesService.openCandidateResume(jobSeekerId);

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.fileName.replace(/"/g, "")}"`,
    );
    if (file.contentLength != null) {
      res.setHeader("Content-Length", String(file.contentLength));
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.status(HTTP_STATUS.OK);
    file.stream.pipe(res);
  },

  async downloadPhoto(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    // List avatars and profile header both need photo; either list or profile view.
    if (
      !operationsAccessCanKey(access, CANDIDATE_LIST_VIEW_PERMISSION_KEY) &&
      !operationsAccessCanKey(access, CANDIDATE_PROFILE_VIEW_PERMISSION_KEY)
    ) {
      throw new AppError(
        "Access denied. You do not have permission to perform this action.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    const { jobSeekerId } = req.params as OperationsCandidateSeekerIdParams;
    const file =
      await operationsCandidatesService.openCandidatePhoto(jobSeekerId);

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.fileName.replace(/"/g, "")}"`,
    );
    if (file.contentLength != null) {
      res.setHeader("Content-Length", String(file.contentLength));
    }
    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(HTTP_STATUS.OK);
    file.stream.pipe(res);
  },

  async listSeekerApplications(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_PROFILE_VIEW_PERMISSION_KEY);
    assertOperationsPermissionKey(
      access,
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
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, CANDIDATE_PROFILE_VIEW_PERMISSION_KEY);
    const { applicationId } =
      req.params as OperationsCandidateApplicationIdParams;
    const result =
      await operationsCandidatesService.getApplicationDetail(applicationId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations candidate details fetched successfully.",
      data: sanitizeCandidateDetail(result, access),
    });
  },
};
