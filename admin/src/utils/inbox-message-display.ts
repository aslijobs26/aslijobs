import type { WhatsAppInboxMessage } from "../types/operations-whatsapp-inbox";

const MEDIA_PLACEHOLDER_BODY =
  /^\[(Image|Audio|Video|Voice message|Sticker|Document)(\]|:|\s)/i;

export function isMediaPlaceholderBody(body: string): boolean {
  const trimmed = body.trim();
  return (
    MEDIA_PLACEHOLDER_BODY.test(trimmed) ||
    trimmed === "[Image]" ||
    trimmed === "[Audio]" ||
    trimmed === "[Video]" ||
    trimmed === "[Voice message]" ||
    trimmed === "[Sticker]" ||
    trimmed.startsWith("[Document]")
  );
}

export function isUnsupportedWhatsAppBody(body: string): boolean {
  return /^\[WhatsApp .+ message/i.test(body.trim());
}

export function parseLocationMessage(body: string): {
  label: string;
  mapsUrl: string | null;
} | null {
  const trimmed = body.trim();
  if (!trimmed.startsWith("[Location]")) return null;
  const lines = trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const label = (lines[0] ?? "").replace(/^\[Location\]\s*/i, "").trim() || "Location";
  const mapsUrl =
    lines.find((line) => /^https?:\/\/maps\.google\.com\/\?q=/i.test(line)) ??
    null;
  return { label, mapsUrl };
}

export function parseContactMessage(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed.startsWith("[Contact]")) return null;
  return trimmed.replace(/^\[Contact\]\s*/i, "").trim() || "Contact card";
}

export function documentDisplayName(message: WhatsAppInboxMessage): string {
  const fileName = message.mediaFileName?.trim() ?? "";
  if (fileName) return fileName;
  if (message.body.startsWith("[Document]")) {
    return message.body.replace(/^\[Document\]\s*/i, "").trim() || "Document";
  }
  return "Document";
}

/** Normalize stored conversation previews, including legacy unsupported labels. */
export function formatConversationPreview(preview: string): string {
  const trimmed = preview.replace(/\s+/g, " ").trim();
  if (!trimmed) return trimmed;
  if (/^\[WhatsApp .+ message/i.test(trimmed)) {
    return "⚠️ Unsupported WhatsApp message";
  }
  if (trimmed === "[Image]") return "📷 Image";
  if (trimmed === "[Sticker]") return "🎨 Sticker";
  if (trimmed === "[Video]") return "🎥 Video";
  if (trimmed === "[Audio]") return "🎵 Audio";
  if (trimmed === "[Voice message]") return "🎤 Voice message";
  if (trimmed.startsWith("[Document]")) {
    const name = trimmed.replace(/^\[Document\]\s*/i, "").trim();
    return name ? `📄 ${name}` : "📄 Document";
  }
  if (trimmed.startsWith("[Location]")) {
    const label = trimmed.replace(/^\[Location\]\s*/i, "").trim();
    return label ? `📍 ${label}` : "📍 Location";
  }
  if (trimmed.startsWith("[Contact]")) {
    const label = trimmed.replace(/^\[Contact\]\s*/i, "").trim();
    return label ? `👤 ${label}` : "👤 Contact";
  }
  return trimmed;
}

export function mimeTypeLabel(mimeType: string): string {
  const mime = mimeType.trim().toLowerCase();
  if (!mime) return "File";
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word")) return "Word";
  if (mime.includes("sheet") || mime.includes("excel")) return "Excel";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "PowerPoint";
  if (mime.startsWith("text/")) return "Text";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.startsWith("video/")) return "Video";
  return mime.split("/").pop()?.toUpperCase() || "File";
}
