import { Router } from "express";
import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { languageRegionController } from "./language-region.controller.js";
import { reverseGeocodeBodySchema } from "./language-region.validation.js";

const languageRegionRouter = Router();

/** One detection per visitor, with room for a retry and the settings toggle. */
const languageRegionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

languageRegionRouter.post(
  "/region",
  languageRegionRateLimit,
  validate(reverseGeocodeBodySchema),
  asyncHandler(languageRegionController.resolve),
);

export default languageRegionRouter;
