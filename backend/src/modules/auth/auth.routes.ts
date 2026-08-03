import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { tokenRefreshController } from "./token-refresh.controller.js";
import { refreshTokenBodySchema } from "./token-refresh.service.js";
import { z } from "zod";

const authRouter = Router();

const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const logoutBodySchema = z.object({
  refreshToken: z.string().trim().min(20).max(4096).optional(),
});

authRouter.post(
  "/workspace/refresh",
  refreshRateLimit,
  validate(refreshTokenBodySchema, "body"),
  asyncHandler(tokenRefreshController.refreshWorkspace),
);

authRouter.post(
  "/workspace/logout",
  refreshRateLimit,
  validate(logoutBodySchema, "body"),
  asyncHandler(tokenRefreshController.logoutWorkspace),
);

authRouter.post(
  "/job-seeker/refresh",
  refreshRateLimit,
  validate(refreshTokenBodySchema, "body"),
  asyncHandler(tokenRefreshController.refreshJobSeeker),
);

authRouter.post(
  "/job-seeker/logout",
  refreshRateLimit,
  validate(logoutBodySchema, "body"),
  asyncHandler(tokenRefreshController.logoutJobSeeker),
);

export default authRouter;
