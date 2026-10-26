const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

export function insertEmojiAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  emoji: string,
): { value: string; cursor: number } {
  const start = clampIndex(value, selectionStart);
  const end = clampIndex(value, Math.max(selectionEnd, start));
  const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  return { value: next, cursor: start + emoji.length };
}

export function validateInboxAttachment(file: {
  type: string;
  size: number;
}): string | null {
  const mime = file.type.trim().toLowerCase();
  const kind = IMAGE_MIME.has(mime)
    ? "image"
    : DOCUMENT_MIME.has(mime)
      ? "document"
      : AUDIO_MIME.has(mime)
        ? "audio"
        : VIDEO_MIME.has(mime)
          ? "video"
          : null;
  if (!kind) return "This file type cannot be sent on WhatsApp.";
  if (!Number.isFinite(file.size) || file.size <= 0) return "The file is empty.";
  const limit = kind === "image" ? IMAGE_MAX_BYTES : MEDIA_MAX_BYTES;
  if (file.size > limit) {
    const megabytes = Math.floor(limit / (1024 * 1024));
    return `File is larger than the ${megabytes} MB WhatsApp limit.`;
  }
  return null;
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function clampIndex(value: string, index: number): number {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(index, value.length);
}
