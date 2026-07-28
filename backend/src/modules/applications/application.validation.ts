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
  employerNotesVisibleToSeeker: z.boolean().optional().default(false),
});

const interviewModeSchema = z.union([
  z.enum(APPLICATION_INTERVIEW_MODES),
  z.literal(""),
]);

const httpsUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid meeting link URL")
  .refine(
    (value) => value.toLowerCase().startsWith("https://"),
    "Meeting link must be a valid HTTPS URL",
  );

const interviewSchema = z
  .object({
    date: z.string().trim().optional().default(""),
    time: z.string().trim().optional().default(""),
    mode: interviewModeSchema.optional().default(""),
    meetingLink: z.string().trim().optional().default(""),
    venue: z.string().trim().optional().default(""),
    instructions: z.string().trim().max(1000).optional().default(""),
    interviewerName: z.string().trim().optional().default(""),
    interviewerDesignation: z.string().trim().optional().default(""),
    interviewerEmail: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine(
        (value) => value === "" || z.string().email().safeParse(value).success,
        "Enter a valid interviewer email",
      ),
    interviewerPhone: z.string().trim().optional().default(""),
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

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const updateApplicationInterviewSchema = z
  .object({
    date: z
      .string()
      .trim()
      .min(1, "Interview date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Interview date must be a valid date"),
    time: z
      .string()
      .trim()
      .min(1, "Interview time is required")
      .regex(
        /^\d{2}:\d{2}(:\d{2})?$/,
        "Interview time must be a valid time",
      )
      .transform((value) => value.slice(0, 5)),
    mode: z.enum(APPLICATION_INTERVIEW_MODES, {
      message: "Select an interview mode",
    }),
    meetingLink: z.string().trim().optional().default(""),
    venue: z.string().trim().optional().default(""),
    instructions: z
      .string()
      .trim()
      .max(1000, "Instructions must be 1000 characters or fewer")
      .optional()
      .default(""),
    interviewerName: z
      .string()
      .trim()
      .min(1, "Interviewer name is required")
      .max(200, "Interviewer name is too long"),
    interviewerDesignation: z.string().trim().max(200).optional().default(""),
    interviewerEmail: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine(
        (value) => value === "" || z.string().email().safeParse(value).success,
        "Enter a valid interviewer email",
      ),
    interviewerPhone: z.string().trim().max(30).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.date < todayDateString()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Interview date cannot be in the past",
      });
    }

    if (value.mode === "online") {
      const linkResult = httpsUrlSchema.safeParse(value.meetingLink);
      if (!linkResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meetingLink"],
          message:
            linkResult.error.issues[0]?.message ??
            "Meeting link is required for online interviews",
        });
      }
    }

    if (value.mode === "offline" && !value.venue.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["venue"],
        message: "Venue is required for offline interviews",
      });
    }

    if (value.mode === "phone" && !value.interviewerPhone.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interviewerPhone"],
        message: "Recruiter phone is required for phone interviews",
      });
    }
  });

export const applicationIdParamsSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid application id"),
});

export const listEmployerInterviewsQuerySchema = z.object({
  publicJobId: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .optional(),
  status: z
    .enum(["interview_scheduled", "interview_completed"] as const)
    .optional(),
  mode: z.enum(APPLICATION_INTERVIEW_MODES).optional(),
  search: z
    .string()
    .optional()
    .default("")
    .transform((value) => normalizeEmployerCandidateSearchQuery(value)),
  interviewer: z.string().trim().optional().default(""),
  interviewFrom: z.string().trim().optional().default(""),
  interviewTo: z.string().trim().optional().default(""),
  quickDate: z
    .enum(["today", "tomorrow", "this_week", "this_month", ""] as const)
    .optional()
    .default(""),
  rescheduledOnly: z
    .union([z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .default("")
    .transform((value) => value === "true"),
  cancelledOnly: z
    .union([z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .default("")
    .transform((value) => value === "true"),
  sort: z
    .enum(["interview_asc", "interview_desc", "newest", "oldest"])
    .optional()
    .default("interview_asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  /** Calendar view needs a larger page size for month/week ranges. */
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
});

export const cancelApplicationInterviewSchema = z
  .object({
    reason: z.enum([
      "Interviewer unavailable",
      "Candidate unavailable",
      "Position closed",
      "Position filled",
      "Scheduling conflict",
      "Other",
    ]),
    otherReason: z.string().trim().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.reason === "Other" && !value.otherReason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherReason"],
        message: "Please provide a cancellation reason.",
      });
    }
  });

export const listEmployerInterviewStatsQuerySchema = z.object({
  publicJobId: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .optional(),
  period: z
    .enum(["today", "this_week", "this_month", "last_month", "all_time"])
    .optional()
    .default("all_time"),
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
export type UpdateApplicationInterviewSchema = z.infer<
  typeof updateApplicationInterviewSchema
>;
export type CancelApplicationInterviewSchema = z.infer<
  typeof cancelApplicationInterviewSchema
>;
export type ListEmployerInterviewsQuerySchema = z.infer<
  typeof listEmployerInterviewsQuerySchema
>;
export type ListEmployerInterviewStatsQuerySchema = z.infer<
  typeof listEmployerInterviewStatsQuerySchema
>;
export type ApplicationIdParamsSchema = z.infer<
  typeof applicationIdParamsSchema
>;
