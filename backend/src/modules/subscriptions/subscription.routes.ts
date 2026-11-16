import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  optionalWorkspaceAuth,
  requireEmployerAuth,
} from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { subscriptionController } from "./subscription.controller.js";
import { enterpriseEnquiryBodySchema } from "./subscription.validation.js";

const subscriptionRouter = Router();

const enterpriseEnquiryRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

subscriptionRouter.get("/plans", asyncHandler(subscriptionController.listPlans));

subscriptionRouter.get(
  "/me",
  asyncHandler(requireEmployerAuth),
  asyncHandler(subscriptionController.getMine),
);

subscriptionRouter.post(
  "/enterprise-enquiry",
  enterpriseEnquiryRateLimit,
  asyncHandler(optionalWorkspaceAuth),
  validate(enterpriseEnquiryBodySchema, "body"),
  asyncHandler(subscriptionController.enterpriseEnquiry),
);

export default subscriptionRouter;
