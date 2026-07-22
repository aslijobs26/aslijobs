import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import {
  OTP_MAX_ATTEMPTS,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { otpService } from "../otp/otp.service.js";
import { EmployerModel } from "./employer.model.js";
import type {
  EmployerLoginSendOtpInput,
  EmployerLoginVerifyOtpInput,
} from "./employer-login.types.js";

function toLoginEmployer(employer: {
  _id: mongoose.Types.ObjectId;
  accountType: string;
  companyName: string;
  firstName: string;
  lastName: string;
  industry?: string;
  businessCategory?: string;
  minimumEmployees?: number | null;
  maximumEmployees?: number | null;
  companyLogo?: {
    url?: string;
    storagePath?: string;
    publicId?: string;
    storageProvider?: string;
    originalName?: string;
    mimeType?: string;
    fileSize?: number;
  } | null;
  profilePhoto?: {
    url?: string;
    storagePath?: string;
    publicId?: string;
    storageProvider?: string;
    originalName?: string;
    mimeType?: string;
    fileSize?: number;
  } | null;
  companyAddress?: string;
  pincode?: string;
  city?: string;
  state?: string;
  emailAddress?: string;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  registrationStatus: string;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const toImage = (
    asset:
      | {
          url?: string;
          storagePath?: string;
          publicId?: string;
          storageProvider?: string;
          originalName?: string;
          mimeType?: string;
          fileSize?: number;
        }
      | null
      | undefined,
  ) => {
    if (!asset?.url && !asset?.storagePath) {
      return null;
    }

    return {
      url: asset.url ?? "",
      storagePath: asset.storagePath ?? "",
      publicId: asset.publicId ?? "",
      storageProvider: asset.storageProvider ?? "",
      originalName: asset.originalName ?? "",
      mimeType: asset.mimeType ?? "",
      fileSize: asset.fileSize ?? 0,
    };
  };

  return {
    id: employer._id.toString(),
    accountType: employer.accountType,
    companyName: employer.companyName,
    firstName: employer.firstName,
    lastName: employer.lastName,
    industry: employer.industry ?? "",
    businessCategory: employer.businessCategory ?? "",
    minimumEmployees: employer.minimumEmployees ?? null,
    maximumEmployees: employer.maximumEmployees ?? null,
    companyLogo: toImage(employer.companyLogo),
    profilePhoto: toImage(employer.profilePhoto),
    companyAddress: employer.companyAddress ?? "",
    pincode: employer.pincode ?? "",
    city: employer.city ?? "",
    state: employer.state ?? "",
    emailAddress: employer.emailAddress ?? "",
    whatsappNumber: employer.whatsappNumber,
    isWhatsappVerified: employer.isWhatsappVerified,
    isProfileComplete: employer.isProfileComplete,
    registrationStatus: employer.registrationStatus,
    lastLoginAt: employer.lastLoginAt ?? null,
    createdAt: employer.createdAt,
    updatedAt: employer.updatedAt,
  };
}

function buildEmployerDisplayName(employer: {
  accountType: string;
  companyName: string;
  firstName: string;
  lastName: string;
}) {
  if (
    isBusinessEmployerAccountType(
      employer.accountType as "company" | "consultancy" | "individual",
    ) &&
    employer.companyName.trim()
  ) {
    return employer.companyName.trim();
  }

  return `${employer.firstName} ${employer.lastName}`.trim();
}

async function findLoginEligibleEmployer(whatsappNumber: string) {
  const employer = await EmployerModel.findOne({ whatsappNumber }).select(
    "+otpHash +otpExpiresAt +otpAttempts +refreshTokenHash +refreshTokenExpiresAt",
  );

  if (!employer) {
    throw new AppError("Employer not registered.", HTTP_STATUS.NOT_FOUND);
  }

  if (
    !employer.isWhatsappVerified ||
    employer.registrationStatus !== "completed"
  ) {
    throw new AppError(
      "Complete your registration first.",
      HTTP_STATUS.CONFLICT,
    );
  }

  return employer;
}

async function issueAndPersistLoginOtp(
  employer: Awaited<ReturnType<typeof findLoginEligibleEmployer>>,
) {
  const generated = await otpService.createOtp();

  employer.otpHash = generated.otpHash;
  employer.otpExpiresAt = generated.expiresAt;
  employer.otpAttempts = 0;
  await employer.save();

  await otpService.deliverOtp(
    employer.whatsappNumber,
    generated.otp,
    generated.expiresAt,
    {
      purpose: "login",
      employerName: buildEmployerDisplayName(employer),
    },
  );

  return {
    employerId: employer._id.toString(),
    otpExpiresAt: generated.expiresAt.toISOString(),
    ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
  };
}

export class EmployerLoginService {
  async sendLoginOtp(input: EmployerLoginSendOtpInput) {
    const employer = await findLoginEligibleEmployer(input.whatsappNumber);
    return issueAndPersistLoginOtp(employer);
  }

  async resendLoginOtp(input: EmployerLoginSendOtpInput) {
    const employer = await findLoginEligibleEmployer(input.whatsappNumber);
    return issueAndPersistLoginOtp(employer);
  }

  async verifyLoginOtp(input: EmployerLoginVerifyOtpInput) {
    const employer = await findLoginEligibleEmployer(input.whatsappNumber);

    if ((employer.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new AppError(
        "Maximum Attempts Reached",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    if (
      !employer.otpExpiresAt ||
      employer.otpExpiresAt.getTime() < Date.now()
    ) {
      throw new AppError("OTP Expired", HTTP_STATUS.BAD_REQUEST);
    }

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      employer.otpHash,
    );

    if (!isValid) {
      employer.otpAttempts = (employer.otpAttempts ?? 0) + 1;
      await employer.save();
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    const tokens = jwtService.issueEmployerTokens({
      sub: employer._id.toString(),
      accountType: employer.accountType as
        | "company"
        | "consultancy"
        | "individual",
      whatsappNumber: employer.whatsappNumber,
    });

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    employer.otpHash = null;
    employer.otpExpiresAt = null;
    employer.otpAttempts = 0;
    employer.refreshTokenHash = refreshTokenHash;
    employer.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    employer.lastLoginAt = new Date();
    await employer.save();

    console.log(
      `[LOGIN] employerId=${employer._id.toString()} whatsapp=${employer.whatsappNumber} at=${employer.lastLoginAt.toISOString()}`,
    );

    return {
      employer: toLoginEmployer(employer),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
    };
  }

  async getAuthenticatedEmployer(employerId: string) {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employer = await EmployerModel.findById(employerId);

    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    return {
      employer: toLoginEmployer(employer),
    };
  }
}

export const employerLoginService = new EmployerLoginService();
