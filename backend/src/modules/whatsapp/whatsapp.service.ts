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
