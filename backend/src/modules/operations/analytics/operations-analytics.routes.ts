import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  requireOperationsAuth,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsAnalyticsController } from "./operations-analytics.controller.js";
import {
  operationsAnalyticsDrilldownQuerySchema,
  operationsAnalyticsExportQuerySchema,
  operationsAnalyticsOverviewQuerySchema,
} from "./operations-analytics.validation.js";

export const operationsAnalyticsRouter = Router();

const overviewLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const exportLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

operationsAnalyticsRouter.use(asyncHandler(requireOperationsAuth));

operationsAnalyticsRouter.get(
  "/overview",
  overviewLimiter,
  validate(operationsAnalyticsOverviewQuerySchema, "query"),
  asyncHandler(operationsAnalyticsController.overview),
);

operationsAnalyticsRouter.get(
  "/drilldown",
  overviewLimiter,
  validate(operationsAnalyticsDrilldownQuerySchema, "query"),
  asyncHandler(operationsAnalyticsController.drilldown),
);

operationsAnalyticsRouter.get(
  "/drilldown/export",
  exportLimiter,
  validate(operationsAnalyticsDrilldownQuerySchema, "query"),
  asyncHandler(operationsAnalyticsController.exportDrilldown),
);

operationsAnalyticsRouter.get(
  "/export",
  exportLimiter,
  validate(operationsAnalyticsExportQuerySchema, "query"),
  asyncHandler(operationsAnalyticsController.export),
);

export default operationsAnalyticsRouter;
