import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { toWhatsAppCloudRecipient } from "../../utils/whatsapp-phone.js";
import { WHATSAPP_VERIFICATION_CODE_SENT } from "./inbox/whatsapp-inbox-redaction.js";

export function maskWhatsAppRecipient(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length <= 4) {
    return "****";
  }
  return `****${digits.slice(-4)}`;
}

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

export type WhatsAppTemplateSendResult = {
  messageId: string;
  messageStatus: string;
};

type WhatsAppPhoneHealth = {
  nameStatus: string;
  codeVerification: string;
  phoneStatus: string;
  checkedAt: number;
};

let phoneHealthCache: WhatsAppPhoneHealth | null = null;

async function logWhatsAppPhoneHealth(): Promise<void> {
  const cached =
    phoneHealthCache && Date.now() - phoneHealthCache.checkedAt < 10 * 60 * 1000
      ? phoneHealthCache
      : null;
  const health = cached ?? (await readWhatsAppPhoneHealth());
  if (!health) return;
  if (health.nameStatus === "APPROVED" && health.phoneStatus === "CONNECTED") return;
  console.error(
    `[WhatsAppService] OTP number health nameStatus=${health.nameStatus || "-"} codeVerification=${health.codeVerification || "-"} phoneStatus=${health.phoneStatus || "-"}`,
  );
}

async function readWhatsAppPhoneHealth(): Promise<WhatsAppPhoneHealth | null> {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID.trim();
  const token = env.WHATSAPP_ACCESS_TOKEN.trim();
  if (!phoneId || !token) return null;
  try {
    const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
    const url = new URL(`https://graph.facebook.com/${version}/${phoneId}`);
    url.searchParams.set("fields", "name_status,code_verification_status,status");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      name_status?: string;
      code_verification_status?: string;
      status?: string;
    };
    phoneHealthCache = {
      nameStatus: body.name_status?.trim() ?? "",
      codeVerification: body.code_verification_status?.trim() ?? "",
      phoneStatus: body.status?.trim() ?? "",
      checkedAt: Date.now(),
    };
    return phoneHealthCache;
  } catch {
    return null;
  }
}

/**
 * Graph rejection details safe to persist and log.
 * Meta's message text is omitted because it can contain the recipient.
 */
export type WhatsAppTemplateFailureClass =
  | "permanent"
  | "retryable"
  | "ambiguous";

const RETRYABLE_META_CODES = new Set([
  1, 2, 4, 17, 32, 341, 613, 80007, 130429, 131056,
]);

/**
 * 132001 is "template name does not exist in the translation".
 * Retrying it cannot create the template and can duplicate other sends.
 */
const PERMANENT_META_CODES = new Set([
  100, 190, 131026, 131047, 131051, 132000, 132001, 132005, 132007, 132012,
  132015,
]);

