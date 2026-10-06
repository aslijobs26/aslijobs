import { z } from "zod";
import {
  EMPLOYER_OVERVIEW_KPIS,
  EMPLOYERS_ANALYTICS_PRESETS,
} from "./operations-employers-analytics.js";

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
  /** Derived verification queues (not DB enum values). */
  verificationQueue: z
    .enum(["", "under_review", "sla_breaches", "needs_attention"])
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
  /** Overview KPI card drill-down; scoped by the overview analytics range. */
  kpi: z
    .enum(["", ...EMPLOYER_OVERVIEW_KPIS])
    .optional()
    .default(""),
  kpiPreset: z.enum(EMPLOYERS_ANALYTICS_PRESETS).optional().default("all"),
  kpiDateFrom: isoDateStringSchema.optional().default(""),
  kpiDateTo: isoDateStringSchema.optional().default(""),
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

export const updateOperationsEmployerVerificationBodySchema = z
  .object({
    verificationStatus: z.enum(["verified", "pending", "rejected"]),
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

export type UpdateOperationsEmployerVerificationBody = z.infer<
  typeof updateOperationsEmployerVerificationBodySchema
>;

export const operationsEmployerDocumentParamsSchema = z.object({
  employerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id."),
  documentId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid document id."),
});

export type OperationsEmployerDocumentParams = z.infer<
  typeof operationsEmployerDocumentParamsSchema
>;

export const updateOperationsEmployerStatusBodySchema = z.object({
  status: z.enum(["active", "suspended", "inactive"]),
  reason: z.string().trim().max(500).optional().default(""),
});

export type UpdateOperationsEmployerStatusBody = z.infer<
  typeof updateOperationsEmployerStatusBodySchema
>;

export const employersAnalyticsQuerySchema = z.object({
  preset: z
    .enum([
      "all",
      "last_7_days",
      "last_30_days",
      "last_90_days",
      "this_year",
      "custom",
    ])
    .optional()
    .default("all"),
  dateFrom: isoDateStringSchema.optional().default(""),
  dateTo: isoDateStringSchema.optional().default(""),
});

export type EmployersAnalyticsQuery = z.infer<
  typeof employersAnalyticsQuerySchema
>;

export {
  registerEmployerSchema as operationsRegisterEmployerBodySchema,
  verifyEmployerOtpSchema as operationsVerifyEmployerOtpBodySchema,
  operationsCompleteEmployerProfileSchema as operationsCompleteEmployerBodySchema,
} from "../../employers/employer.validation.js";
export type {
  RegisterEmployerSchema as OperationsRegisterEmployerBody,
  VerifyEmployerOtpSchema as OperationsVerifyEmployerOtpBody,
  OperationsCompleteEmployerProfileSchema as OperationsCompleteEmployerBody,
} from "../../employers/employer.validation.js";

export const exportOperationsEmployersQuerySchema =
  listOperationsEmployersQuerySchema.omit({ page: true, limit: true }).extend({
    /** Default xlsx. Pass format=csv for UTF-8 BOM CSV. */
    format: z.enum(["xlsx", "csv"]).default("xlsx"),
  });

export type ExportOperationsEmployersQuery = z.infer<
  typeof exportOperationsEmployersQuerySchema
>;
