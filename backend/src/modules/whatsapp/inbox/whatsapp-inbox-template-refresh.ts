import { WhatsAppNotificationDispatchModel } from "../notifications/whatsapp-notification.model.js";
import {
  WhatsAppInboxConversationModel,
  WhatsAppInboxMessageModel,
} from "./whatsapp-inbox.model.js";
import { renderStoredDispatchForInbox } from "./whatsapp-template-parameter-recovery.js";
import {
  isUnresolvedInboxTemplateBody,
  notificationPlaceholderTemplateName,
} from "./whatsapp-template-text.js";

const PREVIEW_MAX = 160;

export async function refreshStoredNotificationTemplates(): Promise<number> {
  const rows = await WhatsAppInboxMessageModel.find({
    senderType: "notification",
    $or: [
      { body: /^WhatsApp notification sent \([^)]+\)\.?$/ },
      { body: /\{\{\s*\d+\s*\}\}/ },
      { body: /^Historical template details unavailable/ },
    ],
  })
    .select("_id body providerMessageId conversationId")
    .limit(500)
    .lean();
  if (rows.length === 0) return 0;

  const providerIds = rows
    .map((row) => row.providerMessageId?.trim() ?? "")
    .filter(Boolean);
  const dispatches = providerIds.length
    ? await WhatsAppNotificationDispatchModel.find({
        messageId: { $in: providerIds },
      })
        .select(
          "messageId language templateName bodyParameters renderedBody event entityId",
        )
        .lean()
    : [];
  const dispatchByMessageId = new Map(
    dispatches.map((row) => [row.messageId, row]),
  );

  let updated = 0;
  for (const row of rows) {
    const dispatch = dispatchByMessageId.get(row.providerMessageId);
    const templateName =
      notificationPlaceholderTemplateName(row.body) ||
      dispatch?.templateName?.trim() ||
      "";
    if (!templateName) continue;
    if (!dispatch) continue;
    const rendered = await renderStoredDispatchForInbox({
      ...dispatch,
      templateName,
      language: dispatch.language || "en",
    });
    if (
      !rendered.body ||
      rendered.body === row.body ||
      isUnresolvedInboxTemplateBody(rendered.body) ||
      notificationPlaceholderTemplateName(rendered.body)
    ) {
      continue;
    }

    await WhatsAppInboxMessageModel.updateOne(
      { _id: row._id },
      {
        $set: {
          body: rendered.body.slice(0, 4096),
          templateName,
          templateLanguage: dispatch.language || "en",
          templateParameters: rendered.parameters,
        },
      },
    );
    const preview = previewOf(rendered.body);
    await WhatsAppInboxConversationModel.updateOne(
      {
        _id: row.conversationId,
        $or: [
          { lastMessagePreview: { $regex: /^WhatsApp notification sent \(/ } },
          { lastMessagePreview: { $regex: /\{\{\s*\d+\s*\}\}/ } },
          { lastMessagePreview: { $regex: /^Historical template details unavailable/ } },
          { lastMessagePreview: previewOf(row.body) },
        ],
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