export function sanitizeWhatsAppErrorDetail(value: string): string {
  return value
    .replace(/Bearer\s+\S+/gi, "Bearer ****")
    .replace(/\d{8,}/g, "****")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

/** Webhook failure text safe for the Operations inbox. Titles only; Meta messages can contain the phone. */
export function formatWhatsAppStatusFailure(input: {
  code?: number | null;
  title?: string | null;
}): string {
  const code = typeof input.code === "number" && Number.isFinite(input.code) ? String(input.code) : "";
  const title = (input.title ?? "").replace(/[^\w\s.:()/-]/g, " ").replace(/\s+/g, " ").trim();
  const detail = [code ? `code=${code}` : "", title ? `title=${title}` : ""]
    .filter(Boolean)
    .join(" ");
  return sanitizeWhatsAppErrorDetail(detail || "webhook_failed");
}

/**
 * Timeouts and dropped connections are ambiguous: Meta may already have
 * accepted the message. Rate limits and 5xx responses can be retried.
 * Template, recipient, auth, and payload errors, including 132001, are permanent.
 */
export function classifyWhatsAppTemplateFailure(input: {
  status: number;
  metaCode?: number | null;
  timedOut?: boolean;
  network?: boolean;
}): WhatsAppTemplateFailureClass {
  if (input.timedOut || input.network) {
    return "ambiguous";
  }
  if (
    typeof input.metaCode === "number" &&
    PERMANENT_META_CODES.has(input.metaCode)
  ) {
    return "permanent";
  }
  if (input.status === 429 || input.status >= 500) {
    return "retryable";
  }
  if (
    typeof input.metaCode === "number" &&
    RETRYABLE_META_CODES.has(input.metaCode)
  ) {
    return "retryable";
  }
  return "permanent";
}

export class WhatsAppTemplateDeliveryError extends Error {
  readonly status: number;
  readonly metaCode: number | null;
  readonly metaType: string;
  readonly failureClass: WhatsAppTemplateFailureClass;
  /** Sanitized Meta detail. Phone numbers and tokens are removed. */
  readonly detail: string;

  constructor(input: {
    status: number;
    metaCode?: number;
    metaType?: string;
    detail?: string;
    failureClass?: WhatsAppTemplateFailureClass;
  }) {
    const code =
      typeof input.metaCode === "number" ? String(input.metaCode) : "none";
    const detail = sanitizeWhatsAppErrorDetail(input.detail ?? "");
    super(
      `WhatsApp template delivery failed status=${input.status} code=${code}`,
    );
    this.name = "WhatsAppTemplateDeliveryError";
    this.status = input.status;
    this.metaCode = typeof input.metaCode === "number" ? input.metaCode : null;
    this.metaType = input.metaType?.trim() ?? "";
    this.detail = detail;
    this.failureClass =
      input.failureClass ??
      classifyWhatsAppTemplateFailure({
        status: input.status,
        metaCode: this.metaCode,
      });
  }
}

/**
 * WhatsApp Cloud API adapter.
 * OTP and bot session replies keep dedicated methods.
 * Event notifications use sendTemplateMessage().
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

  private get hasCloudCredentials(): boolean {
    return Boolean(
      env.WHATSAPP_ACCESS_TOKEN.trim() && env.WHATSAPP_PHONE_NUMBER_ID.trim(),
    );
  }

  private messagesUrl(): string {
    const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
    return `https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
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

    if (messageStatus.toLowerCase() === "failed") {
      console.error(
        `[WhatsAppService] WhatsApp OTP delivery failed messageId=${messageId || "-"} status=failed`,
      );
      throw new AppError(
        "Unable to send OTP right now. Please try again.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    console.info(
      `[WhatsAppService] WhatsApp OTP delivery successful${
        messageId ? ` messageId=${messageId}` : ""
      }${messageStatus ? ` status=${messageStatus}` : ""}`,
    );

    if (mongoose.connection.readyState === 1) {
      await import("./inbox/whatsapp-inbox-store.js")
        .then((store) =>
          store.recordOutboundMessage({
            phoneNational: phoneNumber,
            body: WHATSAPP_VERIFICATION_CODE_SENT,
            senderType: "notification",
            templateName: env.WHATSAPP_OTP_TEMPLATE_NAME,
            templateLanguage: env.WHATSAPP_TEMPLATE_LANGUAGE,
            ...(messageId
              ? { providerMessageId: messageId }
              : { clientMessageId: `otp-${recipient}-${Date.now()}` }),
            status: "accepted",
          }),
        )
        .catch((error: unknown) => {
          console.error(
            `[WhatsAppService] OTP inbox record failed reason=${
              error instanceof Error ? error.name : "unknown"
            }`,
          );
        });
    }
    void logWhatsAppPhoneHealth();
  }

  /**
   * Approved Meta template send for event notifications.
   * Does not change OTP or 24-hour session text replies.
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    bodyParameters: readonly string[] = [],
    urlButtonParameters: readonly string[] = [],
    context: { correlationId?: string } = {},
  ): Promise<WhatsAppTemplateSendResult> {
    const name = templateName.trim();
    const language = languageCode.trim();
    const correlationId = context.correlationId?.trim() || "-";
    if (!this.hasCloudCredentials || !name || !language) {
      console.error(
        "[WhatsAppService] template delivery skipped: credentials or template are not configured",
      );
      throw new WhatsAppTemplateDeliveryError({
        status: 0,
        failureClass: "permanent",
      });
    }

    const recipient = toWhatsAppCloudRecipient(phoneNumber);
    const parameters = bodyParameters
      .map((value) => value.trim())
      .filter(Boolean)
      .map((text) => ({ type: "text" as const, text }));
    const buttonParameters = urlButtonParameters
      .map((value) => value.trim())
      .filter(Boolean);
    const components = [
      ...(parameters.length > 0
        ? [
            {
              type: "body" as const,
              parameters,
            },
          ]
        : []),
      ...buttonParameters.map((text, index) => ({
        type: "button" as const,
        sub_type: "url" as const,
        index: String(index),
        parameters: [{ type: "text" as const, text }],
      })),
    ];

    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "template",
      template: {
        name,
        language: { code: language },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    console.info(
      `[WhatsAppService] template request name=${name} language=${language} correlationId=${correlationId} to=${maskWhatsAppRecipient(recipient)}`,
    );

    let response: Response;
    try {
      response = await fetch(this.messagesUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      console.error(
        `[WhatsAppService] template delivery failed name=${name} language=${language} correlationId=${correlationId} reason=${
          isTimeout ? "timeout" : "network error"
        }`,
      );
      throw new WhatsAppTemplateDeliveryError({
        status: 0,
        failureClass: "ambiguous",
      });
    }

    if (!response.ok) {
      await this.handleTemplateFailure(response, name, language, correlationId);
    }

    let messageId = "";
    let messageStatus = "";
    try {
      const body = (await response.json()) as MetaSendSuccessBody;
      messageId = body.messages?.[0]?.id?.trim() ?? "";
      messageStatus = body.messages?.[0]?.message_status?.trim() ?? "";
    } catch {
      // HTTP success without a parseable body is still treated as accepted.
    }

    console.info(
      `[WhatsAppService] template accepted name=${name} language=${language} correlationId=${correlationId} to=${maskWhatsAppRecipient(recipient)}${
        messageId ? ` messageId=${messageId}` : ""
      }${messageStatus ? ` status=${messageStatus}` : ""}`,
    );

    return { messageId, messageStatus };
  }

  /**
   * Session text reply inside the user-initiated 24-hour window.
   * Returns Meta message id when accepted. Throws on Graph rejection.
   * Transactional templates (OTP and future alerts) stay on sendOtpMessage / templates.
   */
  async sendSessionTextMessage(
    phoneNumber: string,
    body: string,
  ): Promise<WhatsAppTemplateSendResult> {
    if (!this.hasCloudCredentials) {
      throw new AppError(
        "WhatsApp messaging is not configured.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const recipient = toWhatsAppCloudRecipient(phoneNumber);
    const text = body.trim().slice(0, 4000);
    if (!text) {
      throw new AppError("Message text is required.", HTTP_STATUS.BAD_REQUEST);
    }

    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(this.messagesUrl(), {
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
    } catch (error) {
      console.error(
        `[WhatsAppService] text reply network failure latencyMs=${Date.now() - started}`,
      );
      throw new WhatsAppTemplateDeliveryError({
        status: 0,
        detail: error instanceof Error ? error.name : "network",
        failureClass: "ambiguous",
      });
    }

    if (!response.ok) {
      await this.handleTemplateFailure(response, "session_text", "und", "inbox");
    }

    const payload = (await response.json()) as MetaSendSuccessBody;
    const messageId = payload.messages?.[0]?.id?.trim() || "";
    const messageStatus = payload.messages?.[0]?.message_status?.trim() || "accepted";
    if (!messageId) {
      throw new WhatsAppTemplateDeliveryError({
        status: response.status,
        detail: "missing_message_id",
        failureClass: "ambiguous",
      });
    }

    console.info(
      `[WhatsAppService] text reply sent latencyMs=${Date.now() - started} to=${maskWhatsAppRecipient(recipient)} messageId=${messageId}`,
    );

    return { messageId, messageStatus };
  }

  /**
   * Bot-compatible session text helper. Swallows send failures so automated
   * replies never crash the inbound worker. Prefer sendSessionTextMessage for
   * admin inbox sends that must surface errors.
   */
  async sendTextMessage(phoneNumber: string, body: string): Promise<string | null> {
    try {
      if (mongoose.connection.readyState === 1) {
        const store = await import("./inbox/whatsapp-inbox-store.js");
        if (await store.isBotPausedForPhone(phoneNumber)) {
          console.info("[WhatsAppService] bot reply skipped reason=human_handoff");
          return null;
        }
      }
      const result = await this.sendSessionTextMessage(phoneNumber, body);
      if (mongoose.connection.readyState === 1) {
        try {
          const store = await import("./inbox/whatsapp-inbox-store.js");
          await store.recordOutboundMessage({
            phoneNational: phoneNumber,
            body,
            senderType: "bot",
            providerMessageId: result.messageId,
            status: "accepted",
          });
        } catch (error) {
          console.error(
            `[WhatsAppService] bot inbox persist failed reason=${
              error instanceof Error ? error.name : "unknown"
            }`,
          );
        }
      }
      return result.messageId;
    } catch (error) {
      console.error(
        `[WhatsAppService] text reply failed reason=${
          error instanceof Error ? error.name : "unknown"
        }`,
      );
      return null;
    }
  }

  async uploadMedia(input: {
    bytes: Buffer;
    mimeType: string;
    fileName: string;
  }): Promise<string> {
    if (!this.hasCloudCredentials) {
      throw new AppError(
        "WhatsApp messaging is not configured.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", input.mimeType);
    form.append(
      "file",
      new Blob([new Uint8Array(input.bytes)], { type: input.mimeType }),
      input.fileName,
    );
    const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
    const response = await fetch(
      `https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
        body: form,
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      await this.handleTemplateFailure(response, "session_media", "und", "inbox");
    }
    const payload = (await response.json()) as { id?: string };
    const mediaId = payload.id?.trim() || "";
    if (!mediaId) {
      throw new WhatsAppTemplateDeliveryError({
        status: response.status,
        detail: "missing_media_id",
        failureClass: "ambiguous",
      });
    }
    return mediaId;
  }

  async sendMediaMessage(input: {
    phoneNumber: string;
    kind: "image" | "document" | "audio" | "video";
    mediaId: string;
    caption?: string;
    fileName?: string;
  }): Promise<WhatsAppTemplateSendResult> {
    if (!this.hasCloudCredentials) {
      throw new AppError(
        "WhatsApp messaging is not configured.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
    const recipient = toWhatsAppCloudRecipient(input.phoneNumber);
    const caption = input.caption?.trim().slice(0, 1024) ?? "";
    const media: Record<string, string> = { id: input.mediaId };
    if (caption && input.kind !== "audio") media.caption = caption;
    if (input.kind === "document" && input.fileName) {
      media.filename = input.fileName;
    }
    const response = await fetch(this.messagesUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: input.kind,
        [input.kind]: media,
      }),
    });
    if (!response.ok) {
      await this.handleTemplateFailure(response, "session_media", "und", "inbox");
    }
    const payload = (await response.json()) as MetaSendSuccessBody;
    const messageId = payload.messages?.[0]?.id?.trim() || "";
    const messageStatus = payload.messages?.[0]?.message_status?.trim() || "accepted";
    if (!messageId) {
      throw new WhatsAppTemplateDeliveryError({
        status: response.status,
        detail: "missing_message_id",
        failureClass: "ambiguous",
      });
    }
    return { messageId, messageStatus };
  }

  async downloadMedia(
    mediaId: string,
    options?: { maxBytes?: number },
  ): Promise<{ buffer: Buffer; mimeType: string }> {
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
    // SSRF guard: only fetch Meta CDN hosts returned by Graph API.
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(mediaUrl);
    } catch {
      throw new Error("WhatsApp media URL invalid");
    }
    if (parsedUrl.protocol !== "https:") {
      throw new Error("WhatsApp media URL protocol rejected");
    }
    const host = parsedUrl.hostname.toLowerCase();
    const allowedHost =
      host.endsWith(".fbcdn.net") ||
      host.endsWith(".facebook.com") ||
      host === "lookaside.fbsbx.com" ||
      host.endsWith(".whatsapp.net");
    if (!allowedHost) {
      throw new Error("WhatsApp media URL host rejected");
    }

    const file = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(20_000),
      redirect: "error",
    });
    if (!file.ok) {
      throw new Error(`WhatsApp media download failed status=${file.status}`);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const maxBytes = options?.maxBytes ?? 8_000_000;
    if (bytes.length === 0 || bytes.length > maxBytes) {
      throw new Error("WhatsApp media size is invalid");
    }

    return {
      buffer: bytes,
      mimeType: payload.mime_type?.trim() || "audio/ogg",
    };
  }

  private async handleTemplateFailure(
    response: Response,
    templateName: string,
    language: string,
    correlationId: string,
  ): Promise<never> {
    let errorCode: number | undefined;
    let errorType = "";
    let fbtraceId = "";
    let detail = "";

    try {
      const body = (await response.json()) as MetaErrorBody;
      errorCode = body.error?.code;
      errorType = body.error?.type?.trim() ?? "";
      fbtraceId = body.error?.fbtrace_id?.trim() ?? "";
      detail = sanitizeWhatsAppErrorDetail(
        body.error?.error_user_title ||
          body.error?.error_user_msg ||
          body.error?.message ||
          "",
      );
    } catch {
      // Ignore unreadable Meta error payloads.
    }

    console.error(
      `[WhatsAppService] template delivery failed name=${templateName} language=${language} correlationId=${correlationId} status=${response.status}` +
        `${typeof errorCode === "number" ? ` code=${errorCode}` : ""}` +
        `${errorType ? ` type=${errorType}` : ""}` +
        `${detail ? ` detail=${detail}` : ""}` +
        `${fbtraceId ? ` fbtrace=${fbtraceId}` : ""}`,
    );

    throw new WhatsAppTemplateDeliveryError({
      status: response.status,
      ...(typeof errorCode === "number" ? { metaCode: errorCode } : {}),
      ...(errorType ? { metaType: errorType } : {}),
      ...(detail ? { detail } : {}),
      failureClass: classifyWhatsAppTemplateFailure({
        status: response.status,
        metaCode: typeof errorCode === "number" ? errorCode : null,
      }),
    });
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
