import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { assertOperationsPermissionKey } from "../rbac/operations-access.service.js";
import {
  sanitizeEmployerDetail,
  sanitizeEmployerListItem,
} from "../rbac/operations-field-sanitize.js";
import { operationsRegistrationAwarenessService } from "../registration-awareness/operations-registration-awareness.service.js";
import { operationsEmployersService } from "./operations-employers.service.js";
import type {
  CreateOperationsEmployerBody,
  EmployersAnalyticsQuery,
  ExportOperationsEmployersQuery,
  ListOperationsEmployerJobsQuery,
  ListOperationsEmployersQuery,
  OperationsEmployerDocumentParams,
  OperationsEmployerIdParams,
  UpdateOperationsEmployerStatusBody,
  UpdateOperationsEmployerVerificationBody,
} from "./operations-employers.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsEmployersController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsEmployersQuery;
    const result = await operationsEmployersService.listEmployers(query);
    const access = requireAccess(req);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employers fetched successfully.",
      data: {
        ...result,
        employers: result.employers.map((item) =>
          sanitizeEmployerListItem(item, access),
        ),
      },
    });
  },

  async analytics(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as EmployersAnalyticsQuery;
    const result = await operationsEmployersService.getAnalytics(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employers analytics fetched successfully.",
      data: result,
    });
  },

  async exportCsv(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, "employers.list.export");
    const query = req.query as unknown as ExportOperationsEmployersQuery;
    const format = query.format === "csv" ? "csv" : "xlsx";

    const file = await operationsEmployersService.exportEmployers(
      {
        page: 1,
        limit: 100,
        search: query.search,
        verificationStatus: query.verificationStatus,
        verificationQueue: query.verificationQueue,
        employerType: query.employerType,
        location: query.location,
        status: query.status,
        datePreset: query.datePreset,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        analyticsPreset: query.analyticsPreset,
        analyticsFrom: query.analyticsFrom,
        analyticsTo: query.analyticsTo,
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

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateOperationsEmployerBody;
    const result = await operationsEmployersService.createEmployer(body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Employer created successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.getEmployerById(employerId);

    if (result.isNewRegistration && req.operationsUserId) {
      void operationsRegistrationAwarenessService
        .markEntitySeen({
          entityType: "employer",
          entityId: employerId,
          userId: req.operationsUserId,
        })
        .catch(() => {
          /* non-blocking awareness side-effect */
        });
    }

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employer fetched successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },

  async listJobs(req: Request, res: Response): Promise<void> {
    assertOperationsPermissionKey(
      requireAccess(req),
      "employers.profile.jobs.view",
    );
    const { employerId } = req.params as OperationsEmployerIdParams;
    const query = req.query as unknown as ListOperationsEmployerJobsQuery;
    const result = await operationsEmployersService.listEmployerJobs(
      employerId,
      query,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employer jobs fetched successfully.",
      data: result,
    });
  },

  async updateVerification(req: Request, res: Response): Promise<void> {
    const body = req.body as UpdateOperationsEmployerVerificationBody;
    const key =
      body.verificationStatus === "rejected"
        ? "employers.profile.actions.reject"
        : "employers.profile.actions.verify";
    assertOperationsPermissionKey(requireAccess(req), key);

    const operationsUserId = req.operationsUserId;
    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.updateVerification(
      employerId,
      body,
      operationsUserId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer verification updated successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },

  async downloadDocument(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(
      access,
      "employers.profile.documents.download",
    );
    const { employerId, documentId } =
      req.params as OperationsEmployerDocumentParams;
    const file = await operationsEmployersService.openEmployerDocument(
      employerId,
      documentId,
    );

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.fileName.replace(/"/g, "")}"`,
    );
    if (file.contentLength != null) {
      res.setHeader("Content-Length", String(file.contentLength));
    }
    res.status(HTTP_STATUS.OK);
    file.stream.pipe(res);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const body = req.body as UpdateOperationsEmployerStatusBody;
    const key =
      body.status === "active"
        ? "employers.profile.actions.activate"
        : "employers.profile.actions.suspend";
    assertOperationsPermissionKey(requireAccess(req), key);

    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.updateStatus(
      employerId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer status updated successfully.",
      data: sanitizeEmployerDetail(result, requireAccess(req)),
    });
  },
};
