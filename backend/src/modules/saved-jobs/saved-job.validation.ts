import { z } from "zod";
import {
  JOB_EXPERIENCE_LEVELS,
  JOB_PERKS,
  JOB_TYPES,
  PART_TIME_SCHEDULES,
  WORK_MODES,
} from "../../constants/job.constants.js";
import {
  SAVED_JOBS_SORT_OPTIONS,
  SAVED_JOBS_STATS_FILTERS,
} from "./saved-job.constants.js";

export const saveJobBodySchema = z.object({
  publicJobId: z.string().trim().min(1).max(64),
});

export const savedJobPublicIdParamsSchema = z.object({
  publicJobId: z.string().trim().min(1).max(64),
});

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => {
      if (!value) {
        return "";
      }
      return (values as readonly string[]).includes(value) ? value : "";
    });

export const listSavedJobsQuerySchema = z.object({
  tab: z.enum(SAVED_JOBS_STATS_FILTERS).optional().default("all"),
  search: z.string().trim().max(200).optional().default(""),
  sort: z.enum(SAVED_JOBS_SORT_OPTIONS).optional().default("recently_saved"),
  location: z.string().trim().max(120).optional().default(""),
  jobType: optionalEnum(JOB_TYPES),
  workMode: optionalEnum(WORK_MODES),
  schedule: optionalEnum(PART_TIME_SCHEDULES),
  experience: optionalEnum(JOB_EXPERIENCE_LEVELS),
  company: z.string().trim().max(120).optional().default(""),
  perk: optionalEnum(JOB_PERKS),
  minSalary: z.coerce.number().int().min(0).optional(),
  maxSalary: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type SaveJobBodySchema = z.infer<typeof saveJobBodySchema>;
export type SavedJobPublicIdParamsSchema = z.infer<
  typeof savedJobPublicIdParamsSchema
>;
export type ListSavedJobsQuerySchema = z.infer<typeof listSavedJobsQuerySchema>;
