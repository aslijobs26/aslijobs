import type { WhatsAppInboxMessage } from "../types/operations-whatsapp-inbox";

const MEDIA_PLACEHOLDER =
  /^\[(Image|Audio|Video|Voice message|Document)(\]|:|\s)/i;

export function isTranslatableInboxMessage(
  message: Pick<WhatsAppInboxMessage, "messageType" | "body" | "hasMedia">,
): boolean {
  const body = message.body.trim();
  if (!body) return false;
  if (MEDIA_PLACEHOLDER.test(body)) return false;
  if (
    body === "[Image]" ||
    body === "[Audio]" ||
    body === "[Video]" ||
    body === "[Voice message]" ||
    body.startsWith("[Document]")
  ) {
    return false;
  }
  return [
    "text",
    "audio_transcript",
    "system",
    "image",
    "document",
    "audio",
    "video",
  ].includes(message.messageType);
}

export function translationCacheKey(
  conversationId: string,
  messageId: string,
  language: string,
): string {
  return `${conversationId}:${messageId}:${language}`;
}
