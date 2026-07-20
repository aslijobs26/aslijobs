import { Router } from "express";
import type { ZodType } from "zod";
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
import {
  completeJobSeekerRegistrationSchema,
  registerJobSeekerSchema,
  resendJobSeekerOtpSchema,
  verifyJobSeekerOtpSchema,
} from "./job-seeker.validation.js";

const jobSeekerRouter = Router();

function isCompleteRegistrationBody(
  body: unknown,
): body is { jobSeekerId: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "jobSeekerId" in body &&
    typeof (body as { jobSeekerId?: unknown }).jobSeekerId === "string" &&
    Boolean((body as { jobSeekerId: string }).jobSeekerId)
  );
}

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

jobSeekerRouter.post(
  "/register",
  (req, res, next) => {
    const schema: ZodType = isCompleteRegistrationBody(req.body)
      ? completeJobSeekerRegistrationSchema
      : registerJobSeekerSchema;
    return validate(schema, "body")(req, res, next);
  },
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

export default jobSeekerRouter;
