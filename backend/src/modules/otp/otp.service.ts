import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
} from "../../constants/employer.constants.js";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { createOtpProvider } from "./otp.factory.js";

export type GeneratedOtp = {
  otp: string;
  otpHash: string;
  expiresAt: Date;
};

export type OtpVerificationMethod = "TEST_OTP" | "RANDOM_OTP";

export class OtpService {
  private readonly provider = createOtpProvider();

  /**
   * Temporary testing fallback. Enabled only when OTP_TEST_MODE=true
   * and OTP_TEST_CODE is a non-empty configured value.
   */
  isTestModeEnabled(): boolean {
    return env.OTP_TEST_MODE === true && env.OTP_TEST_CODE.length > 0;
  }

  /**
   * Returns true when the submitted OTP matches the configured test code
   * and test mode is enabled. Never true when OTP_TEST_MODE is unset/false.
   */
  matchesTestOtp(otp: string): boolean {
    if (!this.isTestModeEnabled()) {
      return false;
    }

    return otp === env.OTP_TEST_CODE;
  }

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

  /**
   * Accepts either the configured test OTP (when enabled) or the hashed random OTP.
   * Does not bypass login/register/JWT logic — callers continue the existing auth flow.
   */
  async verifyOtpHash(
    otp: string,
    otpHash: string | null | undefined,
  ): Promise<boolean> {
    if (this.matchesTestOtp(otp)) {
      return true;
    }

    if (!otpHash) {
      return false;
    }

    return bcrypt.compare(otp, otpHash);
  }

  resolveVerificationMethod(otp: string): OtpVerificationMethod {
    return this.matchesTestOtp(otp) ? "TEST_OTP" : "RANDOM_OTP";
  }

  logVerificationSuccess(phoneNumber: string, otp: string): void {
    console.log("================================================");
    console.log("[AsliJobs OTP Verification]");
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Method: ${this.resolveVerificationMethod(otp)}`);
    console.log("Status: SUCCESS");
    console.log("================================================");
  }

  logVerificationFailure(
    phoneNumber: string,
    reason: "INVALID_OTP" | "EXPIRED" | "MAX_ATTEMPTS",
  ): void {
    console.log("================================================");
    console.log("[AsliJobs OTP Verification]");
    console.log(`Phone: ${phoneNumber}`);
    console.log("Status: FAILED");
    console.log(`Reason: ${reason}`);
    console.log("================================================");
  }
}

export const otpService = new OtpService();
