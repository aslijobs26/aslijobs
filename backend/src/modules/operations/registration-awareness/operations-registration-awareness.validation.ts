import { z } from "zod";
import { OPERATIONS_REGISTRATION_ENTITY_TYPES } from "./operations-registration-awareness.constants.js";

export const markRegistrationSeenParamsSchema = z.object({
  entityType: z.enum(OPERATIONS_REGISTRATION_ENTITY_TYPES),
  entityId: z.string().trim().min(1),
});

export const markRegistrationsSeenBodySchema = z.object({
  entityType: z.enum(OPERATIONS_REGISTRATION_ENTITY_TYPES),
  entityIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

export const listOperationsNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const markNotificationReadParamsSchema = z.object({
  notificationId: z.string().trim().min(1),
});

export type MarkRegistrationSeenParams = z.infer<
  typeof markRegistrationSeenParamsSchema
>;
export type MarkRegistrationsSeenBody = z.infer<
  typeof markRegistrationsSeenBodySchema
>;
