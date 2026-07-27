import { z } from "zod";
import { APPLICATION_STATUSES } from "./application.constants.js";
import { parseEmployerAvailabilityFilter } from "./employer-availability-filter.js";
import { normalizeEmployerCandidateSearchQuery } from "./employer-candidate-search.js";
import {
  EMPLOYER_EXPORT_QUICK_DATE_FILTERS,
} from "./employer-export-quick-date.js";
import {
  EMPLOYER_EXPORT_FIELDS,
  EMPLOYER_EXPORT_FORMATS,
} from "./employer-export.constants.js";

export const employerExportBodySchema = z
  .object({
    format: z.enum(EMPLOYER_EXPORT_FORMATS),
    fields: z
      .array(z.enum(EMPLOYER_EXPORT_FIELDS))
      .min(1, "Select at least one export field"),
    publicJobId: z
      .string()
      .trim()
      .transform((value) => (value ? value.toUpperCase() : ""))
      .optional()
      .default(""),
    status: z.enum(APPLICATION_STATUSES).optional(),
    search: z
      .string()
      .optional()
      .default("")
      .transform((value) => normalizeEmployerCandidateSearchQuery(value)),
    location: z.string().trim().optional().default(""),
    experience: z.string().trim().optional().default(""),
    skills: z.string().trim().optional().default(""),
    availability: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => parseEmployerAvailabilityFilter(value) ?? ""),
    quickDateFilter: z
      .enum(EMPLOYER_EXPORT_QUICK_DATE_FILTERS)
      .optional()
      .default("all_time"),
    appliedFrom: z.string().trim().optional().default(""),
    appliedTo: z.string().trim().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.quickDateFilter === "custom" && value.appliedFrom && value.appliedTo) {
      const from = new Date(value.appliedFrom);
      const to = new Date(value.appliedTo);
      if (
        !Number.isNaN(from.getTime()) &&
        !Number.isNaN(to.getTime()) &&
        from.getTime() > to.getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["appliedTo"],
          message: "Applied To must be on or after Applied From",
        });
      }
    }
  });

export type EmployerExportBodySchema = z.infer<typeof employerExportBodySchema>;
