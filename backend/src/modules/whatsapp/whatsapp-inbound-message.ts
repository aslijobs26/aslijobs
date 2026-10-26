export type InboundWhatsAppMessage = {
  type?: string;
  timestamp?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  location?: { name?: string; address?: string };
};

export function whatsAppWebhookTime(timestamp: string | undefined): Date | undefined {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds < 1_000_000_000) return undefined;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function isWebhookForConfiguredPhone(
  incomingPhoneNumberId: string | undefined,
  configuredPhoneNumberId: string,
): boolean {
  const configured = configuredPhoneNumberId.trim();
  const incoming = incomingPhoneNumberId?.trim() ?? "";
  if (!configured || !incoming) return true;
  return incoming === configured;
}

export function describeInboundWhatsAppMessage(
  message: InboundWhatsAppMessage,
): { body: string; messageType: "text" | "audio_transcript" } | null {
  const type = message.type?.trim() || "unknown";
  if (type === "text") {
    const text = message.text?.body?.trim() ?? "";
    return text ? { body: text, messageType: "text" } : null;
  }
  if (type === "button") {
    const text = message.button?.text?.trim() ?? "";
    return text ? { body: text, messageType: "text" } : null;
  }
  if (type === "interactive") {
    const text =
      message.interactive?.button_reply?.title?.trim() ||
      message.interactive?.list_reply?.title?.trim() ||
      "";
    return { body: text || "[Interactive reply]", messageType: "text" };
  }
  if (type === "audio") {
    return { body: "[Voice message]", messageType: "audio_transcript" };
  }
  if (type === "image") {
    return { body: message.image?.caption?.trim() || "[Image]", messageType: "text" };
  }
  if (type === "video") {
    return { body: message.video?.caption?.trim() || "[Video]", messageType: "text" };
  }
  if (type === "document") {
    const caption = message.document?.caption?.trim() ?? "";
    const filename = message.document?.filename?.trim() ?? "";
    return {
      body: caption || (filename ? `[Document] ${filename}` : "[Document]"),
      messageType: "text",
    };
  }
  if (type === "location") {
    const label = [message.location?.name, message.location?.address]
      .map((part) => part?.trim() ?? "")
      .filter(Boolean)
      .join(", ");
    return { body: label ? `[Location] ${label}` : "[Location]", messageType: "text" };
  }
  if (type === "sticker") return { body: "[Sticker]", messageType: "text" };
  if (type === "contacts") return { body: "[Contact card]", messageType: "text" };
  if (type === "reaction") return { body: "[Reaction]", messageType: "text" };
  return { body: `[WhatsApp ${type} message]`, messageType: "text" };
}
