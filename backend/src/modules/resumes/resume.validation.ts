import { z } from "zod";
import {
  APPLICATION_RESUME_SOURCES,
  RESUME_GENERATION_SOURCES,
  RESUME_STATUSES,
  RESUME_TEMPLATE_IDS,
} from "./resume.constants.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

/**
 * Zod schemas for resume HTTP request validation and internal helpers.
 */
export const ensureResumeRecordSchema = z.object({
  jobSeekerId: objectIdSchema,
});

export const markResumeOutdatedSchema = z.object({
  jobSeekerId: objectIdSchema,
  reason: z.string().trim().optional(),
});

export const selectResumeTemplateSchema = z.object({
  jobSeekerId: objectIdSchema,
  templateId: z.enum(RESUME_TEMPLATE_IDS),
});

export const setDefaultResumeSourceSchema = z.object({
  source: z.enum(APPLICATION_RESUME_SOURCES, {
    message: "Select a valid resume source",
  }),
});

export const resumeStatusSchema = z.enum(RESUME_STATUSES);
export const resumeGenerationSourceSchema = z.enum(RESUME_GENERATION_SOURCES);

export type EnsureResumeRecordSchema = z.infer<typeof ensureResumeRecordSchema>;
export type MarkResumeOutdatedSchema = z.infer<typeof markResumeOutdatedSchema>;
export type SelectResumeTemplateSchema = z.infer<
  typeof selectResumeTemplateSchema
>;
export type SetDefaultResumeSourceSchema = z.infer<
  typeof setDefaultResumeSourceSchema
>;
