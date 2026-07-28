import { z } from "zod";
import { NOTIFICATION_CATEGORIES } from "./notification.constants.js";

const categoryFilterValues = ["all", ...NOTIFICATION_CATEGORIES] as const;

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().trim().optional().default(""),
  readStatus: z.enum(["all", "unread", "read"]).optional().default("all"),
  category: z.enum(categoryFilterValues).optional().default("all"),
  referenceId: z.string().trim().optional().default(""),
});

export const listNotificationConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().trim().optional().default(""),
  readStatus: z.enum(["all", "unread", "read"]).optional().default("all"),
  category: z.enum(categoryFilterValues).optional().default("all"),
});

export const listConversationTimelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const conversationReferenceParamsSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid application id"),
});

export const notificationIdParamsSchema = z.object({
  notificationId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid notification id"),
});

export type ListNotificationsQuerySchema = z.infer<
  typeof listNotificationsQuerySchema
>;
export type ListNotificationConversationsQuerySchema = z.infer<
  typeof listNotificationConversationsQuerySchema
>;
export type ListConversationTimelineQuerySchema = z.infer<
  typeof listConversationTimelineQuerySchema
>;
export type ConversationReferenceParamsSchema = z.infer<
  typeof conversationReferenceParamsSchema
>;
export type NotificationIdParamsSchema = z.infer<
  typeof notificationIdParamsSchema
>;
