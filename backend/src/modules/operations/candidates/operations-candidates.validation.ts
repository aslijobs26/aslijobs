import { z } from "zod";
import { JOB_SEEKER_GENDERS } from "../../../constants/job-seeker.constants.js";
import { APPLICATION_STATUSES } from "../../applications/application.constants.js";

const operationsCandidateGenderQuerySchema = z
  .union([z.enum(JOB_SEEKER_GENDERS), z.literal("")])
  .optional()
  .default("");

export const OPERATIONS_CANDIDATE_TABS = [
  "all",
  "applied",
  "under_review",
  "shortlisted",
  "interview",
  "hired",
  "rejected",
] as const;

export const OPERATIONS_CANDIDATE_DATE_PRESETS = [
  "all",
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "custom",
] as const;

export const OPERATIONS_CANDIDATE_PROFILE_STATUSES = [
  "complete",
  "incomplete",
] as const;

export const listOperationsCandidatesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    tab: z.enum(OPERATIONS_CANDIDATE_TABS).default("all"),
    search: z.string().trim().max(200).optional().default(""),
    status: z
      .union([z.enum(APPLICATION_STATUSES), z.literal("")])
      .optional()
      .default(""),
    jobId: z.string().trim().max(40).optional().default(""),
    employerId: z
      .union([
        z
          .string()
          .trim()
          .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id."),
        z.literal(""),
      ])
      .optional()
      .default(""),
    location: z.string().trim().max(120).optional().default(""),
    experience: z.string().trim().max(80).optional().default(""),
    gender: operationsCandidateGenderQuerySchema,
    preferredRole: z.string().trim().max(120).optional().default(""),
    profileStatus: z
      .union([z.enum(OPERATIONS_CANDIDATE_PROFILE_STATUSES), z.literal("")])
      .optional()
      .default(""),
    verificationStatus: z
      .enum(["", "verified", "pending"])
      .optional()
      .default(""),
    applicationPresence: z
      .enum(["", "has", "none"])
      .optional()
      .default(""),
    overviewTab: z
      .enum(["all", "new", "profileIncomplete", "verificationPending"])
      .optional()
      .default("all"),
    datePreset: z.enum(OPERATIONS_CANDIDATE_DATE_PRESETS).default("all"),
    dateFrom: z.string().trim().max(32).optional().default(""),
    dateTo: z.string().trim().max(32).optional().default(""),
    dateField: z.enum(["applied", "registered"]).default("registered"),
    analyticsPreset: z
      .enum(OPERATIONS_CANDIDATE_DATE_PRESETS)
      .optional()
      .default("today"),
    analyticsFrom: z.string().trim().max(32).optional().default(""),
    analyticsTo: z.string().trim().max(32).optional().default(""),
    sort: z
      .enum(["newest", "oldest", "updated"])
      .optional()
      .default("newest"),
  })
  .superRefine((value, ctx) => {
    if (value.datePreset === "custom" && !value.dateFrom && !value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a custom date range.",
        path: ["dateFrom"],
      });
    }
    if (
      value.analyticsPreset === "custom" &&
      !value.analyticsFrom &&
      !value.analyticsTo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a custom analytics date range.",
        path: ["analyticsFrom"],
      });
    }
  });

export type ListOperationsCandidatesQuery = z.infer<
  typeof listOperationsCandidatesQuerySchema
>;

export const listOperationsCandidateApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListOperationsCandidateApplicationsQuery = z.infer<
  typeof listOperationsCandidateApplicationsQuerySchema
>;

export const operationsCandidateApplicationIdParamsSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid application id."),
});

export type OperationsCandidateApplicationIdParams = z.infer<
  typeof operationsCandidateApplicationIdParamsSchema
>;

export const operationsCandidateSeekerIdParamsSchema = z.object({
  jobSeekerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid candidate id."),
});

export type OperationsCandidateSeekerIdParams = z.infer<
  typeof operationsCandidateSeekerIdParamsSchema
>;

export const candidatesAnalyticsQuerySchema = z.object({
  preset: z
    .enum(["all", "last_7_days", "last_30_days", "last_3_months", "custom"])
    .optional()
    .default("all"),
  dateFrom: z.string().trim().max(32).optional().default(""),
  dateTo: z.string().trim().max(32).optional().default(""),
});

export type CandidatesAnalyticsQuery = z.infer<
  typeof candidatesAnalyticsQuerySchema
>;

/**
 * Zod v4 forbids `.omit()` on schemas that already have refinements.
 * Keep the export shape identical to the list filters (minus page/limit).
 */
const operationsCandidatesExportBaseSchema = z.object({
  tab: z.enum(OPERATIONS_CANDIDATE_TABS).default("all"),
  search: z.string().trim().max(200).optional().default(""),
  status: z
    .union([z.enum(APPLICATION_STATUSES), z.literal("")])
    .optional()
    .default(""),
  jobId: z.string().trim().max(40).optional().default(""),
  employerId: z
    .union([
      z
        .string()
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id."),
      z.literal(""),
    ])
    .optional()
    .default(""),
  location: z.string().trim().max(120).optional().default(""),
  experience: z.string().trim().max(80).optional().default(""),
  gender: operationsCandidateGenderQuerySchema,
  preferredRole: z.string().trim().max(120).optional().default(""),
  profileStatus: z
    .union([z.enum(OPERATIONS_CANDIDATE_PROFILE_STATUSES), z.literal("")])
    .optional()
    .default(""),
  verificationStatus: z
    .enum(["", "verified", "pending"])
    .optional()
    .default(""),
  applicationPresence: z.enum(["", "has", "none"]).optional().default(""),
  overviewTab: z
    .enum(["all", "new", "profileIncomplete", "verificationPending"])
    .optional()
    .default("all"),
  datePreset: z.enum(OPERATIONS_CANDIDATE_DATE_PRESETS).default("all"),
  dateFrom: z.string().trim().max(32).optional().default(""),
  dateTo: z.string().trim().max(32).optional().default(""),
  dateField: z.enum(["applied", "registered"]).default("registered"),
  analyticsPreset: z
    .enum(OPERATIONS_CANDIDATE_DATE_PRESETS)
    .optional()
    .default("today"),
  analyticsFrom: z.string().trim().max(32).optional().default(""),
  analyticsTo: z.string().trim().max(32).optional().default(""),
  sort: z.enum(["newest", "oldest", "updated"]).optional().default("newest"),
  format: z.enum(["xlsx", "csv"]).default("xlsx"),
});

export const exportOperationsCandidatesQuerySchema =
  operationsCandidatesExportBaseSchema.superRefine((value, ctx) => {
    if (value.datePreset === "custom" && !value.dateFrom && !value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a custom date range.",
        path: ["dateFrom"],
      });
    }
    if (
      value.analyticsPreset === "custom" &&
      !value.analyticsFrom &&
      !value.analyticsTo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a custom analytics date range.",
        path: ["analyticsFrom"],
      });
    }
  });

export type ExportOperationsCandidatesQuery = z.infer<
  typeof exportOperationsCandidatesQuerySchema
>;
