import { env } from "../../config/env.js";

/**
 * WhatsApp Cloud API adapter.
 * When credentials are missing, send is a no-op after the console OTP provider logs.
 */
export class WhatsAppService {
  private get isConfigured(): boolean {
    return Boolean(
      env.WHATSAPP_ACCESS_TOKEN &&
        env.WHATSAPP_PHONE_NUMBER_ID,
    );
  }

  async sendOtpMessage(phoneNumber: string, otp: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn(
        "[WhatsAppService] OTP_PROVIDER=whatsapp but WhatsApp credentials are incomplete. Console OTP was still logged.",
      );
      return;
    }

    const url = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: `Your AsliJobs verification code is ${otp}. It expires in 5 minutes.`,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[WhatsAppService] Failed to send OTP message:", errorBody);
      throw new Error("Failed to send WhatsApp OTP message");
    }
  }
}
