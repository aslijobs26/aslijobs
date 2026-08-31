import { z } from "zod";

const isoDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date format.")
  .or(z.literal(""));

export const listOperationsEmployersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional().default(""),
  verificationStatus: z
    .enum(["", "verified", "pending", "rejected"])
    .optional()
    .default(""),
  employerType: z.string().trim().max(50).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  status: z
    .enum(["", "active", "suspended", "inactive"])
    .optional()
    .default(""),
  datePreset: z
    .enum(["all", "today", "yesterday", "last_7_days", "last_30_days", "custom"])
    .optional()
    .default("all"),
  dateFrom: isoDateStringSchema.optional().default(""),
  dateTo: isoDateStringSchema.optional().default(""),
  analyticsPreset: z
    .enum(["all", "today", "yesterday", "last_7_days", "last_30_days", "custom"])
    .optional()
    .default("today"),
  analyticsFrom: isoDateStringSchema.optional().default(""),
  analyticsTo: isoDateStringSchema.optional().default(""),
});

export type ListOperationsEmployersQuery = z.infer<
  typeof listOperationsEmployersQuerySchema
>;

export const operationsEmployerIdParamsSchema = z.object({
  employerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id."),
});

export type OperationsEmployerIdParams = z.infer<
  typeof operationsEmployerIdParamsSchema
>;

export const listOperationsEmployerJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().trim().optional().default(""),
});

export type ListOperationsEmployerJobsQuery = z.infer<
  typeof listOperationsEmployerJobsQuerySchema
>;

export const updateOperationsEmployerVerificationBodySchema = z.object({
  verificationStatus: z.enum(["verified", "pending", "rejected"]),
  remarks: z.string().trim().max(500).optional().default(""),
});

export type UpdateOperationsEmployerVerificationBody = z.infer<
  typeof updateOperationsEmployerVerificationBodySchema
>;

export const updateOperationsEmployerStatusBodySchema = z.object({
  status: z.enum(["active", "suspended", "inactive"]),
  reason: z.string().trim().max(500).optional().default(""),
});

export type UpdateOperationsEmployerStatusBody = z.infer<
  typeof updateOperationsEmployerStatusBodySchema
>;
