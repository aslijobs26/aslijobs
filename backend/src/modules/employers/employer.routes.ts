import { Router } from "express";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
import {
  employerCompanyProfileUpload,
  employerIndividualIdentityUpload,
  employerProfileUpdateUpload,
} from "../../middleware/employer-document-upload.middleware.js";
import {
  employerLoginSendOtpRateLimit,
  employerLoginVerifyOtpRateLimit,
} from "../../middleware/employer-login-rate-limit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { employerController } from "./employer.controller.js";
import { employerLoginController } from "./employer-login.controller.js";
import {
  employerLoginResendOtpSchema,
  employerLoginSendOtpSchema,
  employerLoginVerifyOtpSchema,
} from "./employer-login.validation.js";
import {
  completeCompanyProfileSchema,
  completeIndividualIdentitySchema,
  employerIdParamsSchema,
  registerEmployerSchema,
  updateEmployerProfileSchema,
  verifyEmployerOtpSchema,
} from "./employer.validation.js";

const employerRouter = Router();

employerRouter.post(
  "/login/send-otp",
  employerLoginSendOtpRateLimit,
  validate(employerLoginSendOtpSchema, "body"),
  asyncHandler(employerLoginController.sendOtp),
);

employerRouter.post(
  "/login/resend-otp",
  employerLoginSendOtpRateLimit,
  validate(employerLoginResendOtpSchema, "body"),
  asyncHandler(employerLoginController.resendOtp),
);

employerRouter.post(
  "/login/verify-otp",
  employerLoginVerifyOtpRateLimit,
  validate(employerLoginVerifyOtpSchema, "body"),
  asyncHandler(employerLoginController.verifyOtp),
);

employerRouter.get(
  "/me",
  asyncHandler(requireEmployerAuth),
  asyncHandler(employerLoginController.me),
);

employerRouter.patch(
  "/me/profile",
  asyncHandler(requireEmployerAuth),
  employerProfileUpdateUpload,
  validate(updateEmployerProfileSchema, "body"),
  asyncHandler(employerController.updateProfile),
);

employerRouter.post(
  "/register",
  validate(registerEmployerSchema, "body"),
  asyncHandler(employerController.register),
);

employerRouter.post(
  "/:employerId/otp/resend",
  validate(employerIdParamsSchema, "params"),
  asyncHandler(employerController.resendOtp),
);

employerRouter.post(
  "/:employerId/otp/verify",
  validate(employerIdParamsSchema, "params"),
  validate(verifyEmployerOtpSchema, "body"),
  asyncHandler(employerController.verifyOtp),
);

employerRouter.post(
  "/:employerId/company-profile",
  validate(employerIdParamsSchema, "params"),
  employerCompanyProfileUpload,
  validate(completeCompanyProfileSchema, "body"),
  asyncHandler(employerController.completeCompanyProfile),
);

employerRouter.post(
  "/:employerId/identity-document",
  validate(employerIdParamsSchema, "params"),
  employerIndividualIdentityUpload,
  validate(completeIndividualIdentitySchema, "body"),
  asyncHandler(employerController.completeIndividualIdentity),
);

export default employerRouter;
