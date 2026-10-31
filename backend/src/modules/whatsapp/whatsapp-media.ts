export type WhatsAppMediaKind = "image" | "document" | "audio" | "video";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);
const AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/aac",
  "audio/amr",
]);
const VIDEO_MIME = new Set(["video/mp4", "video/3gpp"]);

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const MEDIA_MAX_BYTES = 16 * 1024 * 1024;

export function whatsAppMediaKind(mimeType: string): WhatsAppMediaKind | null {
  const mime = mimeType.trim().toLowerCase();
  if (IMAGE_MIME.has(mime)) return "image";
  if (DOCUMENT_MIME.has(mime)) return "document";
  if (AUDIO_MIME.has(mime)) return "audio";
  if (VIDEO_MIME.has(mime)) return "video";
  return null;
}

export function whatsAppMediaSizeLimit(kind: WhatsAppMediaKind): number {
  return kind === "image" ? IMAGE_MAX_BYTES : MEDIA_MAX_BYTES;
}

export function validateWhatsAppMedia(input: {
  mimeType: string;
  sizeBytes: number;
}): { kind: WhatsAppMediaKind } | { error: string } {
  const kind = whatsAppMediaKind(input.mimeType);
  if (!kind) {
    return { error: "This file type cannot be sent on WhatsApp." };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { error: "The file is empty." };
  }
  const limit = whatsAppMediaSizeLimit(kind);
  if (input.sizeBytes > limit) {
    const megabytes = Math.floor(limit / (1024 * 1024));
    return { error: `File is larger than the ${megabytes} MB WhatsApp limit.` };
  }
  return { kind };
}

export function safeMediaFileName(name: string): string {
  const base = name.trim().split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ()\u00C0-\u024F]+/g, "_").slice(0, 180);
  return cleaned || "file";
}
