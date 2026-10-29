import { Types } from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { nationalPhone } from "../whatsapp-bot.logic.js";
import {
  combinedInboxDisplayName,
  phoneLookupVariants,
  resolveEmployerInboxIdentity,
  seekerInboxName,
} from "./whatsapp-inbox-identity.js";
import { sanitizeWhatsAppErrorDetail } from "../whatsapp.service.js";
import { inboxBodyReplacement } from "./whatsapp-template-text.js";
import {
  WhatsAppInboxConversationModel,
  WhatsAppInboxMessageModel,
  type WhatsAppInboxMessageStatus,
  type WhatsAppInboxParticipantType,
  type WhatsAppInboxSenderType,
} from "./whatsapp-inbox.model.js";

const PREVIEW_MAX = 160;
const BOT_PAUSE_MS = 24 * 60 * 60 * 1000;
const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

const STATUS_RANK: Record<WhatsAppInboxMessageStatus, number> = {
  pending: 0,
  accepted: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 100,
};

function previewOf(body: string): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= PREVIEW_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, PREVIEW_MAX - 1)}…`;
}

export function normalizeInboxPhone(fromOrNational: string): string {
  return nationalPhone(fromOrNational);
}

type InboxAccountMatch = {
  _id: { toString(): string };
  whatsappNumber?: string;
  fullName?: string;
  accountType?: string;
  companyName?: string;
  establishmentName?: string;
  firstName?: string;
  lastName?: string;
};

function participantFromMatches(
  phoneNational: string,
  seekers: InboxAccountMatch[],
  employers: InboxAccountMatch[],
): {
  participantType: WhatsAppInboxParticipantType;
  displayName: string;
  secondaryDisplayName: string;
  jobSeekerId: Types.ObjectId | null;
  employerId: Types.ObjectId | null;
} {
  const seeker = seekers.length === 1 ? seekers[0] : null;
  const employer = employers.length === 1 ? employers[0] : null;
  const ambiguous = seekers.length > 1 || employers.length > 1;
  const seekerName = seeker ? seekerInboxName(seeker.fullName) : "";
  const employerIdentity = employer
    ? resolveEmployerInboxIdentity(employer)
    : { primaryName: "", secondaryName: "" };
  const employerName = employerIdentity.primaryName;

  let participantType: WhatsAppInboxParticipantType = "unknown";
  if (!ambiguous && seeker && employer) participantType = "both";
  else if (!ambiguous && employer) participantType = "employer";
  else if (!ambiguous && seeker) participantType = "job_seeker";

  return {
    participantType,
    displayName: combinedInboxDisplayName({
      ambiguous,
      employerName,
      seekerName,
      phoneNational,
    }),
    secondaryDisplayName: ambiguous ? "" : employerIdentity.secondaryName,
    jobSeekerId: ambiguous ? null : toObjectIdOrNull(seeker?._id),
    employerId: ambiguous ? null : toObjectIdOrNull(employer?._id),
  };
}

function groupAccountsByPhone<T extends { whatsappNumber?: string }>(
  rows: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const phone = normalizeInboxPhone(row.whatsappNumber ?? "");
    if (!/^\d{10}$/.test(phone)) continue;
    const current = grouped.get(phone) ?? [];
    current.push(row);
    grouped.set(phone, current);
  }
  return grouped;
}

async function resolveParticipant(phoneNational: string): Promise<{
  participantType: WhatsAppInboxParticipantType;
  displayName: string;
  secondaryDisplayName: string;
  jobSeekerId: Types.ObjectId | null;
  employerId: Types.ObjectId | null;
}> {
  const variants = phoneLookupVariants(phoneNational);
  const [seekers, employers] = await Promise.all([
    JobSeekerModel.find({ whatsappNumber: { $in: variants } })
      .select("fullName whatsappNumber")
      .limit(2)
      .lean(),
    EmployerModel.find({ whatsappNumber: { $in: variants } })
      .select(
        "accountType companyName establishmentName firstName lastName whatsappNumber",
      )
      .limit(2)
      .lean(),
  ]);

  return participantFromMatches(phoneNational, seekers, employers);
}

export async function hydrateInboxConversations(phoneNationals: string[]) {
  const phones = phoneNationals.map((phone) => normalizeInboxPhone(phone));
  const unique = [...new Set(phones.filter((phone) => /^\d{10}$/.test(phone)))];
  if (unique.length === 0) {
    return [];
  }

  const variants = [...new Set(unique.flatMap((phone) => phoneLookupVariants(phone)))];
  const [seekers, employers, conversations] = await Promise.all([
    JobSeekerModel.find({ whatsappNumber: { $in: variants } })
      .select("fullName whatsappNumber")
      .lean(),
    EmployerModel.find({ whatsappNumber: { $in: variants } })
      .select(
        "accountType companyName establishmentName firstName lastName whatsappNumber",
      )
      .lean(),
    WhatsAppInboxConversationModel.find({ phoneNational: { $in: unique } }),
  ]);

  const seekersByPhone = groupAccountsByPhone(seekers);
  const employersByPhone = groupAccountsByPhone(employers);
  const byPhone = new Map(
    conversations.map((conversation) => [conversation.phoneNational, conversation]),
  );
  const updates: Array<{
    updateOne: {
      filter: { _id: Types.ObjectId };
      update: {
        $set: {
          participantType: WhatsAppInboxParticipantType;
          displayName: string;
          secondaryDisplayName: string;
          jobSeekerId: Types.ObjectId | null;
          employerId: Types.ObjectId | null;
        };
      };
    };
  }> = [];

  for (const conversation of conversations) {
    const resolved = participantFromMatches(
      conversation.phoneNational,
      seekersByPhone.get(conversation.phoneNational) ?? [],
      employersByPhone.get(conversation.phoneNational) ?? [],
    );
    const changed =
      conversation.participantType !== resolved.participantType ||
      conversation.displayName !== resolved.displayName ||
      (conversation.secondaryDisplayName ?? "") !== resolved.secondaryDisplayName ||
      String(conversation.jobSeekerId ?? "") !== String(resolved.jobSeekerId ?? "") ||
      String(conversation.employerId ?? "") !== String(resolved.employerId ?? "");
    if (!changed) continue;

    conversation.participantType = resolved.participantType;
    conversation.displayName = resolved.displayName;
    conversation.secondaryDisplayName = resolved.secondaryDisplayName;
    conversation.jobSeekerId = resolved.jobSeekerId;
    conversation.employerId = resolved.employerId;
    updates.push({
      updateOne: {
        filter: { _id: conversation._id },
        update: {
          $set: {
            participantType: resolved.participantType,
            displayName: resolved.displayName,
            secondaryDisplayName: resolved.secondaryDisplayName,
            jobSeekerId: resolved.jobSeekerId,
            employerId: resolved.employerId,
          },
        },
      },
    });
  }

  if (updates.length > 0) {
    await WhatsAppInboxConversationModel.bulkWrite(updates);
  }

  return phones.flatMap((phone) => {
    const conversation = byPhone.get(phone);
    return conversation ? [conversation] : [];
  });
}

function toObjectIdOrNull(
  value: { toString(): string } | null | undefined,
): Types.ObjectId | null {
  if (!value) {
    return null;
  }
  const id = value.toString();
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return null;
  }
  return new Types.ObjectId(id);
}

export async function ensureInboxConversation(phoneNational: string) {
  const phone = normalizeInboxPhone(phoneNational);
  const existing = await WhatsAppInboxConversationModel.findOne({
    phoneNational: phone,
  });
  if (existing) {
    const resolved = await resolveParticipant(phone);
    const needsUpdate =
      existing.participantType !== resolved.participantType ||
      existing.displayName !== resolved.displayName ||
      (existing.secondaryDisplayName ?? "") !== resolved.secondaryDisplayName ||
      String(existing.jobSeekerId ?? "") !== String(resolved.jobSeekerId ?? "") ||
      String(existing.employerId ?? "") !== String(resolved.employerId ?? "");
    if (needsUpdate) {
      existing.participantType = resolved.participantType;
      existing.displayName = resolved.displayName;
      existing.secondaryDisplayName = resolved.secondaryDisplayName;
      existing.jobSeekerId = resolved.jobSeekerId;
      existing.employerId = resolved.employerId;
      await existing.save();
    }
    return existing;
  }

  const resolved = await resolveParticipant(phone);
  return WhatsAppInboxConversationModel.create({
    phoneNational: phone,
    participantType: resolved.participantType,
    displayName: resolved.displayName,
    secondaryDisplayName: resolved.secondaryDisplayName,
    jobSeekerId: resolved.jobSeekerId,
    employerId: resolved.employerId,
  });
}

export async function isBotPausedForPhone(phoneNational: string): Promise<boolean> {
  const phone = normalizeInboxPhone(phoneNational);
  const conversation = await WhatsAppInboxConversationModel.findOne({
    phoneNational: phone,
  })
    .select("botPausedUntil")
    .lean();
  if (!conversation?.botPausedUntil) {
    return false;
  }
  return conversation.botPausedUntil.getTime() > Date.now();
}

export async function pauseBotForAdmin(
  phoneNational: string,
  adminUserId: string,
): Promise<void> {
  const phone = normalizeInboxPhone(phoneNational);
  await WhatsAppInboxConversationModel.updateOne(
    { phoneNational: phone },
    {
      $set: {
        botPausedUntil: new Date(Date.now() + BOT_PAUSE_MS),
        botPausedByAdminUserId: adminUserId,
      },
    },
  );
}

export function isInsideCustomerServiceWindow(lastInboundAt: Date | null | undefined): boolean {
  if (!lastInboundAt) {
    return false;
  }
  return Date.now() - lastInboundAt.getTime() <= CUSTOMER_SERVICE_WINDOW_MS;
}

export type CustomerServiceWindowState = "open" | "expired" | "none";

export function customerServiceWindowState(
  lastInboundAt: Date | null | undefined,
): CustomerServiceWindowState {
  if (!lastInboundAt) return "none";
  return isInsideCustomerServiceWindow(lastInboundAt) ? "open" : "expired";
}

export async function recordInboundUserMessage(input: {
  from: string;
  body: string;
  providerMessageId: string;
  messageType?: "text" | "audio_transcript" | "image" | "document" | "audio" | "video";
  mediaProviderId?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
  occurredAt?: Date;
}): Promise<{ conversationId: string; messageId: string; created: boolean }> {
  const phone = normalizeInboxPhone(input.from);
  const body = input.body.trim().slice(0, 4096);
  const providerMessageId = input.providerMessageId.trim();
  if (!phone || !body || !providerMessageId) {
    return { conversationId: "", messageId: "", created: false };
  }

  const existing = await WhatsAppInboxMessageModel.findOne({
    providerMessageId,
  })
    .select("_id conversationId")
    .lean();
  if (existing) {
    return {
      conversationId: String(existing.conversationId),
      messageId: String(existing._id),
      created: false,
    };
  }

  const conversation = await ensureInboxConversation(phone);
  const occurredAt = input.occurredAt ?? new Date();

  try {
    const message = await WhatsAppInboxMessageModel.create({
      conversationId: conversation._id,
      phoneNational: phone,
      direction: "inbound",
      senderType: "user",
      body,
      messageType: input.messageType ?? "text",
      mediaProviderId: input.mediaProviderId?.trim() ?? "",
      mediaMimeType: input.mediaMimeType?.trim() ?? "",
      mediaFileName: input.mediaFileName?.trim() ?? "",
      providerMessageId,
      status: "delivered",
      statusAt: occurredAt,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });

    const newerActivity =
      !conversation.lastMessageAt ||
      occurredAt.getTime() >= conversation.lastMessageAt.getTime();
    const newerInbound =
      !conversation.lastInboundAt ||
      occurredAt.getTime() >= conversation.lastInboundAt.getTime();
    const activity: Record<string, unknown> = {};
    if (newerActivity) {
      activity.lastMessageAt = occurredAt;
      activity.lastMessagePreview = previewOf(body);
      activity.lastMessageDirection = "inbound";
    }
    if (newerInbound) {
      activity.lastInboundAt = occurredAt;
    }
    await WhatsAppInboxConversationModel.updateOne(
      { _id: conversation._id },
      {
        ...(Object.keys(activity).length > 0 ? { $set: activity } : {}),
        $inc: { unreadCount: 1 },
      },
    );

    return {
      conversationId: String(conversation._id),
      messageId: String(message._id),
      created: true,
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const again = await WhatsAppInboxMessageModel.findOne({ providerMessageId })
        .select("_id conversationId")
        .lean();
      if (again) {
        return {
          conversationId: String(again.conversationId),
          messageId: String(again._id),
          created: false,
        };
      }
    }
    throw error;
  }
}

export async function recordOutboundMessage(input: {
  phoneNational: string;
  body: string;
  senderType: Extract<WhatsAppInboxSenderType, "admin" | "bot" | "notification">;
  providerMessageId?: string;
  clientMessageId?: string;
  adminUserId?: string | null;
  status: WhatsAppInboxMessageStatus;
  failureReason?: string;
  messageType?: "text" | "image" | "document" | "audio" | "video";
  mediaProviderId?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: readonly string[];
  occurredAt?: Date;
}): Promise<{ conversationId: string; messageId: string; created: boolean }> {
  const phone = normalizeInboxPhone(input.phoneNational);
  const body = input.body.trim().slice(0, 4096);
  const providerMessageId = input.providerMessageId?.trim() || "";
  const clientMessageId = input.clientMessageId?.trim() || "";
  const templateFields = templateSnapshot(input);

  if (providerMessageId) {
    const existing = await WhatsAppInboxMessageModel.findOne({ providerMessageId })
      .select("_id conversationId body")
      .lean();
    if (existing) {
      if (input.senderType === "notification") {
        await replaceUnresolvedNotificationBody(existing, body, templateFields);
      }
      return {
        conversationId: String(existing.conversationId),
        messageId: String(existing._id),
        created: false,
      };
    }
  }
  if (clientMessageId) {
    const existing = await WhatsAppInboxMessageModel.findOne({ clientMessageId })
      .select("_id conversationId body")
      .lean();
    if (existing) {
      if (input.senderType === "notification") {
        await replaceUnresolvedNotificationBody(existing, body, templateFields);
      }
      return {
        conversationId: String(existing.conversationId),
        messageId: String(existing._id),
        created: false,
      };
    }
  }

  const conversation = await ensureInboxConversation(phone);
  const occurredAt = input.occurredAt ?? new Date();

  try {
    const message = await WhatsAppInboxMessageModel.create({
      conversationId: conversation._id,
      phoneNational: phone,
      direction: "outbound",
      senderType: input.senderType,
      body,
      messageType: input.messageType ?? "text",
      mediaProviderId: input.mediaProviderId?.trim() ?? "",
      mediaMimeType: input.mediaMimeType?.trim() ?? "",
      mediaFileName: input.mediaFileName?.trim() ?? "",
      ...templateFields,
      providerMessageId,
      clientMessageId,
      status: input.status,
      failureReason: sanitizeWhatsAppErrorDetail(input.failureReason ?? ""),
      adminUserId: input.adminUserId ?? null,
      statusAt: occurredAt,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });

    if (input.status !== "failed") {
      const current = conversation.lastMessageAt?.getTime() ?? 0;
      if (occurredAt.getTime() >= current) {
        await WhatsAppInboxConversationModel.updateOne(
          { _id: conversation._id },
          {
            $set: {
              lastMessageAt: occurredAt,
              lastMessagePreview: previewOf(body),
              lastMessageDirection: "outbound",
            },
          },
        );
      }
    }

    return {
      conversationId: String(conversation._id),
      messageId: String(message._id),
      created: true,
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const again = await WhatsAppInboxMessageModel.findOne({
        ...(providerMessageId ? { providerMessageId } : { clientMessageId }),
      })
        .select("_id conversationId")
        .lean();
      if (again) {
        return {
          conversationId: String(again.conversationId),
          messageId: String(again._id),
          created: false,
        };
      }
    }
    throw error;
  }
}

export async function applyInboxDeliveryStatus(input: {
  providerMessageId: string;
  status: string;
  timestamp?: Date | null;
  errorCode?: string;
  failureDetail?: string;
}): Promise<"updated" | "ignored" | "missing"> {
  const providerMessageId = input.providerMessageId.trim();
  if (!providerMessageId) {
    return "ignored";
  }

  const mapped = mapProviderStatus(input.status);
  if (!mapped) {
    return "ignored";
  }

  const message = await WhatsAppInboxMessageModel.findOne({ providerMessageId });
  if (!message) {
    return "missing";
  }

  const currentRank = STATUS_RANK[message.status as WhatsAppInboxMessageStatus] ?? 0;
  const nextRank = STATUS_RANK[mapped];

  if (mapped !== "failed" && nextRank <= currentRank) {
    return "ignored";
  }

  message.status = mapped;
  message.statusAt = input.timestamp ?? new Date();
  if (mapped === "failed") {
    message.failureReason = sanitizeWhatsAppErrorDetail(
      input.failureDetail ||
        (input.errorCode ? `webhook_failed code=${input.errorCode}` : "webhook_failed"),
    );
  }
  await message.save();
  return "updated";
}

function templateSnapshot(input: {
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: readonly string[];
}): {
  templateName: string;
  templateLanguage: string;
  templateParameters: string[];
} {
  return {
    templateName: input.templateName?.trim().slice(0, 200) ?? "",
    templateLanguage: input.templateLanguage?.trim().slice(0, 20) ?? "",
    templateParameters: (input.templateParameters ?? [])
      .slice(0, 10)
      .map((value) => value.trim().slice(0, 1000)),
  };
}

async function replaceUnresolvedNotificationBody(
  existing: { _id: unknown; conversationId: unknown; body?: string },
  body: string,
  templateFields: {
    templateName: string;
    templateLanguage: string;
    templateParameters: string[];
  },
): Promise<void> {
  const current = existing.body ?? "";
  if (inboxBodyReplacement(current, body) !== "replace") return;
  await WhatsAppInboxMessageModel.updateOne(
    { _id: existing._id },
    { $set: { body, ...templateFields } },
  );
  const nextPreview = previewOf(body);
  await WhatsAppInboxConversationModel.updateOne(
    {
      _id: existing.conversationId,
      $or: [
        { lastMessagePreview: previewOf(current) },
        { lastMessagePreview: { $regex: /^WhatsApp notification sent \(/ } },
        { lastMessagePreview: { $regex: /\{\{\s*\d+\s*\}\}/ } },
        { lastMessagePreview: { $regex: /^Historical template details unavailable/ } },
      ],
    },
    { $set: { lastMessagePreview: nextPreview } },
  );
}

function mapProviderStatus(status: string): WhatsAppInboxMessageStatus | null {
  switch (status.trim().toLowerCase()) {
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}
