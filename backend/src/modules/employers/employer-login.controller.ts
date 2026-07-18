import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { employerLoginService } from "./employer-login.service.js";
import type {
  EmployerLoginResendOtpSchema,
  EmployerLoginSendOtpSchema,
  EmployerLoginVerifyOtpSchema,
} from "./employer-login.validation.js";

export class EmployerLoginController {
  sendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as EmployerLoginSendOtpSchema;
    const result = await employerLoginService.sendLoginOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as EmployerLoginResendOtpSchema;
    const result = await employerLoginService.resendLoginOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as EmployerLoginVerifyOtpSchema;
    const result = await employerLoginService.verifyLoginOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Login successful.",
      data: result,
    });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await employerLoginService.getAuthenticatedEmployer(
      employerId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer profile fetched successfully.",
      data: result,
    });
  };
}

export const employerLoginController = new EmployerLoginController();
