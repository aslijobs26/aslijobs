import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { assertOperationsPermissionKey } from "../rbac/operations-access.service.js";
import { operationsRegistrationAwarenessService } from "../registration-awareness/operations-registration-awareness.service.js";
import { operationsVerificationsService } from "./operations-verifications.service.js";
import type {
  ExportOperationsVerificationsQuery,
  ListOperationsVerificationsQuery,
  OperationsVerificationDocumentParams,
  OperationsVerificationIdParams,
  RequestVerificationDocumentsBody,
  UpdateOperationsVerificationBody,
  VerificationsAnalyticsQueryInput,
} from "./operations-verifications.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsVerificationsController = {
  async analytics(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as VerificationsAnalyticsQueryInput;
    const result = await operationsVerificationsService.getAnalytics(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations verifications analytics fetched successfully.",
      data: result,
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsVerificationsQuery;
    const result = await operationsVerificationsService.list(
      query,
      requireAccess(req),
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations verifications fetched successfully.",
      data: result,
    });
  },

  async export(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, "employers.list.export");
    const query = req.query as unknown as ExportOperationsVerificationsQuery;
    const file = await operationsVerificationsService.export(query, access);

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    res.status(HTTP_STATUS.OK).send(file.buffer);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as OperationsVerificationIdParams;
    const result = await operationsVerificationsService.getById(
      id,
      requireAccess(req),
    );

    if (req.operationsUserId) {
      void operationsRegistrationAwarenessService
        .markEntitySeen({
          entityType: "employer",
          entityId: id,
          userId: req.operationsUserId,
        })
        .catch(() => {
          /* non-blocking awareness side-effect */
        });
    }

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations verification fetched successfully.",
      data: result,
    });
  },

  async updateVerification(req: Request, res: Response): Promise<void> {
    const body = req.body as UpdateOperationsVerificationBody;
    const key =
      body.verificationStatus === "rejected"
        ? "employers.profile.actions.reject"
        : "employers.profile.actions.verify";
    assertOperationsPermissionKey(requireAccess(req), key);

    const operationsUserId = req.operationsUserId;
    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params as OperationsVerificationIdParams;
    const result = await operationsVerificationsService.updateVerification(
      id,
      body,
      operationsUserId,
      requireAccess(req),
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer verification updated successfully.",
      data: result,
    });
  },

  async requestDocuments(req: Request, res: Response): Promise<void> {
    assertOperationsPermissionKey(
      requireAccess(req),
      "employers.profile.actions.reject",
    );

    const operationsUserId = req.operationsUserId;
    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params as OperationsVerificationIdParams;
    const body = req.body as RequestVerificationDocumentsBody;
    const result = await operationsVerificationsService.requestDocuments(
      id,
      body,
      operationsUserId,
      requireAccess(req),
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Additional documents requested successfully.",
      data: result,
    });
  },

  async downloadDocument(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(
      access,
      "employers.profile.documents.download",
    );
    const { id, documentId } =
      req.params as OperationsVerificationDocumentParams;
    const file = await operationsVerificationsService.openDocument(
      id,
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
};
