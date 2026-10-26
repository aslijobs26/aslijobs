import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid conversation id.");

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
