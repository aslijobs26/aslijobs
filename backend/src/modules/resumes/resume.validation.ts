import { z } from "zod";
import {
  RESUME_GENERATION_SOURCES,
  RESUME_STATUSES,
  RESUME_TEMPLATE_IDS,
} from "./resume.constants.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

/**
 * Zod schemas reserved for future HTTP request validation.
 * Phase 1 does not mount resume routes — these are unused at runtime.
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

export const resumeStatusSchema = z.enum(RESUME_STATUSES);
export const resumeGenerationSourceSchema = z.enum(RESUME_GENERATION_SOURCES);

export type EnsureResumeRecordSchema = z.infer<typeof ensureResumeRecordSchema>;
export type MarkResumeOutdatedSchema = z.infer<typeof markResumeOutdatedSchema>;
export type SelectResumeTemplateSchema = z.infer<
  typeof selectResumeTemplateSchema
>;
