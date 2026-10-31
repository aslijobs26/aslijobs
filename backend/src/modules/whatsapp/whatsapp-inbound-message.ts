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
  audio?: { id?: string; mime_type?: string; voice?: boolean };
  video?: { id?: string; mime_type?: string; caption?: string };
  document?: {
    id?: string;
    mime_type?: string;
    caption?: string;
    filename?: string;
  };
  sticker?: { id?: string; mime_type?: string; animated?: boolean };
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name?: { formatted_name?: string; first_name?: string; last_name?: string };
    phones?: Array<{ phone?: string; type?: string; wa_id?: string }>;
  }>;
  reaction?: { emoji?: string; message_id?: string };
  unsupported?: { type?: string };
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: { details?: string };
  }>;
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

function describeImage(message: InboundWhatsAppMessage): DescribedInboundMessage {
  return described(message.image?.caption?.trim() || "[Image]", "image", {
    id: message.image?.id,
    mimeType: message.image?.mime_type,
  });
}

function describeVideo(message: InboundWhatsAppMessage): DescribedInboundMessage {
  return described(message.video?.caption?.trim() || "[Video]", "video", {
    id: message.video?.id,
    mimeType: message.video?.mime_type,
  });
}

function describeAudio(message: InboundWhatsAppMessage): DescribedInboundMessage {
  const voice = Boolean(message.audio?.voice);
  return described(voice ? "[Voice message]" : "[Audio]", "audio", {
    id: message.audio?.id,
    mimeType: message.audio?.mime_type,
  });
}

