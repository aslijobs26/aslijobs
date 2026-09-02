import { randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import {
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

export type OtpDeliveryMeta = {
  otpExpiresAt: string;
  expiresIn: number;
  resendAvailableIn: number;
};

export type OtpPersistable = {
  otpHash?: string | null;
  otpExpiresAt?: Date | null;
  otpAttempts?: number | null;
  lastOtpSentAt?: Date | null;
  save: () => Promise<unknown>;
};

export class OtpService {
  private readonly provider = createOtpProvider();

  get expiryMinutes(): number {
    return env.OTP_EXPIRY_MINUTES;
  }

  get maxAttempts(): number {
    return env.OTP_MAX_ATTEMPTS || OTP_MAX_ATTEMPTS;
  }

  get resendCooldownSeconds(): number {
    return env.OTP_RESEND_COOLDOWN_SECONDS;
  }

  /**
   * Development-only bypass. Production parse always forces OTP_TEST_MODE=false.
   */
  isTestModeEnabled(): boolean {
    return (
      env.NODE_ENV !== "production" &&
      env.OTP_TEST_MODE === true &&
      env.OTP_TEST_CODE.length === OTP_LENGTH
    );
  }

  matchesTestOtp(otp: string): boolean {
    if (!this.isTestModeEnabled()) {
      return false;
    }

    return this.secureEquals(otp, env.OTP_TEST_CODE);
  }

  generateOtpCode(): string {
    const max = 10 ** OTP_LENGTH;
    const min = 10 ** (OTP_LENGTH - 1);
    return String(randomInt(min, max));
  }

  async createOtp(): Promise<GeneratedOtp> {
    const otp = this.generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(
      Date.now() + this.expiryMinutes * 60 * 1000,
    );

    return { otp, otpHash, expiresAt };
  }

  buildDeliveryMeta(expiresAt: Date): OtpDeliveryMeta {
    return {
      otpExpiresAt: expiresAt.toISOString(),
      expiresIn: Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
      ),
      resendAvailableIn: this.resendCooldownSeconds,
    };
  }

  assertResendAllowed(lastOtpSentAt: Date | null | undefined): void {
    if (!lastOtpSentAt) {
      return;
    }

    const elapsedMs = Date.now() - lastOtpSentAt.getTime();
    const remainingMs = this.resendCooldownSeconds * 1000 - elapsedMs;
    if (remainingMs > 0) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }
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

  /**
   * Persist a new hashed OTP, send it, then stamp lastOtpSentAt.
   * If delivery fails, restore the previous OTP fields so the user can retry.
   */
  async issueAndDeliver(
    record: OtpPersistable,
    phoneNumber: string,
    options?: {
      purpose?: "registration" | "login";
      accountName?: string;
    },
  ): Promise<OtpDeliveryMeta> {
    this.assertResendAllowed(record.lastOtpSentAt);

    const generated = await this.createOtp();
    const previous = {
      otpHash: record.otpHash ?? null,
      otpExpiresAt: record.otpExpiresAt ?? null,
      otpAttempts: record.otpAttempts ?? 0,
    };

    record.otpHash = generated.otpHash;
    record.otpExpiresAt = generated.expiresAt;
    record.otpAttempts = 0;
    await record.save();

    try {
      await this.deliverOtp(
        phoneNumber,
        generated.otp,
        generated.expiresAt,
        {
          purpose: options?.purpose,
          employerName: options?.accountName,
        },
      );
      record.lastOtpSentAt = new Date();
      await record.save();
    } catch (error) {
      record.otpHash = previous.otpHash;
      record.otpExpiresAt = previous.otpExpiresAt;
      record.otpAttempts = previous.otpAttempts;
      await record.save();
      throw error;
    }

    return this.buildDeliveryMeta(generated.expiresAt);
  }

  assertCanAttempt(attempts: number): void {
    if (attempts >= this.maxAttempts) {
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

  logVerificationSuccess(): void {
    console.info("[AsliJobs OTP] verification successful");
  }

  logVerificationFailure(
    reason: "INVALID_OTP" | "EXPIRED" | "MAX_ATTEMPTS",
  ): void {
    console.info(`[AsliJobs OTP] verification failed reason=${reason}`);
  }

  private secureEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}

export const otpService = new OtpService();
