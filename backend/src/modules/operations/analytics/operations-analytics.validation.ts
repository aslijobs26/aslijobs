import { z } from "zod";
import { APPLICATION_STATUSES } from "../../applications/application.constants.js";
import { JOB_TYPES } from "../../../constants/job.constants.js";
import {
  ANALYTICS_DATE_PRESETS,
  ANALYTICS_EXPORT_FORMATS,
  ANALYTICS_REPORTS,
} from "./operations-analytics.types.js";
import { parseCalendarDate, kolkataDateKey } from "./operations-analytics-domain.js";

function refineCustomDateRange(
  value: {
    preset: (typeof ANALYTICS_DATE_PRESETS)[number];
    dateFrom?: string;
    dateTo?: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.preset !== "custom") return;
  const from = parseCalendarDate(value.dateFrom ?? "");
  const to = parseCalendarDate(value.dateTo ?? "");
  if (!from || !to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateFrom and dateTo must be YYYY-MM-DD for a custom range.",
      path: ["dateFrom"],
    });
    return;
  }
  const fromKey = `${from.y}-${String(from.m + 1).padStart(2, "0")}-${String(from.d).padStart(2, "0")}`;
  const toKey = `${to.y}-${String(to.m + 1).padStart(2, "0")}-${String(to.d).padStart(2, "0")}`;
  if (toKey < fromKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date cannot be earlier than the start date.",
      path: ["dateTo"],
    });
  }
  const today = kolkataDateKey(new Date());
  if (fromKey > today || toKey > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Future dates are not accepted for historical reporting.",
      path: ["dateTo"],
    });
  }
  const spanDays = (Date.UTC(to.y, to.m, to.d) - Date.UTC(from.y, from.m, from.d)) / 86_400_000;
  if (spanDays > 366) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Custom ranges are limited to 366 days.",
      path: ["dateTo"],
    });
  }
}

const analyticsFilterFields = {
  preset: z.enum(ANALYTICS_DATE_PRESETS).optional().default("last_6_months"),
  dateFrom: z.string().optional().default(""),
  dateTo: z.string().optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  employer: z.string().trim().max(120).optional().default(""),
  jobType: z
    .enum(["", ...JOB_TYPES])
    .optional()
    .default(""),
  applicationStatus: z
    .enum(["", ...APPLICATION_STATUSES])
    .optional()
    .default(""),
  horizonDays: z
    .enum(["7", "14", "30", "60", "90"])
    .optional()
    .default("30")
    .transform((value) => Number(value)),
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
    format: z.enum(ANALYTICS_EXPORT_FORMATS).optional().default("csv"),
    report: z.enum(ANALYTICS_REPORTS).optional().default("summary"),
  })
  .superRefine(refineCustomDateRange);

export type OperationsAnalyticsExportQuery = z.infer<
  typeof operationsAnalyticsExportQuerySchema
>;

export const operationsAnalyticsDrilldownQuerySchema = z
  .object({
    ...analyticsFilterFields,
    metric: z.enum([
      "applications",
      "interviews-completed",
      "selected",
      "joined",
      "employers",
      "visitors",
    ]),
    page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(25),
    q: z.string().trim().max(80).optional().default(""),
    sort: z.enum(["date", "name"]).optional().default("date"),
    dir: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .superRefine(refineCustomDateRange);

export type OperationsAnalyticsDrilldownQuery = z.infer<
  typeof operationsAnalyticsDrilldownQuerySchema
>;
