import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsVerificationsController } from "./operations-verifications.controller.js";
import {
  exportOperationsVerificationsQuerySchema,
  listOperationsVerificationsQuerySchema,
  operationsVerificationDocumentParamsSchema,
  operationsVerificationIdParamsSchema,
  requestVerificationDocumentsBodySchema,
  updateOperationsVerificationBodySchema,
  verificationsAnalyticsQuerySchema,
} from "./operations-verifications.validation.js";

export const operationsVerificationsRouter = Router();

operationsVerificationsRouter.use(asyncHandler(requireOperationsAuth));

operationsVerificationsRouter.get(
  "/analytics",
  requireOperationsPermission("verifications", "read"),
  validate(verificationsAnalyticsQuerySchema, "query"),
  asyncHandler(operationsVerificationsController.analytics),
);

operationsVerificationsRouter.get(
  "/export",
  requireOperationsPermission("verifications", "read"),
  validate(exportOperationsVerificationsQuerySchema, "query"),
  asyncHandler(operationsVerificationsController.export),
);

operationsVerificationsRouter.get(
  "/",
  requireOperationsPermission("verifications", "read"),
  validate(listOperationsVerificationsQuerySchema, "query"),
  asyncHandler(operationsVerificationsController.list),
);

operationsVerificationsRouter.get(
  "/:id/documents/:documentId",
  requireOperationsPermission("verifications", "read"),
  validate(operationsVerificationDocumentParamsSchema, "params"),
  asyncHandler(operationsVerificationsController.downloadDocument),
);

operationsVerificationsRouter.patch(
  "/:id/verification",
  requireOperationsPermission("verifications", "update"),
  validate(operationsVerificationIdParamsSchema, "params"),
  validate(updateOperationsVerificationBodySchema, "body"),
  asyncHandler(operationsVerificationsController.updateVerification),
);

operationsVerificationsRouter.post(
  "/:id/request-documents",
  requireOperationsPermission("verifications", "update"),
  validate(operationsVerificationIdParamsSchema, "params"),
  validate(requestVerificationDocumentsBodySchema, "body"),
  asyncHandler(operationsVerificationsController.requestDocuments),
);

operationsVerificationsRouter.get(
  "/:id",
  requireOperationsPermission("verifications", "read"),
  validate(operationsVerificationIdParamsSchema, "params"),
  asyncHandler(operationsVerificationsController.getById),
);

export default operationsVerificationsRouter;
