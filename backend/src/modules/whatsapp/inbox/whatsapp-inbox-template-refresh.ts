import { WhatsAppNotificationDispatchModel } from "../notifications/whatsapp-notification.model.js";
import {
  WhatsAppInboxConversationModel,
  WhatsAppInboxMessageModel,
} from "./whatsapp-inbox.model.js";
import {
  notificationInboxText,
  notificationPlaceholderTemplateName,
} from "./whatsapp-template-text.js";

const PREVIEW_MAX = 160;

export async function refreshStoredNotificationTemplates(): Promise<number> {
  const rows = await WhatsAppInboxMessageModel.find({
    senderType: "notification",
    body: /^WhatsApp notification sent \([^)]+\)\.?$/,
  })
    .select("_id body providerMessageId conversationId")
    .limit(300)
    .lean();
  if (rows.length === 0) return 0;

  const providerIds = rows
    .map((row) => row.providerMessageId?.trim() ?? "")
    .filter(Boolean);
  const dispatches = providerIds.length
    ? await WhatsAppNotificationDispatchModel.find({
        messageId: { $in: providerIds },
      })
        .select("messageId language")
        .lean()
    : [];
  const languageByMessageId = new Map(
    dispatches.map((row) => [row.messageId, row.language]),
  );

  let updated = 0;
  for (const row of rows) {
    const templateName = notificationPlaceholderTemplateName(row.body);
    if (!templateName) continue;
    const rendered = await notificationInboxText({
      templateName,
      language: languageByMessageId.get(row.providerMessageId) || "en",
    });
    if (!rendered || rendered === row.body || notificationPlaceholderTemplateName(rendered)) {
      continue;
    }

    await WhatsAppInboxMessageModel.updateOne(
      { _id: row._id },
      { $set: { body: rendered.slice(0, 4096) } },
    );
    const preview = previewOf(rendered);
    await WhatsAppInboxConversationModel.updateOne(
      {
        _id: row.conversationId,
        lastMessagePreview: { $regex: /^WhatsApp notification sent \(/ },
      },
      { $set: { lastMessagePreview: preview } },
    );
    updated += 1;
  }

  if (updated > 0) {
    console.info(`[WhatsAppInbox] notification templates rendered count=${updated}`);
  }
  return updated;
}

function previewOf(body: string): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, PREVIEW_MAX - 1)}…`;
}
