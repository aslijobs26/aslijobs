import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  INBOX_TRANSLATION_LANGUAGES,
  INBOX_TRANSLATION_PIPELINE_VERSION,
  INBOX_TRANSLATION_PROVIDER,
} from "./inbox-translation.constants.js";

const inboxMessageTranslationSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppInboxConversation",
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppInboxMessage",
      required: true,
      index: true,
    },
    sourceHash: {
      type: String,
      required: true,
      trim: true,
    },
    sourceLanguage: {
      type: String,
      enum: INBOX_TRANSLATION_LANGUAGES,
      required: true,
    },
    targetLanguage: {
      type: String,
      enum: INBOX_TRANSLATION_LANGUAGES,
      required: true,
      index: true,
    },
    translatedText: {
      type: String,
      required: true,
      maxlength: 8192,
    },
    provider: {
      type: String,
      required: true,
      default: INBOX_TRANSLATION_PROVIDER,
      trim: true,
    },
    pipelineVersion: {
      type: String,
      required: true,
      default: INBOX_TRANSLATION_PIPELINE_VERSION,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ready"],
      required: true,
      default: "ready",
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_inbox_message_translations",
  },
);

inboxMessageTranslationSchema.index(
  {
    messageId: 1,
    targetLanguage: 1,
    sourceHash: 1,
    pipelineVersion: 1,
  },
  { unique: true },
);

inboxMessageTranslationSchema.index({
  conversationId: 1,
  targetLanguage: 1,
  updatedAt: -1,
});

export type InboxMessageTranslationDocument = InferSchemaType<
  typeof inboxMessageTranslationSchema
> & { _id: Types.ObjectId };

export const InboxMessageTranslationModel = model(
  "WhatsAppInboxMessageTranslation",
  inboxMessageTranslationSchema,
);
