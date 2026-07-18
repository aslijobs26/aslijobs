import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { employerService } from "./employer.service.js";
import type {
  CompleteCompanyProfileSchema,
  CompleteIndividualIdentitySchema,
  RegisterEmployerSchema,
  VerifyEmployerOtpSchema,
} from "./employer.validation.js";

export class EmployerController {
  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterEmployerSchema;
    const result = await employerService.registerEmployer(body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const result = await employerService.resendOtp(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP generated successfully.",
      data: result,
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const body = req.body as VerifyEmployerOtpSchema;
    const result = await employerService.verifyEmployerOtp({
      employerId,
      otp: body.otp,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "WhatsApp number verified successfully",
      data: result,
    });
  };

  completeCompanyProfile = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const body = req.body as CompleteCompanyProfileSchema;
    const result = await employerService.completeCompanyProfile(
      {
        employerId,
        ...body,
      },
      req.file,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Company profile completed successfully",
      data: result,
    });
  };

  completeIndividualIdentity = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const body = req.body as CompleteIndividualIdentitySchema;
    const result = await employerService.completeIndividualIdentity(
      {
        employerId,
        documentType: body.documentType,
      },
      req.file,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Individual registration completed successfully",
      data: result,
    });
  };
}

export const employerController = new EmployerController();
