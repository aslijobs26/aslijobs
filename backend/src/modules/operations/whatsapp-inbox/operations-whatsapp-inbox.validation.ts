import { z } from "zod";
import {
  INBOX_TRANSLATE_DRAFT_MAX,
  INBOX_TRANSLATE_MESSAGE_BATCH_MAX,
  INBOX_TRANSLATION_LANGUAGES,
  INBOX_VIEW_LANGUAGES,
} from "./inbox-translation.constants.js";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid conversation id.");

const inboxTranslationLanguageSchema = z.enum(INBOX_TRANSLATION_LANGUAGES);
const inboxViewLanguageSchema = z.enum(INBOX_VIEW_LANGUAGES);

export const listWhatsAppInboxConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(30),
  search: z.string().trim().max(80).optional().default(""),
  participantType: z
    .enum(["all", "job_seeker", "employer"])
    .optional()
    .default("all"),
});

export const whatsAppInboxConversationParamsSchema = z.object({
  conversationId: objectId,
});

export const whatsAppInboxMessageParamsSchema =
  whatsAppInboxConversationParamsSchema.extend({
    messageId: objectId,
  });

export const listWhatsAppInboxMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().trim().optional(),
});

export const listWhatsAppInboxContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(80).optional().default(""),
  participantType: z
    .enum(["all", "job_seeker", "employer"])
    .optional()
    .default("all"),
});

export const openWhatsAppInboxConversationBodySchema = z.object({
  participantType: z.enum(["job_seeker", "employer"]),
  accountId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid account id."),
});

export const setWhatsAppInboxBotBodySchema = z.object({
  paused: z.boolean(),
});

export const sendWhatsAppInboxMessageBodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message text is required.")
    .max(4000, "Message is too long."),
  clientMessageId: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]*$/, "Invalid client message id.")
    .optional()
    .default(""),
});

export const setWhatsAppInboxViewLanguageBodySchema = z.object({
  language: inboxViewLanguageSchema,
});

export const translateWhatsAppInboxMessagesBodySchema = z.object({
  targetLanguage: inboxTranslationLanguageSchema,
  messageIds: z
    .array(objectId)
    .min(1, "Select at least one message.")
    .max(
      INBOX_TRANSLATE_MESSAGE_BATCH_MAX,
      `Translate at most ${INBOX_TRANSLATE_MESSAGE_BATCH_MAX} messages at a time.`,
    ),
});

export const translateWhatsAppInboxDraftBodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Draft text is required.")
    .max(INBOX_TRANSLATE_DRAFT_MAX, "Draft is too long."),
  targetLanguage: inboxTranslationLanguageSchema,
});
