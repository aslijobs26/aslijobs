import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { jobSeekerService } from "./job-seeker.service.js";
import { AppError } from "../../middleware/error.middleware.js";
import type {
  CompleteJobSeekerRegistrationSchema,
  RegisterJobSeekerSchema,
  ResendJobSeekerOtpSchema,
  SaveJobSeekerPreferencesSchema,
  SearchJobSeekerRolesQuery,
  UpdateJobSeekerProfileSchema,
  VerifyJobSeekerOtpSchema,
} from "./job-seeker.validation.js";

export class JobSeekerController {
  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterJobSeekerSchema;
    const result = await jobSeekerService.registerJobSeeker(body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "OTP sent to WhatsApp.",
      data: result,
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as ResendJobSeekerOtpSchema;
    const result = await jobSeekerService.resendOtp(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP sent to WhatsApp.",
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

  searchJobRoles = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as SearchJobSeekerRolesQuery;
    const result = await jobSeekerService.searchJobRoles(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job roles fetched successfully.",
      data: result,
    });
  };

  savePreferences = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as SaveJobSeekerPreferencesSchema;
    const result = await jobSeekerService.savePreferences(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Job preferences saved successfully.",
      data: result,
    });
  };

  completeRegistration = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const body = req.body as CompleteJobSeekerRegistrationSchema;
    const result = await jobSeekerService.completeRegistration(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Registration completed successfully",
      data: result,
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = req.jobSeekerId;
    if (!jobSeekerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as UpdateJobSeekerProfileSchema;
    const result = await jobSeekerService.updateAuthenticatedProfile(
      jobSeekerId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Profile updated successfully.",
      data: result,
    });
  };

  updateProfilePhoto = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = req.jobSeekerId;
    if (!jobSeekerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await jobSeekerService.updateProfilePhoto(
      jobSeekerId,
      req.file,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Profile photo updated successfully.",
      data: result,
    });
  };

  deleteProfilePhoto = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = req.jobSeekerId;
    if (!jobSeekerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await jobSeekerService.deleteProfilePhoto(jobSeekerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Profile photo removed successfully.",
      data: result,
    });
  };
}

export const jobSeekerController = new JobSeekerController();
