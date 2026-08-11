import { OTP_EXPIRY_MINUTES } from "../../constants/employer.constants.js";
import { env } from "../../config/env.js";
import type { OtpDeliveryPayload, OtpProvider } from "./otp.types.js";

export class ConsoleOtpProvider implements OtpProvider {
  readonly name = "console";

  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    const testModeEnabled =
      env.OTP_TEST_MODE === true && env.OTP_TEST_CODE.length > 0;

    console.log("================================================");
    console.log("[AsliJobs OTP]");
    if (payload.purpose === "login") {
      console.log("Purpose: login");
      if (payload.employerName) {
        console.log(`Account: ${payload.employerName}`);
      }
    } else if (payload.purpose === "registration") {
      console.log("Purpose: registration");
    }
    console.log(`Phone: ${payload.phoneNumber}`);
    console.log(`Generated OTP: ${payload.otp}`);
    console.log(`Expires in: ${OTP_EXPIRY_MINUTES} minutes`);
    console.log(`Test OTP Enabled: ${testModeEnabled}`);
    console.log("================================================");
  }
}
