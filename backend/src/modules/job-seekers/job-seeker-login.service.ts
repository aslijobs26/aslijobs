import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { OTP_MAX_ATTEMPTS } from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { otpService } from "../otp/otp.service.js";
import { JobSeekerModel } from "./job-seeker.model.js";
import type {
  JobSeekerLoginSendOtpInput,
  JobSeekerLoginVerifyOtpInput,
} from "./job-seeker.types.js";

function toLoginJobSeeker(jobSeeker: {
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

async function findLoginEligibleJobSeeker(whatsappNumber: string) {
  const jobSeeker = await JobSeekerModel.findOne({ whatsappNumber }).select(
    "+otpHash +otpExpiresAt +otpAttempts +refreshTokenHash +refreshTokenExpiresAt",
  );

  if (!jobSeeker) {
    throw new AppError("Job seeker not registered.", HTTP_STATUS.NOT_FOUND);
  }

  if (
    !jobSeeker.isWhatsappVerified ||
    jobSeeker.registrationStatus !== "COMPLETED"
  ) {
    throw new AppError(
      "Complete your registration first.",
      HTTP_STATUS.CONFLICT,
    );
  }

  return jobSeeker;
}

async function issueAndPersistLoginOtp(
  jobSeeker: Awaited<ReturnType<typeof findLoginEligibleJobSeeker>>,
) {
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
      purpose: "login",
      employerName: jobSeeker.fullName,
    },
  );

  return {
    jobSeekerId: jobSeeker._id.toString(),
    otpExpiresAt: generated.expiresAt.toISOString(),
    ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
  };
}

export class JobSeekerLoginService {
  async sendLoginOtp(input: JobSeekerLoginSendOtpInput) {
    const jobSeeker = await findLoginEligibleJobSeeker(input.whatsappNumber);
    return issueAndPersistLoginOtp(jobSeeker);
  }

  async resendLoginOtp(input: JobSeekerLoginSendOtpInput) {
    const jobSeeker = await findLoginEligibleJobSeeker(input.whatsappNumber);
    return issueAndPersistLoginOtp(jobSeeker);
  }

  async verifyLoginOtp(input: JobSeekerLoginVerifyOtpInput) {
    const jobSeeker = await findLoginEligibleJobSeeker(input.whatsappNumber);

    if ((jobSeeker.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new AppError(
        "Maximum Attempts Reached",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    if (
      !jobSeeker.otpExpiresAt ||
      jobSeeker.otpExpiresAt.getTime() < Date.now()
    ) {
      throw new AppError("OTP Expired", HTTP_STATUS.BAD_REQUEST);
    }

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      jobSeeker.otpHash,
    );

    if (!isValid) {
      jobSeeker.otpAttempts = (jobSeeker.otpAttempts ?? 0) + 1;
      await jobSeeker.save();
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    const tokens = jwtService.issueJobSeekerTokens({
      sub: jobSeeker._id.toString(),
      whatsappNumber: jobSeeker.whatsappNumber,
    });

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    jobSeeker.otpHash = null;
    jobSeeker.otpExpiresAt = null;
    jobSeeker.otpAttempts = 0;
    jobSeeker.refreshTokenHash = refreshTokenHash;
    jobSeeker.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    jobSeeker.lastLoginAt = new Date();
    await jobSeeker.save();

    return {
      jobSeeker: toLoginJobSeeker(jobSeeker),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
    };
  }

  async getAuthenticatedJobSeeker(jobSeekerId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const jobSeeker = await JobSeekerModel.findById(jobSeekerId);

    if (!jobSeeker) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    return {
      jobSeeker: toLoginJobSeeker(jobSeeker),
    };
  }
}

export const jobSeekerLoginService = new JobSeekerLoginService();
