import { OTP_EXPIRY_MINUTES } from "../../constants/employer.constants.js";
import type { OtpDeliveryPayload, OtpProvider } from "./otp.types.js";

export class ConsoleOtpProvider implements OtpProvider {
  readonly name = "console";

  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    if (payload.purpose === "login") {
      console.log("====================================");
      console.log("LOGIN OTP GENERATED");
      console.log(`Employer : ${payload.employerName ?? "Employer"}`);
      console.log(`Phone Number : ${payload.phoneNumber}`);
      console.log(`OTP : ${payload.otp}`);
      console.log(`Expires : ${OTP_EXPIRY_MINUTES} Minutes`);
      console.log("====================================");
      return;
    }

    console.log("=====================================");
    console.log("OTP GENERATED");
    console.log(`Phone Number : ${payload.phoneNumber}`);
    console.log(`OTP : ${payload.otp}`);
    console.log(`Expires : ${OTP_EXPIRY_MINUTES} Minutes`);
    console.log("=====================================");
  }
}
