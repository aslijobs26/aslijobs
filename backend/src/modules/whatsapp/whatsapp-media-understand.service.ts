import { env } from "../../config/env.js";
import { WhatsAppService } from "./whatsapp.service.js";
import {
  extractDocumentText,
  extractResumeHints,
  type MediaExtractResult,
} from "./whatsapp-media-extract.js";
import {
  buildResumeExtractSummary,
  mediaEmptyOrFailedCopy,
  mediaEncryptedCopy,
  mediaImageAskCopy,
  mediaJobAdSummaryCopy,
  mediaOcrEmptyCopy,
  mediaReceivedAskIntentCopy,
  mediaUnsupportedCopy,
} from "./whatsapp-media-messages.js";
import type { BotLanguage } from "./whatsapp-bot.logic.js";
import { validateWhatsAppMedia, whatsAppMediaKind } from "./whatsapp-media.js";
import { createWhatsAppOcrProvider } from "./ocr/whatsapp-ocr.factory.js";
import {
  detectImageKind,
  declaredMimeMatchesImage,
  imageMimeForKind,
  readImageDimensions,
} from "./ocr/whatsapp-image-signature.js";

const whatsAppService = new WhatsAppService();

export type MediaUnderstandOutcome = {
  replyText: string;
  status: "completed" | "failed" | "unsupported" | "ask_intent";
  extractedChars: number;
  storedPath: string;
  source?: string;
  skills: string[];
};

function profileUrl(): string {
  return `${env.FRONTEND_URL.replace(/\/+$/, "")}/job-seeker/profile`;
}

/**
 * Inbound WhatsApp media is processed in memory only.
 * Cloudinary uploads here would create public URLs — do not persist resumes publicly.
 */
function skipPublicMediaPersistence(): true {
  return true;
}

function replyForExtractFailure(
  language: BotLanguage,
  extracted: Extract<MediaExtractResult, { ok: false }>,
): Pick<MediaUnderstandOutcome, "replyText" | "status"> {
  if (extracted.reason === "unsupported" || extracted.reason === "too_large") {
    return { replyText: mediaUnsupportedCopy(language), status: "unsupported" };
  }
  if (extracted.reason === "encrypted") {
    return { replyText: mediaEncryptedCopy(language), status: "failed" };
  }
  if (extracted.reason === "ocr_disabled") {
    return { replyText: mediaEmptyOrFailedCopy(language), status: "failed" };
  }
  return { replyText: mediaEmptyOrFailedCopy(language), status: "failed" };
}

function buildTextOutcome(
  language: BotLanguage,
  text: string,
  truncated: boolean,
  source: string,
): MediaUnderstandOutcome {
  const hints = extractResumeHints(text);
  let replyText: string;
  if (hints.looksLikeJobAd && !hints.looksLikeResume) {
    replyText = mediaJobAdSummaryCopy({
      language,
      skills: hints.skills,
      truncated,
    });
  } else {
    replyText = buildResumeExtractSummary({
      language,
      skills: hints.skills,
      missingHints: hints.missingHints,
      truncated,
      profileUrl: profileUrl(),
    });
  }
  console.info(
    `[WhatsAppMedia] status=completed source=${source} chars=${text.length} skills=${hints.skills.length} jobAd=${hints.looksLikeJobAd} resume=${hints.looksLikeResume}`,
  );
  return {
    replyText,
    status: "completed",
    extractedChars: text.length,
    storedPath: "",
    source,
    skills: hints.skills,
  };
}

