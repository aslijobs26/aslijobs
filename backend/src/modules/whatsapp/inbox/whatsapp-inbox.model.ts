import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const WHATSAPP_INBOX_PARTICIPANT_TYPES = [
  "job_seeker",
  "employer",
  "both",
  "unknown",
] as const;

export type WhatsAppInboxParticipantType =
  (typeof WHATSAPP_INBOX_PARTICIPANT_TYPES)[number];

export const WHATSAPP_INBOX_MESSAGE_DIRECTIONS = [
  "inbound",
  "outbound",
] as const;

export type WhatsAppInboxMessageDirection =
  (typeof WHATSAPP_INBOX_MESSAGE_DIRECTIONS)[number];

export const WHATSAPP_INBOX_SENDER_TYPES = [
  "user",
  "bot",
  "admin",
  "notification",
] as const;

export type WhatsAppInboxSenderType =
  (typeof WHATSAPP_INBOX_SENDER_TYPES)[number];

/**
 * Processing / delivery lifecycle for inbox messages.
 * accepted = Meta returned a message id (not delivery).
 * sent | delivered | read advance via webhooks only.
 */
export const WHATSAPP_INBOX_MESSAGE_STATUSES = [
  "pending",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
] as const;

export type WhatsAppInboxMessageStatus =
  (typeof WHATSAPP_INBOX_MESSAGE_STATUSES)[number];

const conversationSchema = new Schema(
  {
    phoneNational: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    participantType: {
      type: String,
      enum: WHATSAPP_INBOX_PARTICIPANT_TYPES,
      required: true,
      default: "unknown",
      index: true,
    },
    displayName: { type: String, trim: true, default: "" },
    /**
     * Contact person for company/consultancy employer threads.
     * Empty for individuals, job seekers, and ambiguous numbers.
     */
    secondaryDisplayName: { type: String, trim: true, default: "" },
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      default: null,
      index: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      default: null,
      index: true,
    },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, trim: true, default: "" },
    lastMessageDirection: {
      type: String,
      enum: [...WHATSAPP_INBOX_MESSAGE_DIRECTIONS, ""],
      default: "",
    },
    lastInboundAt: { type: Date, default: null, index: true },
    unreadCount: { type: Number, default: 0, min: 0 },
    /** When set and in the future, the auto-reply bot skips this phone. */
    botPausedUntil: { type: Date, default: null, index: true },
    botPausedByAdminUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
  },
  { timestamps: true },
);

conversationSchema.index({ lastMessageAt: -1, _id: -1 });
conversationSchema.index({ participantType: 1, lastMessageAt: -1 });
conversationSchema.index({ displayName: 1 });

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppInboxConversation",
      required: true,
      index: true,
    },
    phoneNational: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    direction: {
      type: String,
      enum: WHATSAPP_INBOX_MESSAGE_DIRECTIONS,
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: WHATSAPP_INBOX_SENDER_TYPES,
      required: true,
      index: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 4096 },
    templateName: { type: String, trim: true, default: "" },
    templateLanguage: { type: String, trim: true, default: "" },
    templateParameters: { type: [String], default: [] },
    messageType: {
      type: String,
      enum: ["text", "audio_transcript", "system", "image", "document", "audio", "video"],
      default: "text",
    },
    mediaProviderId: { type: String, trim: true, default: "" },
    mediaMimeType: { type: String, trim: true, default: "" },
    mediaFileName: { type: String, trim: true, default: "" },
    providerMessageId: {
      type: String,
      trim: true,
      default: "",
    },
    clientMessageId: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: WHATSAPP_INBOX_MESSAGE_STATUSES,
      required: true,
      default: "pending",
      index: true,
    },
    failureReason: { type: String, trim: true, default: "" },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    statusAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

messageSchema.index(
  { providerMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { providerMessageId: { $type: "string", $gt: "" } },
  },
);
messageSchema.index(
  { clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string", $gt: "" } },
  },
);
messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });

export type WhatsAppInboxConversationDocument = InferSchemaType<
  typeof conversationSchema
> & { _id: Types.ObjectId };

export type WhatsAppInboxMessageDocument = InferSchemaType<
  typeof messageSchema
> & { _id: Types.ObjectId };

export const WhatsAppInboxConversationModel = model(
  "WhatsAppInboxConversation",
  conversationSchema,
);

export const WhatsAppInboxMessageModel = model(
  "WhatsAppInboxMessage",
  messageSchema,
);
