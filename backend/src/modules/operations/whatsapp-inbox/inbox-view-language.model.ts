import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { INBOX_VIEW_LANGUAGES } from "./inbox-translation.constants.js";

const inboxViewLanguageSchema = new Schema(
  {
    operationsUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppInboxConversation",
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: INBOX_VIEW_LANGUAGES,
      required: true,
      default: "original",
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_inbox_view_languages",
  },
);

inboxViewLanguageSchema.index(
  { operationsUserId: 1, conversationId: 1 },
  { unique: true },
);

export type InboxViewLanguageDocument = InferSchemaType<
  typeof inboxViewLanguageSchema
> & { _id: Types.ObjectId };

export const InboxViewLanguageModel = model(
  "WhatsAppInboxViewLanguage",
  inboxViewLanguageSchema,
);
