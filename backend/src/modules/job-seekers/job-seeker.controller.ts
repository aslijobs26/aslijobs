import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { jobSeekerService } from "./job-seeker.service.js";
import type {
  CompleteJobSeekerRegistrationSchema,
  RegisterJobSeekerSchema,
  ResendJobSeekerOtpSchema,
  VerifyJobSeekerOtpSchema,
} from "./job-seeker.validation.js";

export class JobSeekerController {
  register = async (req: Request, res: Response): Promise<void> => {
    if ("jobSeekerId" in req.body && req.body.jobSeekerId) {
      const body = req.body as CompleteJobSeekerRegistrationSchema;
      const result = await jobSeekerService.completeRegistration(body);

      sendSuccess(res, HTTP_STATUS.OK, {
        message: "Registration completed successfully",
        data: result,
      });
      return;
    }

    const body = req.body as RegisterJobSeekerSchema;
    const result = await jobSeekerService.registerJobSeeker(body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as ResendJobSeekerOtpSchema;
    const result = await jobSeekerService.resendOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as VerifyJobSeekerOtpSchema;
    const result = await jobSeekerService.verifyOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "WhatsApp number verified successfully",
      data: result,
    });
  };
}

export const jobSeekerController = new JobSeekerController();
