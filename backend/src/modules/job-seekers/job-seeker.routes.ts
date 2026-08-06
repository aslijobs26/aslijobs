import { Router } from "express";
import { requireJobSeekerAuth } from "../../middleware/job-seeker-auth.middleware.js";
import {
  jobSeekerLoginSendOtpRateLimit,
  jobSeekerLoginVerifyOtpRateLimit,
} from "../../middleware/job-seeker-login-rate-limit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { jobSeekerController } from "./job-seeker.controller.js";
import { jobSeekerLoginController } from "./job-seeker-login.controller.js";
import {
  jobSeekerLoginResendOtpSchema,
  jobSeekerLoginSendOtpSchema,
  jobSeekerLoginVerifyOtpSchema,
} from "./job-seeker-login.validation.js";
import { jobSeekerProfilePhotoUpload } from "./job-seeker-photo-upload.middleware.js";
import {
  completeJobSeekerRegistrationSchema,
  registerJobSeekerSchema,
  resendJobSeekerOtpSchema,
  saveJobSeekerPreferencesSchema,
  searchJobSeekerRolesQuerySchema,
  updateJobSeekerProfileSchema,
  verifyJobSeekerOtpSchema,
} from "./job-seeker.validation.js";

const jobSeekerRouter = Router();

jobSeekerRouter.post(
  "/login/send-otp",
  jobSeekerLoginSendOtpRateLimit,
  validate(jobSeekerLoginSendOtpSchema, "body"),
  asyncHandler(jobSeekerLoginController.sendOtp),
);

jobSeekerRouter.post(
  "/login/resend-otp",
  jobSeekerLoginSendOtpRateLimit,
  validate(jobSeekerLoginResendOtpSchema, "body"),
  asyncHandler(jobSeekerLoginController.resendOtp),
);

jobSeekerRouter.post(
  "/login/verify-otp",
  jobSeekerLoginVerifyOtpRateLimit,
  validate(jobSeekerLoginVerifyOtpSchema, "body"),
  asyncHandler(jobSeekerLoginController.verifyOtp),
);

jobSeekerRouter.get(
  "/me",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(jobSeekerLoginController.me),
);

jobSeekerRouter.patch(
  "/me",
  asyncHandler(requireJobSeekerAuth),
  validate(updateJobSeekerProfileSchema, "body"),
  asyncHandler(jobSeekerController.updateProfile),
);

jobSeekerRouter.post(
  "/me/photo",
  asyncHandler(requireJobSeekerAuth),
  jobSeekerProfilePhotoUpload,
  asyncHandler(jobSeekerController.updateProfilePhoto),
);

jobSeekerRouter.delete(
  "/me/photo",
  asyncHandler(requireJobSeekerAuth),
  asyncHandler(jobSeekerController.deleteProfilePhoto),
);

jobSeekerRouter.get(
  "/register/job-roles",
  validate(searchJobSeekerRolesQuerySchema, "query"),
  asyncHandler(jobSeekerController.searchJobRoles),
);

jobSeekerRouter.post(
  "/register",
  validate(registerJobSeekerSchema, "body"),
  asyncHandler(jobSeekerController.register),
);

jobSeekerRouter.post(
  "/register/resend-otp",
  validate(resendJobSeekerOtpSchema, "body"),
  asyncHandler(jobSeekerController.resendOtp),
);

jobSeekerRouter.post(
  "/register/verify-otp",
  validate(verifyJobSeekerOtpSchema, "body"),
  asyncHandler(jobSeekerController.verifyOtp),
);

jobSeekerRouter.post(
  "/register/preferences",
  validate(saveJobSeekerPreferencesSchema, "body"),
  asyncHandler(jobSeekerController.savePreferences),
);

jobSeekerRouter.post(
  "/register/complete",
  validate(completeJobSeekerRegistrationSchema, "body"),
  asyncHandler(jobSeekerController.completeRegistration),
);

export default jobSeekerRouter;
