import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { OtpDeliveryPayload, OtpProvider } from "./otp.types.js";

/**
 * Development-only fallback. Production always uses WhatsApp.
 * Never logs OTP values. Cannot be used unless OTP_TEST_MODE is explicitly enabled.
 */
export class ConsoleOtpProvider implements OtpProvider {
  readonly name = "console";

  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    const testModeEnabled =
      env.NODE_ENV !== "production" && env.OTP_TEST_MODE === true;

    if (!testModeEnabled) {
      console.error(
        "[AsliJobs OTP] WhatsApp OTP delivery failed: console provider is disabled",
      );
      throw new AppError(
        "Unable to send OTP right now. Please try again.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    console.info(
      `[AsliJobs OTP] Development test OTP mode enabled purpose=${payload.purpose ?? "unknown"}`,
    );
  }
}
