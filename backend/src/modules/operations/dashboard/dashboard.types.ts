import type { OPERATIONS_DASHBOARD_SECTIONS } from "./dashboard.constants.js";
import type { OperationsDashboardResponseDto } from "../operations.types.js";

export type OperationsDashboardSection =
  (typeof OPERATIONS_DASHBOARD_SECTIONS)[number];

/** Future partial dashboard section responses for lazy-loaded widgets. */
export type OperationsDashboardSectionResponse =
  | Pick<OperationsDashboardResponseDto, "kpis">
  | Pick<OperationsDashboardResponseDto, "priorityQueue">
  | Pick<OperationsDashboardResponseDto, "slaOverall" | "slaTarget">;
