import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { getUploadedFile } from "../../middleware/employer-document-upload.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { employerService } from "./employer.service.js";
import type {
  CompleteCompanyProfileSchema,
  CompleteIndividualIdentitySchema,
  RegisterEmployerSchema,
  UpdateEmployerProfileSchema,
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
      {
        document: getUploadedFile(req.files, "document"),
        companyLogo: getUploadedFile(req.files, "companyLogo"),
      },
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
      {
        document: getUploadedFile(req.files, "document"),
        profilePhoto: getUploadedFile(req.files, "profilePhoto"),
      },
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Identity document uploaded successfully",
      data: result,
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as UpdateEmployerProfileSchema;
    const result = await employerService.updateEmployerProfile(
      {
        employerId,
        ...body,
      },
      {
        companyLogo: getUploadedFile(req.files, "companyLogo"),
        profilePhoto: getUploadedFile(req.files, "profilePhoto"),
      },
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer profile updated successfully",
      data: result,
    });
  };
}

export const employerController = new EmployerController();