function describeDocument(message: InboundWhatsAppMessage): DescribedInboundMessage {
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

function describeSticker(message: InboundWhatsAppMessage): DescribedInboundMessage {
  // Stickers are WebP images; reuse the image media pipeline for download/preview.
  return described("[Sticker]", "image", {
    id: message.sticker?.id,
    mimeType: message.sticker?.mime_type || "image/webp",
    fileName: "sticker.webp",
  });
}

function describeLocation(message: InboundWhatsAppMessage): DescribedInboundMessage {
  const name = message.location?.name?.trim() ?? "";
  const address = message.location?.address?.trim() ?? "";
  const lat = message.location?.latitude;
  const lng = message.location?.longitude;
  const label = [name, address].filter(Boolean).join(", ");
  const hasCoords =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);
  const maps = hasCoords
    ? `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lng}`)}`
    : "";
  const parts = [
    label ? `[Location] ${label}` : "[Location]",
    hasCoords ? `${lat}, ${lng}` : "",
    maps,
  ].filter(Boolean);
  return described(parts.join("\n"), "text");
}

function describeContacts(message: InboundWhatsAppMessage): DescribedInboundMessage {
  const contacts = message.contacts ?? [];
  if (contacts.length === 0) {
    return described("[Contact card]", "text");
  }
  const lines = contacts.map((contact) => {
    const name =
      contact.name?.formatted_name?.trim() ||
      [contact.name?.first_name, contact.name?.last_name]
        .map((part) => part?.trim() ?? "")
        .filter(Boolean)
        .join(" ") ||
      "Contact";
    const phones = (contact.phones ?? [])
      .map((entry) => entry.phone?.trim() || entry.wa_id?.trim() || "")
      .filter(Boolean);
    return phones.length > 0 ? `${name}: ${phones.join(", ")}` : name;
  });
  return described(`[Contact] ${lines.join(" · ")}`, "text");
}

function describeReaction(message: InboundWhatsAppMessage): DescribedInboundMessage {
  const emoji = message.reaction?.emoji?.trim() ?? "";
  return described(emoji ? `[Reaction] ${emoji}` : "[Reaction]", "text");
}

function describeUnsupported(message: InboundWhatsAppMessage): DescribedInboundMessage {
  const subtype = message.unsupported?.type?.trim() || "";
  const error = message.errors?.find((item) => item) ?? null;
  const detail =
    error?.error_data?.details?.trim() ||
    error?.title?.trim() ||
    error?.message?.trim() ||
    "";
  const code =
    typeof error?.code === "number" && Number.isFinite(error.code)
      ? ` (${error.code})`
      : "";

  if (subtype) {
    const readable = subtype.replace(/_/g, " ");
    return described(
      `[WhatsApp ${readable} message — not available via Cloud API${code}]`,
      "text",
    );
  }
  if (detail) {
    return described(`[WhatsApp unsupported message — ${detail}${code}]`, "text");
  }
  return described(`[WhatsApp unsupported message${code}]`, "text");
}

/**
 * Some webhook edge cases omit or mis-set `type` while still including a media
 * object. Prefer the concrete payload over the catch-all unsupported label.
 */
function inferFromMediaObjects(
  message: InboundWhatsAppMessage,
): DescribedInboundMessage | null {
  if (message.image?.id) return describeImage(message);
  if (message.video?.id) return describeVideo(message);
  if (message.audio?.id) return describeAudio(message);
  if (message.document?.id) return describeDocument(message);
  if (message.sticker?.id) return describeSticker(message);
  if (
    message.location &&
    (message.location.latitude != null ||
      message.location.longitude != null ||
      message.location.name ||
      message.location.address)
  ) {
    return describeLocation(message);
  }
  if (message.contacts && message.contacts.length > 0) {
    return describeContacts(message);
  }
  return null;
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
  if (type === "audio") return describeAudio(message);
  if (type === "image") return describeImage(message);
  if (type === "video") return describeVideo(message);
  if (type === "document") return describeDocument(message);
  if (type === "sticker") return describeSticker(message);
  if (type === "location") return describeLocation(message);
  if (type === "contacts") return describeContacts(message);
  if (type === "reaction") return describeReaction(message);
  if (type === "unsupported" || type === "unknown") {
    return inferFromMediaObjects(message) ?? describeUnsupported(message);
  }

  return inferFromMediaObjects(message) ?? described(`[WhatsApp ${type} message]`, "text");
}

const PREVIEW_MAX = 160;

/** Conversation-list preview that prefers media labels over raw placeholders. */
export function inboxListPreview(input: {
  body: string;
  messageType?: string;
  mediaFileName?: string;
}): string {
  const type = input.messageType?.trim() || "text";
  const body = input.body.replace(/\s+/g, " ").trim();
  const fileName = input.mediaFileName?.trim() || "";

  if (type === "image") {
    if (body === "[Sticker]") return "🎨 Sticker";
    if (body && body !== "[Image]") return clipPreview(`📷 ${body}`);
    return "📷 Image";
  }
  if (type === "video") {
    if (body && body !== "[Video]") return clipPreview(`🎥 ${body}`);
    return "🎥 Video";
  }
  if (type === "audio") {
    return body === "[Voice message]" ? "🎤 Voice message" : "🎵 Audio";
  }
  if (type === "document") {
    const name =
      fileName ||
      (body.startsWith("[Document]")
        ? body.replace(/^\[Document\]\s*/i, "").trim()
        : "");
    return name ? `📄 ${clipPreview(name)}` : "📄 Document";
  }
  if (body.startsWith("[Location]")) return clipPreview(`📍 ${body.replace(/^\[Location\]\s*/i, "") || "Location"}`);
  if (body.startsWith("[Contact]")) return clipPreview(`👤 ${body.replace(/^\[Contact\]\s*/i, "") || "Contact"}`);
  if (body.startsWith("[Reaction]")) return clipPreview(body.replace(/^\[Reaction\]\s*/i, "") || "Reaction");
  if (/^\[WhatsApp .+ message/i.test(body)) {
    return "⚠️ Unsupported WhatsApp message";
  }
  return clipPreview(body);
}

function clipPreview(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, PREVIEW_MAX - 1)}…`;
}
