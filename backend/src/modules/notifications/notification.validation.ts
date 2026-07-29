import { z } from "zod";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
} from "./notification.constants.js";

const categoryFilterValues = ["all", ...NOTIFICATION_CATEGORIES] as const;

const applicationStatusValues = [
  "all",
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
  "rejected",
  "withdrawn",
] as const;

const conversationTypeValues = [
  "all",
  "active",
  "completed",
  "rejected",
  "withdrawn",
] as const;

const sortValues = [
  "newest",
  "oldest",
  "recently_updated",
  "most_notifications",
  "unread_first",
] as const;

const quickDateValues = [
  "all",
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "custom",
] as const;

const notificationTypeValues = ["all", ...NOTIFICATION_TYPES] as const;

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
  publicJobId: z.string().trim().optional().default(""),
  applicationStatus: z.enum(applicationStatusValues).optional().default("all"),
  hasType: z.enum(notificationTypeValues).optional().default("all"),
  employerAction: z.enum(notificationTypeValues).optional().default("all"),
  candidateAction: z.enum(notificationTypeValues).optional().default("all"),
  conversationType: z.enum(conversationTypeValues).optional().default("all"),
  quickDate: z.enum(quickDateValues).optional().default("all"),
  dateFrom: z.string().trim().optional().default(""),
  dateTo: z.string().trim().optional().default(""),
  sort: z.enum(sortValues).optional().default("newest"),
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
