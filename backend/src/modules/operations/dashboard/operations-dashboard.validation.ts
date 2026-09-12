import { z } from "zod";

export const DASHBOARD_DATE_PRESETS = [
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
] as const;

export type DashboardDatePreset = (typeof DASHBOARD_DATE_PRESETS)[number];

const departmentIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid department id")
  .optional()
  .or(z.literal("").transform(() => undefined));

const dashboardDateFields = {
  datePreset: z.enum(DASHBOARD_DATE_PRESETS).optional().default("last_30_days"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  state: z.string().trim().max(80).optional().default(""),
  departmentId: departmentIdSchema,
} as const;

function refineCustomDateRange(
  value: { datePreset: DashboardDatePreset; dateFrom?: string; dateTo?: string },
  ctx: z.RefinementCtx,
): void {
  if (value.datePreset !== "custom") return;
  if (!value.dateFrom || !value.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateFrom and dateTo are required for custom range.",
      path: ["dateFrom"],
    });
  }
}

/**
 * Zod v4 cannot `.omit()` schemas that already have refinements.
 * Keep the base object separate, then refine overview/export independently.
 */
export const operationsDashboardOverviewQuerySchema = z
  .object({
    ...dashboardDateFields,
    taskTab: z
      .enum(["all", "pending", "in_progress", "overdue", "completed"])
      .optional()
      .default("all"),
    taskSearch: z.string().trim().max(120).optional().default(""),
    taskLimit: z.coerce.number().int().min(1).max(50).optional().default(10),
  })
  .superRefine(refineCustomDateRange);

export type OperationsDashboardOverviewQuery = z.infer<
  typeof operationsDashboardOverviewQuerySchema
>;

export const operationsDashboardExportQuerySchema = z
  .object({
    ...dashboardDateFields,
  })
  .superRefine(refineCustomDateRange);

export type OperationsDashboardExportQuery = z.infer<
  typeof operationsDashboardExportQuerySchema
>;
