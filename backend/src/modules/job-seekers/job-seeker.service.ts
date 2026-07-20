import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { otpService } from "../otp/otp.service.js";
import { JobSeekerModel } from "./job-seeker.model.js";
import type {
  CompleteJobSeekerRegistrationInput,
  RegisterJobSeekerInput,
  ResendJobSeekerOtpInput,
  VerifyJobSeekerOtpInput,
} from "./job-seeker.types.js";

function toPublicJobSeeker(jobSeeker: {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  whatsappNumber: string;
  dateOfBirth?: Date | null;
  gender?: string | null;
  pincode?: string;
  city?: string;
  state?: string;
  jobRole?: string;
  preferredJobLocation?: string;
  isWhatsappVerified: boolean;
  registrationStatus: string;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: jobSeeker._id.toString(),
    fullName: jobSeeker.fullName,
    whatsappNumber: jobSeeker.whatsappNumber,
    dateOfBirth: jobSeeker.dateOfBirth
      ? jobSeeker.dateOfBirth.toISOString().slice(0, 10)
      : null,
    gender: jobSeeker.gender ?? null,
    pincode: jobSeeker.pincode ?? "",
    city: jobSeeker.city ?? "",
    state: jobSeeker.state ?? "",
    jobRole: jobSeeker.jobRole ?? "",
    preferredJobLocation: jobSeeker.preferredJobLocation ?? "",
    isWhatsappVerified: jobSeeker.isWhatsappVerified,
    registrationStatus: jobSeeker.registrationStatus,
    lastLoginAt: jobSeeker.lastLoginAt ?? null,
    createdAt: jobSeeker.createdAt,
    updatedAt: jobSeeker.updatedAt,
  };
}

async function findJobSeekerOrThrow(jobSeekerId: string) {
  if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
    throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
  }

  const jobSeeker = await JobSeekerModel.findById(jobSeekerId).select(
    "+otpHash +otpExpiresAt +otpAttempts",
  );

  if (!jobSeeker) {
    throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
  }

  return jobSeeker;
}

async function assertNoCompletedDuplicateWhatsapp(
  whatsappNumber: string,
  excludeJobSeekerId?: mongoose.Types.ObjectId,
) {
  const query: Record<string, unknown> = {
    whatsappNumber,
    registrationStatus: "COMPLETED",
  };

  if (excludeJobSeekerId) {
    query._id = { $ne: excludeJobSeekerId };
  }

  const existing = await JobSeekerModel.findOne(query).select("_id");
  if (existing) {
    throw new AppError(
      "This WhatsApp number is already registered",
      HTTP_STATUS.CONFLICT,
    );
  }
}

export class JobSeekerService {
  async registerJobSeeker(input: RegisterJobSeekerInput) {
    await assertNoCompletedDuplicateWhatsapp(input.whatsappNumber);

    const existing = await JobSeekerModel.findOne({
      whatsappNumber: input.whatsappNumber,
      registrationStatus: "PENDING",
    });

    const generated = await otpService.createOtp();

    let jobSeeker = existing;

    try {
      if (jobSeeker) {
        jobSeeker.fullName = input.fullName;
        jobSeeker.whatsappNumber = input.whatsappNumber;
        jobSeeker.isWhatsappVerified = false;
        jobSeeker.registrationStatus = "PENDING";
        jobSeeker.otpHash = generated.otpHash;
        jobSeeker.otpExpiresAt = generated.expiresAt;
        jobSeeker.otpAttempts = 0;
        await jobSeeker.save();
      } else {
        jobSeeker = await JobSeekerModel.create({
          fullName: input.fullName,
          whatsappNumber: input.whatsappNumber,
          isWhatsappVerified: false,
          registrationStatus: "PENDING",
          otpHash: generated.otpHash,
          otpExpiresAt: generated.expiresAt,
          otpAttempts: 0,
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new AppError(
          "This WhatsApp number is already registered",
          HTTP_STATUS.CONFLICT,
        );
      }

      console.error("Job seeker registration persistence failed:", error);
      throw new AppError("Database error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    await otpService.deliverOtp(
      input.whatsappNumber,
      generated.otp,
      generated.expiresAt,
      {
        purpose: "registration",
        employerName: input.fullName,
      },
    );

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
      jobSeekerId: jobSeeker._id.toString(),
      otpExpiresAt: generated.expiresAt.toISOString(),
      ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
    };
  }

  async resendOtp(input: ResendJobSeekerOtpInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (jobSeeker.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number is already verified",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const generated = await otpService.createOtp();
    jobSeeker.otpHash = generated.otpHash;
    jobSeeker.otpExpiresAt = generated.expiresAt;
    jobSeeker.otpAttempts = 0;
    await jobSeeker.save();

    await otpService.deliverOtp(
      jobSeeker.whatsappNumber,
      generated.otp,
      generated.expiresAt,
      {
        purpose: "registration",
        employerName: jobSeeker.fullName,
      },
    );

    return {
      jobSeekerId: jobSeeker._id.toString(),
      otpExpiresAt: generated.expiresAt.toISOString(),
      ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
    };
  }

  async verifyOtp(input: VerifyJobSeekerOtpInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    otpService.assertCanAttempt(jobSeeker.otpAttempts ?? 0);
    otpService.assertNotExpired(jobSeeker.otpExpiresAt);

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      jobSeeker.otpHash,
    );

    if (!isValid) {
      jobSeeker.otpAttempts = (jobSeeker.otpAttempts ?? 0) + 1;
      await jobSeeker.save();
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    jobSeeker.isWhatsappVerified = true;
    jobSeeker.otpHash = null;
    jobSeeker.otpExpiresAt = null;
    jobSeeker.otpAttempts = 0;
    jobSeeker.registrationStatus = "PENDING";
    await jobSeeker.save();

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }

  async completeRegistration(input: CompleteJobSeekerRegistrationInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!jobSeeker.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before completing registration",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await assertNoCompletedDuplicateWhatsapp(
      jobSeeker.whatsappNumber,
      jobSeeker._id,
    );

    jobSeeker.dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
    jobSeeker.gender = input.gender;
    jobSeeker.pincode = input.pincode;
    jobSeeker.city = input.city;
    jobSeeker.state = input.state;
    jobSeeker.jobRole = input.jobRole;
    jobSeeker.preferredJobLocation = input.preferredJobLocation;
    jobSeeker.registrationStatus = "COMPLETED";

    const tokens = jwtService.issueJobSeekerTokens({
      sub: jobSeeker._id.toString(),
      whatsappNumber: jobSeeker.whatsappNumber,
    });

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    jobSeeker.refreshTokenHash = refreshTokenHash;
    jobSeeker.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    jobSeeker.lastLoginAt = new Date();
    await jobSeeker.save();

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
    };
  }
}

export const jobSeekerService = new JobSeekerService();
