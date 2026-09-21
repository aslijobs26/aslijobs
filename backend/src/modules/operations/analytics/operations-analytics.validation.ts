import { z } from "zod";
import { ANALYTICS_DATE_PRESETS } from "./operations-analytics.types.js";

function refineCustomDateRange(
  value: {
    preset: (typeof ANALYTICS_DATE_PRESETS)[number];
    dateFrom?: string;
    dateTo?: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.preset !== "custom") return;
  if (!value.dateFrom || !value.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateFrom and dateTo are required for custom range.",
      path: ["dateFrom"],
    });
  }
}

const analyticsFilterFields = {
  preset: z.enum(ANALYTICS_DATE_PRESETS).optional().default("last_6_months"),
  dateFrom: z.string().optional().default(""),
  dateTo: z.string().optional().default(""),
  state: z.string().trim().max(80).optional().default(""),
} as const;

export const operationsAnalyticsOverviewQuerySchema = z
  .object({
    ...analyticsFilterFields,
  })
  .superRefine(refineCustomDateRange);

export type OperationsAnalyticsOverviewQuery = z.infer<
  typeof operationsAnalyticsOverviewQuerySchema
>;

export const operationsAnalyticsExportQuerySchema = z
  .object({
    ...analyticsFilterFields,
    format: z.enum(["csv"]).optional().default("csv"),
  })
  .superRefine(refineCustomDateRange);

export type OperationsAnalyticsExportQuery = z.infer<
  typeof operationsAnalyticsExportQuerySchema
>;
