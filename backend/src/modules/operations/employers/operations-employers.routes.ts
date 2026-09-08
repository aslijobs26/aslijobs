import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsEmployersController } from "./operations-employers.controller.js";
import {
  createOperationsEmployerBodySchema,
  employersAnalyticsQuerySchema,
  exportOperationsEmployersQuerySchema,
  listOperationsEmployerJobsQuerySchema,
  listOperationsEmployersQuerySchema,
  operationsEmployerDocumentParamsSchema,
  operationsEmployerIdParamsSchema,
  updateOperationsEmployerStatusBodySchema,
  updateOperationsEmployerVerificationBodySchema,
} from "./operations-employers.validation.js";

export const operationsEmployersRouter = Router();

operationsEmployersRouter.use(asyncHandler(requireOperationsAuth));

operationsEmployersRouter.get(
  "/",
  requireOperationsPermission("employers", "read"),
  validate(listOperationsEmployersQuerySchema, "query"),
  asyncHandler(operationsEmployersController.list),
);

operationsEmployersRouter.get(
  "/analytics",
  requireOperationsPermission("employers", "read"),
  validate(employersAnalyticsQuerySchema, "query"),
  asyncHandler(operationsEmployersController.analytics),
);

operationsEmployersRouter.get(
  "/export",
  requireOperationsPermission("employers", "read"),
  validate(exportOperationsEmployersQuerySchema, "query"),
  asyncHandler(operationsEmployersController.exportCsv),
);

operationsEmployersRouter.post(
  "/",
  requireOperationsPermission("employers", "create"),
  validate(createOperationsEmployerBodySchema, "body"),
  asyncHandler(operationsEmployersController.create),
);

operationsEmployersRouter.get(
  "/:employerId/jobs",
  requireOperationsPermission("employers", "read"),
  validate(operationsEmployerIdParamsSchema, "params"),
  validate(listOperationsEmployerJobsQuerySchema, "query"),
  asyncHandler(operationsEmployersController.listJobs),
);

operationsEmployersRouter.get(
  "/:employerId/documents/:documentId",
  requireOperationsPermission("employers", "read"),
  validate(operationsEmployerDocumentParamsSchema, "params"),
  asyncHandler(operationsEmployersController.downloadDocument),
);

operationsEmployersRouter.get(
  "/:employerId",
  requireOperationsPermission("employers", "read"),
  validate(operationsEmployerIdParamsSchema, "params"),
  asyncHandler(operationsEmployersController.getById),
);

operationsEmployersRouter.patch(
  "/:employerId/verification",
  requireOperationsPermission("employers", "update"),
  validate(operationsEmployerIdParamsSchema, "params"),
  validate(updateOperationsEmployerVerificationBodySchema, "body"),
  asyncHandler(operationsEmployersController.updateVerification),
);

operationsEmployersRouter.patch(
  "/:employerId/status",
  requireOperationsPermission("employers", "update"),
  validate(operationsEmployerIdParamsSchema, "params"),
  validate(updateOperationsEmployerStatusBodySchema, "body"),
  asyncHandler(operationsEmployersController.updateStatus),
);

export default operationsEmployersRouter;
