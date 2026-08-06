import { z } from "zod";
import {
  SAVED_CANDIDATE_PRIORITIES,
  SAVED_CANDIDATE_SORTS,
  SAVED_CANDIDATES_MAX_TAG_LENGTH,
} from "./saved-candidate.constants.js";
import {
  SAVED_CANDIDATE_EXPORT_FIELDS,
  SAVED_CANDIDATE_EXPORT_FORMATS,
} from "./saved-candidate-export.constants.js";

export const savedCandidateExportBodySchema = z.object({
  format: z.enum(SAVED_CANDIDATE_EXPORT_FORMATS).default("xlsx"),
  fields: z
    .array(z.enum(SAVED_CANDIDATE_EXPORT_FIELDS))
    .min(1, "Select at least one export field")
    .default([...SAVED_CANDIDATE_EXPORT_FIELDS]),
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
  applicationStatus: z.string().trim().optional().default(""),
  priority: z.enum(SAVED_CANDIDATE_PRIORITIES).optional(),
  tag: z
    .string()
    .trim()
    .max(SAVED_CANDIDATES_MAX_TAG_LENGTH)
    .optional()
    .default(""),
  sort: z.enum(SAVED_CANDIDATE_SORTS).optional().default("recently_saved"),
});

export type SavedCandidateExportBodySchema = z.infer<
  typeof savedCandidateExportBodySchema
>;
