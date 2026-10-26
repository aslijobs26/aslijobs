export type InboundWhatsAppMessage = {
  type?: string;
  timestamp?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  image?: { id?: string; mime_type?: string; caption?: string };
  audio?: { id?: string; mime_type?: string };
  video?: { id?: string; mime_type?: string; caption?: string };
  document?: { id?: string; mime_type?: string; caption?: string; filename?: string };
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

export type DescribedInboundMessage = {
  body: string;
  messageType: "text" | "audio_transcript" | "image" | "document" | "audio" | "video";
  mediaProviderId: string;
  mediaMimeType: string;
  mediaFileName: string;
};

function described(
  body: string,
  messageType: DescribedInboundMessage["messageType"],
  media?: { id?: string; mimeType?: string; fileName?: string },
): DescribedInboundMessage {
  return {
    body,
    messageType,
    mediaProviderId: media?.id?.trim() ?? "",
    mediaMimeType: media?.mimeType?.trim() ?? "",
    mediaFileName: media?.fileName?.trim() ?? "",
  };
}

export function describeInboundWhatsAppMessage(
  message: InboundWhatsAppMessage,
): DescribedInboundMessage | null {
  const type = message.type?.trim() || "unknown";
  if (type === "text") {
    const text = message.text?.body?.trim() ?? "";
    return text ? described(text, "text") : null;
  }
  if (type === "button") {
    const text = message.button?.text?.trim() ?? "";
    return text ? described(text, "text") : null;
  }
  if (type === "interactive") {
    const text =
      message.interactive?.button_reply?.title?.trim() ||
      message.interactive?.list_reply?.title?.trim() ||
      "";
    return described(text || "[Interactive reply]", "text");
  }
  if (type === "audio") {
    return described("[Voice message]", "audio", {
      id: message.audio?.id,
      mimeType: message.audio?.mime_type,
    });
  }
  if (type === "image") {
    return described(message.image?.caption?.trim() || "[Image]", "image", {
      id: message.image?.id,
      mimeType: message.image?.mime_type,
    });
  }
  if (type === "video") {
    return described(message.video?.caption?.trim() || "[Video]", "video", {
      id: message.video?.id,
      mimeType: message.video?.mime_type,
    });
  }
  if (type === "document") {
    const caption = message.document?.caption?.trim() ?? "";
    const filename = message.document?.filename?.trim() ?? "";
    return described(
      caption || (filename ? `[Document] ${filename}` : "[Document]"),
      "document",
      {
        id: message.document?.id,
        mimeType: message.document?.mime_type,
        fileName: filename,
      },
    );
  }
  if (type === "location") {
    const label = [message.location?.name, message.location?.address]
      .map((part) => part?.trim() ?? "")
      .filter(Boolean)
      .join(", ");
    return described(label ? `[Location] ${label}` : "[Location]", "text");
  }
  if (type === "sticker") return described("[Sticker]", "text");
  if (type === "contacts") return described("[Contact card]", "text");
  if (type === "reaction") return described("[Reaction]", "text");
  return described(`[WhatsApp ${type} message]`, "text");
}
