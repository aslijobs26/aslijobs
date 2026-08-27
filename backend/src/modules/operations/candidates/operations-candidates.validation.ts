import { z } from "zod";
import { APPLICATION_STATUSES } from "../../applications/application.constants.js";

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
    gender: z.string().trim().max(40).optional().default(""),
    preferredRole: z.string().trim().max(120).optional().default(""),
    profileStatus: z
      .union([z.enum(OPERATIONS_CANDIDATE_PROFILE_STATUSES), z.literal("")])
      .optional()
      .default(""),
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
