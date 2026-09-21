import { Router } from "express";
import {
  requireOperationsAuth,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsAnalyticsController } from "./operations-analytics.controller.js";
import {
  operationsAnalyticsExportQuerySchema,
  operationsAnalyticsOverviewQuerySchema,
} from "./operations-analytics.validation.js";

export const operationsAnalyticsRouter = Router();

operationsAnalyticsRouter.use(asyncHandler(requireOperationsAuth));

operationsAnalyticsRouter.get(
  "/overview",
  validate(operationsAnalyticsOverviewQuerySchema, "query"),
  asyncHandler(operationsAnalyticsController.overview),
);

operationsAnalyticsRouter.get(
  "/export",
  validate(operationsAnalyticsExportQuerySchema, "query"),
  asyncHandler(operationsAnalyticsController.export),
);

export default operationsAnalyticsRouter;
