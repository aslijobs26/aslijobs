import { z } from "zod";
import {
  SAVED_CANDIDATE_PRIORITIES,
  SAVED_CANDIDATE_SORTS,
  SAVED_CANDIDATES_DEFAULT_PAGE_SIZE,
  SAVED_CANDIDATES_MAX_NOTES_LENGTH,
  SAVED_CANDIDATES_MAX_PAGE_SIZE,
  SAVED_CANDIDATES_MAX_TAG_LENGTH,
  SAVED_CANDIDATES_MAX_TAGS,
} from "./saved-candidate.constants.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

const tagSchema = z
  .string()
  .trim()
  .min(2)
  .max(SAVED_CANDIDATES_MAX_TAG_LENGTH)
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/,
    "Tags may only include letters, numbers, spaces, hyphens, and underscores",
  );

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = tag.trim().replace(/\s+/g, " ");
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

const tagsFieldSchema = z
  .array(tagSchema)
  .max(SAVED_CANDIDATES_MAX_TAGS)
  .transform(normalizeTags)
  .optional();

export const saveCandidateBodySchema = z.object({
  applicationId: objectIdSchema,
  priority: z.enum(SAVED_CANDIDATE_PRIORITIES),
  tags: tagsFieldSchema.default([]),
  notes: z
    .string()
    .trim()
    .max(SAVED_CANDIDATES_MAX_NOTES_LENGTH)
    .optional()
    .default(""),
});

export const savedCandidateIdParamsSchema = z.object({
  savedCandidateId: objectIdSchema,
});

export const savedCandidateApplicationIdParamsSchema = z.object({
  applicationId: objectIdSchema,
});

export const updateSavedCandidateBodySchema = z
  .object({
    priority: z.enum(SAVED_CANDIDATE_PRIORITIES).optional(),
    tags: tagsFieldSchema,
    notes: z
      .string()
      .trim()
      .max(SAVED_CANDIDATES_MAX_NOTES_LENGTH)
      .optional(),
  })
  .refine(
    (value) =>
      value.priority !== undefined ||
      value.tags !== undefined ||
      value.notes !== undefined,
    { message: "At least one field is required" },
  );

export const listSavedCandidatesQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  publicJobId: z
    .string()
    .trim()
    .transform((value) => (value ? value.toUpperCase() : ""))
    .optional()
    .default(""),
  jobTitle: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  experience: z.string().trim().optional().default(""),
  availability: z.string().trim().optional().default(""),
  /** When set, only saved rows whose linked application has this status. */
  applicationStatus: z.string().trim().optional().default(""),
  priority: z.enum(SAVED_CANDIDATE_PRIORITIES).optional(),
  tag: z
    .string()
    .trim()
    .max(SAVED_CANDIDATES_MAX_TAG_LENGTH)
    .optional()
    .default(""),
  sort: z.enum(SAVED_CANDIDATE_SORTS).optional().default("recently_saved"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SAVED_CANDIDATES_MAX_PAGE_SIZE)
    .optional()
    .default(SAVED_CANDIDATES_DEFAULT_PAGE_SIZE),
});

export type SaveCandidateBodySchema = z.infer<typeof saveCandidateBodySchema>;
export type SavedCandidateIdParamsSchema = z.infer<
  typeof savedCandidateIdParamsSchema
>;
export type SavedCandidateApplicationIdParamsSchema = z.infer<
  typeof savedCandidateApplicationIdParamsSchema
>;
export type UpdateSavedCandidateBodySchema = z.infer<
  typeof updateSavedCandidateBodySchema
>;
export type ListSavedCandidatesQuerySchema = z.infer<
  typeof listSavedCandidatesQuerySchema
>;
