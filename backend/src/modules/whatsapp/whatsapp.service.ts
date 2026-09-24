import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { toWhatsAppCloudRecipient } from "../../utils/whatsapp-phone.js";

type MetaErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
};

type MetaSendSuccessBody = {
  messages?: Array<{ id?: string; message_status?: string }>;
};

/**
 * WhatsApp Cloud API adapter for authentication OTP templates.
 * Controllers never call Meta directly.
 */
export class WhatsAppService {
  private get isConfigured(): boolean {
    return Boolean(
      env.WHATSAPP_ACCESS_TOKEN?.trim() &&
        env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
        env.WHATSAPP_OTP_TEMPLATE_NAME?.trim(),
    );
  }

  async sendOtpMessage(phoneNumber: string, otp: string): Promise<void> {
    if (!this.isConfigured) {
      console.error(
        "[WhatsAppService] WhatsApp OTP delivery failed: credentials or template are not configured",
      );
      throw new AppError(
        "Unable to send OTP right now. Please try again.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const recipient = toWhatsAppCloudRecipient(phoneNumber);
    const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
    const url = `https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    console.info("[WhatsAppService] WhatsApp OTP request initiated");

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "template",
          template: {
            name: env.WHATSAPP_OTP_TEMPLATE_NAME,
            language: {
              code: env.WHATSAPP_TEMPLATE_LANGUAGE,
            },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otp }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: otp }],
              },
            ],
          },
        }),
      });
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      console.error(
        `[WhatsAppService] WhatsApp OTP delivery failed: ${
          isTimeout ? "timeout" : "network error"
        }`,
      );
      throw new AppError(
        "Unable to send OTP right now. Please try again.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!response.ok) {
      await this.handleMetaFailure(response);
    }

    let messageId = "";
    let messageStatus = "";
    try {
      const body = (await response.json()) as MetaSendSuccessBody;
      messageId = body.messages?.[0]?.id?.trim() ?? "";
      messageStatus = body.messages?.[0]?.message_status?.trim() ?? "";
    } catch {
      // Acceptance without a parseable body is still treated as success.
    }

    console.info(
      `[WhatsAppService] WhatsApp OTP delivery successful${
        messageId ? ` messageId=${messageId}` : ""
      }${messageStatus ? ` status=${messageStatus}` : ""}`,
    );
  }

  /**
   * Session text reply inside the user-initiated 24-hour window.
   * Transactional templates (OTP and future alerts) stay on sendOtpMessage / templates.
   */
  async sendTextMessage(phoneNumber: string, body: string): Promise<void> {
    if (!env.WHATSAPP_ACCESS_TOKEN.trim() || !env.WHATSAPP_PHONE_NUMBER_ID.trim()) {
      console.error("[WhatsAppService] text reply skipped: credentials missing");
      return;
    }

    const recipient = toWhatsAppCloudRecipient(phoneNumber);
    const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
    const url = `https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const text = body.trim().slice(0, 4000);
    const started = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    if (!response.ok) {
      console.error(
        `[WhatsAppService] text reply failed status=${response.status} latencyMs=${Date.now() - started}`,
      );
      return;
    }

    console.info(
      `[WhatsAppService] text reply sent latencyMs=${Date.now() - started}`,
    );
  }

  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!env.WHATSAPP_ACCESS_TOKEN.trim()) {
      throw new Error("WhatsApp media download is not configured");
    }

    const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
    const meta = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(mediaId)}`,
      {
        headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!meta.ok) {
      throw new Error(`WhatsApp media metadata failed status=${meta.status}`);
    }

    const payload = (await meta.json()) as { url?: string; mime_type?: string };
    const mediaUrl = payload.url?.trim();
    if (!mediaUrl) {
      throw new Error("WhatsApp media URL missing");
    }

    const file = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!file.ok) {
      throw new Error(`WhatsApp media download failed status=${file.status}`);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 8_000_000) {
      throw new Error("WhatsApp media size is invalid");
    }

    return {
      buffer: bytes,
      mimeType: payload.mime_type?.trim() || "audio/ogg",
    };
  }

  private async handleMetaFailure(response: Response): Promise<never> {
    let errorCode: number | undefined;
    let errorSubcode: number | undefined;
    let errorType = "";
    let errorMessage = "";
    let fbtraceId = "";

    try {
      const body = (await response.json()) as MetaErrorBody;
      errorCode = body.error?.code;
      errorSubcode = body.error?.error_subcode;
      errorType = body.error?.type?.trim() ?? "";
      errorMessage = (
        body.error?.error_user_msg ||
        body.error?.message ||
        ""
      ).trim();
      fbtraceId = body.error?.fbtrace_id?.trim() ?? "";
    } catch {
      // Ignore unreadable Meta error payloads.
    }

    console.error(
      `[WhatsAppService] WhatsApp OTP delivery failed: status=${response.status}` +
        `${typeof errorCode === "number" ? ` code=${errorCode}` : ""}` +
        `${typeof errorSubcode === "number" ? ` subcode=${errorSubcode}` : ""}` +
        `${errorType ? ` type=${errorType}` : ""}` +
        `${fbtraceId ? ` fbtrace=${fbtraceId}` : ""}` +
        `${errorMessage ? ` message=${errorMessage}` : ""}`,
    );

    throw new AppError(
      "Unable to send OTP right now. Please try again.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}
