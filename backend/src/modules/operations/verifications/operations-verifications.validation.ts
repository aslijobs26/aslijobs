import { z } from "zod";
import { EMPLOYER_DOCUMENT_TYPES } from "../../../constants/employer.constants.js";
import { VERIFICATIONS_ANALYTICS_PRESETS } from "./operations-verifications.types.js";

const isoDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date format.")
  .or(z.literal(""));

export const verificationsAnalyticsQuerySchema = z.object({
  preset: z
    .enum(VERIFICATIONS_ANALYTICS_PRESETS)
    .optional()
    .default("last_30_days"),
  dateFrom: isoDateStringSchema.optional().default(""),
  dateTo: isoDateStringSchema.optional().default(""),
});

export type VerificationsAnalyticsQueryInput = z.infer<
  typeof verificationsAnalyticsQuerySchema
>;

export const listOperationsVerificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional().default(""),
  status: z
    .enum(["", "pending", "under_review", "verified", "rejected"])
    .optional()
    .default(""),
  /** Derived queues — same definitions as analytics tabs. */
  queue: z
    .enum(["", "under_review", "sla_breaches", "needs_attention"])
    .optional()
    .default(""),
  industry: z.string().trim().max(80).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  assignedTo: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid reviewer id.")
    .or(z.literal(""))
    .optional()
    .default(""),
  sla: z.enum(["", "within", "beyond"]).optional().default(""),
  dateFrom: isoDateStringSchema.optional().default(""),
  dateTo: isoDateStringSchema.optional().default(""),
  datePreset: z
    .enum(["all", "today", "yesterday", "last_7_days", "last_30_days", "custom"])
    .optional()
    .default("all"),
  sort: z
    .enum(["submittedAt", "companyName", "status", "sla"])
    .optional()
    .default("submittedAt"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  employerType: z.string().trim().max(50).optional().default(""),
});

export type ListOperationsVerificationsQuery = z.infer<
  typeof listOperationsVerificationsQuerySchema
>;

export const exportOperationsVerificationsQuerySchema =
  listOperationsVerificationsQuerySchema
    .omit({ page: true, limit: true })
    .extend({
      format: z.enum(["xlsx", "csv"]).optional().default("xlsx"),
    });

export type ExportOperationsVerificationsQuery = z.infer<
  typeof exportOperationsVerificationsQuerySchema
>;

export const operationsVerificationIdParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid verification id."),
});

export type OperationsVerificationIdParams = z.infer<
  typeof operationsVerificationIdParamsSchema
>;

export const operationsVerificationDocumentParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid verification id."),
  documentId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid document id."),
});

export type OperationsVerificationDocumentParams = z.infer<
  typeof operationsVerificationDocumentParamsSchema
>;

export const updateOperationsVerificationBodySchema = z
  .object({
    verificationStatus: z.enum(["verified", "rejected"]),
    remarks: z.string().trim().max(500).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (
      value.verificationStatus === "rejected" &&
      value.remarks.trim().length < 3
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["remarks"],
        message: "Rejection remarks must be at least 3 characters.",
      });
    }
  });

export type UpdateOperationsVerificationBody = z.infer<
  typeof updateOperationsVerificationBodySchema
>;

export const requestVerificationDocumentsBodySchema = z.object({
  message: z.string().trim().min(3).max(500),
  documentTypes: z
    .array(z.enum(EMPLOYER_DOCUMENT_TYPES))
    .max(20)
    .optional()
    .default([]),
});

export type RequestVerificationDocumentsBody = z.infer<
  typeof requestVerificationDocumentsBodySchema
>;
