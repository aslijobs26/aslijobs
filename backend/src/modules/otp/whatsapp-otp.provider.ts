import type { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import type { OtpDeliveryPayload, OtpProvider } from "./otp.types.js";

export class WhatsAppOtpProvider implements OtpProvider {
  readonly name = "whatsapp";

  constructor(private readonly whatsappService: WhatsAppService) {}

  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    await this.whatsappService.sendOtpMessage(
      payload.phoneNumber,
      payload.otp,
    );
  }
}
