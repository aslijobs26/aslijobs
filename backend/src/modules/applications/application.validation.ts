import { z } from "zod";
import {
  APPLICATION_INTERVIEW_MODES,
  APPLICATION_STATUSES,
} from "./application.constants.js";
import { parseEmployerAvailabilityFilter } from "./employer-availability-filter.js";
import { normalizeEmployerCandidateSearchQuery } from "./employer-candidate-search.js";

export const applyToJobSchema = z.object({
  publicJobId: z
    .string()
    .trim()
    .min(1, "Job id is required")
    .transform((value) => value.toUpperCase()),
});

export const listEmployerApplicationsQuerySchema = z.object({
  publicJobId: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  search: z
    .string()
    .optional()
    .default("")
    .transform((value) => normalizeEmployerCandidateSearchQuery(value)),
  sort: z
    .enum(["newest", "oldest", "updated"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  location: z.string().trim().optional().default(""),
  experience: z.string().trim().optional().default(""),
  skills: z.string().trim().optional().default(""),
  availability: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => parseEmployerAvailabilityFilter(value) ?? ""),
  appliedFrom: z.string().trim().optional().default(""),
  appliedTo: z.string().trim().optional().default(""),
});

export const employerLocationSuggestionsQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .default("")
    .transform((value) => value.trim().replace(/\s+/g, " ")),
  publicJobId: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(20),
});

export const listEmployerApplicationStatsQuerySchema = z.object({
  publicJobId: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .optional(),
});

export const listSeekerApplicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  search: z.string().trim().optional().default(""),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES, {
    message: "Select a valid application status",
  }),
});

export const updateApplicationNotesSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or fewer")
    .optional()
    .default(""),
});

const interviewModeSchema = z.union([
  z.enum(APPLICATION_INTERVIEW_MODES),
  z.literal(""),
]);

const interviewSchema = z
  .object({
    date: z.string().trim().optional().default(""),
    time: z.string().trim().optional().default(""),
    mode: interviewModeSchema.optional().default(""),
    meetingLink: z.string().trim().optional().default(""),
    venue: z.string().trim().optional().default(""),
    instructions: z.string().trim().optional().default(""),
    interviewerName: z.string().trim().optional().default(""),
  })
  .optional();

const offerSchema = z
  .object({
    offerDate: z.string().trim().optional().default(""),
    joiningDate: z.string().trim().optional().default(""),
    packageText: z.string().trim().optional().default(""),
    notes: z.string().trim().optional().default(""),
  })
  .optional();

export const updateApplicationHiringSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  interview: interviewSchema,
  offer: offerSchema,
  rejectReason: z.string().trim().max(2000).optional(),
  employerNotesVisibleToSeeker: z.boolean().optional(),
});

export const applicationIdParamsSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid application id"),
});

export type ApplyToJobSchema = z.infer<typeof applyToJobSchema>;
export type ListEmployerApplicationsQuerySchema = z.infer<
  typeof listEmployerApplicationsQuerySchema
>;
export type EmployerLocationSuggestionsQuerySchema = z.infer<
  typeof employerLocationSuggestionsQuerySchema
>;
export type ListEmployerApplicationStatsQuerySchema = z.infer<
  typeof listEmployerApplicationStatsQuerySchema
>;
export type ListSeekerApplicationsQuerySchema = z.infer<
  typeof listSeekerApplicationsQuerySchema
>;
export type UpdateApplicationStatusSchema = z.infer<
  typeof updateApplicationStatusSchema
>;
export type UpdateApplicationNotesSchema = z.infer<
  typeof updateApplicationNotesSchema
>;
export type UpdateApplicationHiringSchema = z.infer<
  typeof updateApplicationHiringSchema
>;
export type ApplicationIdParamsSchema = z.infer<
  typeof applicationIdParamsSchema
>;
