import { z } from "zod";
import {
  JOB_LISTING_PAYMENT_STATUSES,
  JOB_STATUSES,
  JOB_STATUS_ACTIONS,
} from "../../../constants/job.constants.js";
import { APPLICATION_STATUSES } from "../../applications/application.constants.js";
import {
  publishDraftJobSchema,
  saveDraftJobSchema,
} from "../../jobs/job.validation.js";

export const OPERATIONS_JOB_TABS = [
  "all",
  "live",
  "paused",
  "draft",
  "expired",
  "closed",
] as const;

export const listOperationsJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  tab: z.enum(OPERATIONS_JOB_TABS).default("all"),
  search: z.string().trim().max(200).optional().default(""),
  status: z
    .union([z.enum(JOB_STATUSES), z.literal("")])
    .optional()
    .default(""),
  paymentStatus: z
    .union([z.enum(JOB_LISTING_PAYMENT_STATUSES), z.literal("")])
    .optional()
    .default(""),
  category: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  sort: z
    .enum(["latest", "oldest", "applications_desc"])
    .optional()
    .default("latest"),
});

export type ListOperationsJobsQuery = z.infer<
  typeof listOperationsJobsQuerySchema
>;

export const operationsJobPublicIdParamsSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Invalid job ID format."),
});

export type OperationsJobPublicIdParams = z.infer<
  typeof operationsJobPublicIdParamsSchema
>;

export const listOperationsJobApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .union([z.enum(APPLICATION_STATUSES), z.literal("")])
    .optional()
    .default(""),
  search: z.string().trim().max(200).optional().default(""),
});

export type ListOperationsJobApplicationsQuery = z.infer<
  typeof listOperationsJobApplicationsQuerySchema
>;

export const updateOperationsJobStatusBodySchema = z
  .object({
    action: z.enum(JOB_STATUS_ACTIONS),
    reason: z.string().trim().max(2000).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.action === "close" && !value.reason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason for closing this job is required.",
        path: ["reason"],
      });
    }
  });

export type UpdateOperationsJobStatusBody = z.infer<
  typeof updateOperationsJobStatusBodySchema
>;

export const saveOperationsJobDraftBodySchema = saveDraftJobSchema.extend({
  employerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id.")
    .optional()
    .nullable(),
});

export type SaveOperationsJobDraftBody = z.infer<
  typeof saveOperationsJobDraftBodySchema
>;

export const assignOperationsJobEmployerBodySchema = z.object({
  employerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id."),
});

export type AssignOperationsJobEmployerBody = z.infer<
  typeof assignOperationsJobEmployerBodySchema
>;

export const publishOperationsJobBodySchema = publishDraftJobSchema;

export type PublishOperationsJobBody = z.infer<
  typeof publishOperationsJobBodySchema
>;