async function processImageBuffer(input: {
  buffer: Buffer;
  declaredMime: string;
  language: BotLanguage;
  caption?: string;
  started: number;
}): Promise<MediaUnderstandOutcome> {
  const kind = detectImageKind(input.buffer);
  if (!kind || !declaredMimeMatchesImage(input.declaredMime, kind)) {
    console.info(
      `[WhatsAppMedia] status=unsupported kind=image reason=signature latencyMs=${Date.now() - input.started}`,
    );
    return {
      replyText: mediaUnsupportedCopy(input.language),
      status: "unsupported",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  const dims = readImageDimensions(input.buffer, kind);
  if (dims && (dims.width > 4_096 || dims.height > 4_096)) {
    return {
      replyText: mediaUnsupportedCopy(input.language),
      status: "unsupported",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  if (!env.WHATSAPP_OCR_ENABLED) {
    console.info(
      `[WhatsAppMedia] status=ask_intent kind=image ocr=off latencyMs=${Date.now() - input.started}`,
    );
    return {
      replyText: mediaImageAskCopy(input.language),
      status: "ask_intent",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  const ocr = createWhatsAppOcrProvider();
  const result = await ocr.recognizeImage({
    buffer: input.buffer,
    mimeType: imageMimeForKind(kind),
    languages: env.WHATSAPP_OCR_LANGUAGES,
    timeoutMs: env.WHATSAPP_OCR_TIMEOUT_MS,
    maxTextChars: env.WHATSAPP_MEDIA_MAX_EXTRACT_CHARS,
  });

  console.info(
    `[WA-OCR] provider=${result.provider} ok=${result.ok ? "yes" : "no"} durationMs=${result.durationMs}${
      result.ok ? ` chars=${result.text.length}` : ` error=${result.errorCode}`
    }`,
  );

  if (!result.ok) {
    if (result.errorCode === "empty" || result.errorCode === "timeout") {
      return {
        replyText: mediaOcrEmptyCopy(input.language),
        status: "failed",
        extractedChars: 0,
        storedPath: "",
        skills: [],
      };
    }
    return {
      replyText: mediaEmptyOrFailedCopy(input.language),
      status: "failed",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  // Caption is untrusted user text — append only as a short user question hint, not instructions.
  const combined = input.caption?.trim()
    ? `${result.text}\n\nUser caption: ${input.caption.trim().slice(0, 200)}`
    : result.text;

  return buildTextOutcome(
    input.language,
    combined,
    result.truncated,
    "image_ocr",
  );
}

/**
 * Download Meta media, validate, extract/OCR. Never auto-overwrites JobSeeker profile fields.
 * Never waits on Meta webhook ACK — caller already ACKed and queued.
 */
export async function understandInboundWhatsAppMedia(input: {
  mediaId: string;
  mimeType?: string;
  fileName?: string;
  messageType?: string;
  language: BotLanguage;
  phoneHash: string;
  caption?: string;
}): Promise<MediaUnderstandOutcome> {
  if (!env.WHATSAPP_MEDIA_UNDERSTAND_ENABLED) {
    return {
      replyText: mediaReceivedAskIntentCopy(input.language),
      status: "ask_intent",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  const started = Date.now();
  let buffer: Buffer;
  let mimeType = input.mimeType?.trim() || "application/octet-stream";
  try {
    const media = await whatsAppService.downloadMedia(input.mediaId, {
      maxBytes: env.WHATSAPP_MEDIA_MAX_BYTES,
    });
    buffer = media.buffer;
    mimeType = input.mimeType?.trim() || media.mimeType || mimeType;
  } catch (error) {
    console.error(
      `[WhatsAppMedia] download_failed reason=${error instanceof Error ? error.name : "unknown"} latencyMs=${Date.now() - started}`,
    );
    return {
      replyText: mediaEmptyOrFailedCopy(input.language),
      status: "failed",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  // Prefer magic-byte image detection over declared MIME.
  const imageKind = detectImageKind(buffer);
  const isImage =
    input.messageType === "image" ||
    Boolean(imageKind) ||
    whatsAppMediaKind(mimeType) === "image";

  if (isImage && imageKind) {
    skipPublicMediaPersistence();
    return processImageBuffer({
      buffer,
      declaredMime: mimeType,
      language: input.language,
      caption: input.caption || input.fileName,
      started,
    });
  }

  const kind = whatsAppMediaKind(mimeType);
  const sizeCheck = validateWhatsAppMedia({ mimeType, sizeBytes: buffer.length });
  if ("error" in sizeCheck && !imageKind) {
    // Still allow documents when MIME is wrong but PDF/DOCX magic matches.
  } else if ("error" in sizeCheck && kind === "image") {
    return {
      replyText: mediaUnsupportedCopy(input.language),
      status: "unsupported",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  if (kind === "image" || input.messageType === "image") {
    return {
      replyText: mediaUnsupportedCopy(input.language),
      status: "unsupported",
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  skipPublicMediaPersistence();

  let extracted: MediaExtractResult;
  try {
    extracted = await extractDocumentText({
      buffer,
      mimeType,
      fileName: input.fileName,
      allowOcr: env.WHATSAPP_OCR_ENABLED,
    });
  } catch {
    extracted = { ok: false, kind: "unsupported", reason: "parse_failed" };
  }

  if (!extracted.ok) {
    const mapped = replyForExtractFailure(input.language, extracted);
    console.info(
      `[WhatsAppMedia] status=${mapped.status} reason=${extracted.reason} latencyMs=${Date.now() - started}`,
    );
    return {
      replyText: mapped.replyText,
      status: mapped.status,
      extractedChars: 0,
      storedPath: "",
      skills: [],
    };
  }

  const outcome = buildTextOutcome(
    input.language,
    extracted.text,
    extracted.truncated,
    extracted.source,
  );
  console.info(
    `[WhatsAppMedia] status=completed kind=${extracted.kind} source=${extracted.source} chars=${extracted.text.length} latencyMs=${Date.now() - started}`,
  );
  return outcome;
}
