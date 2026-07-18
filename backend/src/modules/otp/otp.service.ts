import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
} from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { createOtpProvider } from "./otp.factory.js";

export type GeneratedOtp = {
  otp: string;
  otpHash: string;
  expiresAt: Date;
};

export class OtpService {
  private readonly provider = createOtpProvider();

  generateOtpCode(): string {
    const max = 10 ** OTP_LENGTH;
    const min = 10 ** (OTP_LENGTH - 1);
    return String(randomInt(min, max));
  }

  async createOtp(): Promise<GeneratedOtp> {
    const otp = this.generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    return { otp, otpHash, expiresAt };
  }

  async deliverOtp(
    phoneNumber: string,
    otp: string,
    expiresAt: Date,
    options?: {
      purpose?: "registration" | "login";
      employerName?: string;
    },
  ): Promise<void> {
    await this.provider.sendOtp({
      phoneNumber,
      otp,
      expiresAt,
      purpose: options?.purpose,
      employerName: options?.employerName,
    });
  }

  assertCanAttempt(attempts: number): void {
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError(
        "Maximum OTP attempts exceeded. Please request a new OTP.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }
  }

  assertNotExpired(expiresAt: Date | null | undefined): void {
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw new AppError(
        "OTP has expired. Please request a new OTP.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  async verifyOtpHash(otp: string, otpHash: string | null | undefined): Promise<boolean> {
    if (!otpHash) {
      return false;
    }

    return bcrypt.compare(otp, otpHash);
  }
}

export const otpService = new OtpService();
