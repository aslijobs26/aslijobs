import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { jobSeekerLoginService } from "./job-seeker-login.service.js";
import type {
  JobSeekerLoginResendOtpSchema,
  JobSeekerLoginSendOtpSchema,
  JobSeekerLoginVerifyOtpSchema,
} from "./job-seeker-login.validation.js";

export class JobSeekerLoginController {
  sendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as JobSeekerLoginSendOtpSchema;
    const result = await jobSeekerLoginService.sendLoginOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as JobSeekerLoginResendOtpSchema;
    const result = await jobSeekerLoginService.resendLoginOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as JobSeekerLoginVerifyOtpSchema;
    const result = await jobSeekerLoginService.verifyLoginOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Login successful.",
      data: result,
    });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = req.jobSeekerId;

    if (!jobSeekerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result =
      await jobSeekerLoginService.getAuthenticatedJobSeeker(jobSeekerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job seeker profile fetched successfully.",
      data: result,
    });
  };
}

export const jobSeekerLoginController = new JobSeekerLoginController();
