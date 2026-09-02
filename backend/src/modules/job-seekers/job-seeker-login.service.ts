import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { otpService } from "../otp/otp.service.js";
import { JobSeekerModel } from "./job-seeker.model.js";
import { toPublicJobSeeker } from "./job-seeker.serializer.js";
import type {
  JobSeekerLoginSendOtpInput,
  JobSeekerLoginVerifyOtpInput,
} from "./job-seeker.types.js";

async function findLoginEligibleJobSeeker(whatsappNumber: string) {
  const jobSeeker = await JobSeekerModel.findOne({ whatsappNumber }).select(
    "+otpHash +otpExpiresAt +otpAttempts +lastOtpSentAt +refreshTokenHash +refreshTokenExpiresAt",
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
  const delivery = await otpService.issueAndDeliver(
    jobSeeker,
    jobSeeker.whatsappNumber,
    {
      purpose: "login",
      accountName: jobSeeker.fullName,
    },
  );

  return {
    jobSeekerId: jobSeeker._id.toString(),
    ...delivery,
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
    const acceptedViaTestOtp = otpService.matchesTestOtp(input.otp);

    // Test OTP bypasses delivery/expiry only — auth/JWT flow continues unchanged.
    if (!acceptedViaTestOtp) {
      if ((jobSeeker.otpAttempts ?? 0) >= otpService.maxAttempts) {
        otpService.logVerificationFailure("MAX_ATTEMPTS");
        throw new AppError(
          "Maximum Attempts Reached",
          HTTP_STATUS.TOO_MANY_REQUESTS,
        );
      }

      if (
        !jobSeeker.otpExpiresAt ||
        jobSeeker.otpExpiresAt.getTime() < Date.now()
      ) {
        otpService.logVerificationFailure("EXPIRED");
        throw new AppError("OTP Expired", HTTP_STATUS.BAD_REQUEST);
      }
    }

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      jobSeeker.otpHash,
    );

    if (!isValid) {
      jobSeeker.otpAttempts = (jobSeeker.otpAttempts ?? 0) + 1;
      await jobSeeker.save();
      otpService.logVerificationFailure("INVALID_OTP");
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    otpService.logVerificationSuccess();

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
      jobSeeker: toPublicJobSeeker(jobSeeker),
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
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }
}

export const jobSeekerLoginService = new JobSeekerLoginService();
