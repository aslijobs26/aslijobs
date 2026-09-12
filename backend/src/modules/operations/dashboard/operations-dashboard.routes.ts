import { Router } from "express";
import {
  requireOperationsAuth,
  requireOperationsPermission,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsDashboardController } from "./operations-dashboard.controller.js";
import {
  operationsDashboardExportQuerySchema,
  operationsDashboardOverviewQuerySchema,
} from "./operations-dashboard.validation.js";

export const operationsDashboardRouter = Router();

operationsDashboardRouter.use(asyncHandler(requireOperationsAuth));

operationsDashboardRouter.get(
  "/overview",
  requireOperationsPermission("dashboard", "read"),
  validate(operationsDashboardOverviewQuerySchema, "query"),
  asyncHandler(operationsDashboardController.overview),
);

operationsDashboardRouter.get(
  "/export",
  requireOperationsPermission("dashboard", "read"),
  validate(operationsDashboardExportQuerySchema, "query"),
  asyncHandler(operationsDashboardController.export),
);

export default operationsDashboardRouter;
