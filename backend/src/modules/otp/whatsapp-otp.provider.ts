import type { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import type { OtpDeliveryPayload, OtpProvider } from "./otp.types.js";

/**
 * Always logs OTP to console, then attempts WhatsApp delivery.
 * Controllers/services stay provider-agnostic.
 */
export class WhatsAppOtpProvider implements OtpProvider {
  readonly name = "whatsapp";

  constructor(
    private readonly consoleProvider: OtpProvider,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    await this.consoleProvider.sendOtp(payload);
    await this.whatsappService.sendOtpMessage(
      payload.phoneNumber,
      payload.otp,
    );
  }
}
