import { Router } from "express";
import { requireOperationsAuth } from "../../../middleware/operations-auth.middleware.js";
import { operationsLoginRateLimit } from "../../../middleware/operations-login-rate-limit.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsAuthController } from "./operations-auth.controller.js";
import {
  operationsTeamLoginSchema,
  operationsTeamRefreshSchema,
} from "./operations-auth.validation.js";

export const operationsAuthRouter = Router();

operationsAuthRouter.post(
  "/login",
  operationsLoginRateLimit,
  validate(operationsTeamLoginSchema),
  asyncHandler(operationsAuthController.login),
);

operationsAuthRouter.post(
  "/refresh",
  validate(operationsTeamRefreshSchema),
  asyncHandler(operationsAuthController.refresh),
);

operationsAuthRouter.get(
  "/session",
  asyncHandler(requireOperationsAuth),
  asyncHandler(operationsAuthController.session),
);

operationsAuthRouter.post(
  "/logout",
  asyncHandler(requireOperationsAuth),
  asyncHandler(operationsAuthController.logout),
);

export default operationsAuthRouter;
