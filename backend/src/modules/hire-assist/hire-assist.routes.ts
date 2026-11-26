import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { hireAssistController } from "./hire-assist.controller.js";
import { createHireAssistBodySchema } from "./hire-assist.validation.js";
import { requireEmployerRole } from "../../middleware/auth.middleware.js";

const hireAssistRouter = Router();

const submitLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many Hire Assist requests. Please wait a few minutes and try again.",
  },
});

hireAssistRouter.post(
  "/",
  requireEmployerRole,
  submitLimiter,
  validate(createHireAssistBodySchema, "body"),
  asyncHandler(hireAssistController.create),
);

export default hireAssistRouter;
