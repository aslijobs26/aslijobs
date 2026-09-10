import { z } from "zod";
import { PLACEMENTS_ANALYTICS_PRESETS } from "./operations-placements.types.js";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const placementsAnalyticsQuerySchema = z
  .object({
    preset: z.enum(PLACEMENTS_ANALYTICS_PRESETS).default("last_30_days"),
    dateFrom: z.string().optional().default(""),
    dateTo: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.preset === "custom" && !value.dateFrom && !value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Custom range requires dateFrom and/or dateTo.",
        path: ["dateFrom"],
      });
    }
  });

export type PlacementsAnalyticsQueryInput = z.infer<
  typeof placementsAnalyticsQuerySchema
>;

export const listOperationsPlacementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(""),
  status: z
    .enum(["all", "joining_pending", "joined", "did_not_join"])
    .default("all"),
  category: z.string().optional().default(""),
  state: z.string().optional().default(""),
  city: z.string().optional().default(""),
  employerId: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || objectIdRegex.test(v), "Invalid employerId"),
  jobId: z
    .string()
    .optional()
    .default("")
    .refine(
      (v) => !v || objectIdRegex.test(v) || /^[A-Za-z0-9_-]{3,64}$/.test(v),
      "Invalid jobId",
    ),
  sort: z
    .enum(["placedAt", "offerDate", "joiningDate", "candidateName", "company"])
    .default("placedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  preset: z.enum(PLACEMENTS_ANALYTICS_PRESETS).optional().default("last_30_days"),
  dateFrom: z.string().optional().default(""),
  dateTo: z.string().optional().default(""),
});

export type ListOperationsPlacementsQuery = z.infer<
  typeof listOperationsPlacementsQuerySchema
>;

export const exportOperationsPlacementsQuerySchema =
  listOperationsPlacementsQuerySchema.extend({
    format: z.enum(["xlsx", "csv"]).default("xlsx"),
  });

export type ExportOperationsPlacementsQuery = z.infer<
  typeof exportOperationsPlacementsQuerySchema
>;

export const operationsPlacementIdParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid placement id"),
});

export type OperationsPlacementIdParams = z.infer<
  typeof operationsPlacementIdParamsSchema
>;

export const updatePlacementJoiningStatusBodySchema = z.object({
  joiningStatus: z.enum(["joined", "did_not_join"]),
  expectedStatus: z.enum(["selected"]).optional().default("selected"),
  remarks: z.string().max(1000).optional().default(""),
});

export type UpdatePlacementJoiningStatusBody = z.infer<
  typeof updatePlacementJoiningStatusBodySchema
>;
