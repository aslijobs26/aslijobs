import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { analyticsEventController } from "./analytics-event.controller.js";
import { trackAnalyticsEventBodySchema } from "./analytics-event.validation.js";

export const analyticsEventRouter = Router();

/** Public ingest endpoint — keep tight to reduce abuse. */
const trackLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

analyticsEventRouter.post(
  "/events",
  trackLimiter,
  validate(trackAnalyticsEventBodySchema, "body"),
  asyncHandler(analyticsEventController.track),
);

export default analyticsEventRouter;
