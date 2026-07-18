import { env } from "../../config/env.js";
import { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import { ConsoleOtpProvider } from "./console-otp.provider.js";
import type { OtpProvider } from "./otp.types.js";
import { WhatsAppOtpProvider } from "./whatsapp-otp.provider.js";

export function createOtpProvider(): OtpProvider {
  const consoleProvider = new ConsoleOtpProvider();

  if (env.OTP_PROVIDER === "whatsapp") {
    return new WhatsAppOtpProvider(consoleProvider, new WhatsAppService());
  }

  return consoleProvider;
}
