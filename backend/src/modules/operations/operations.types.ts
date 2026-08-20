import {
  OPERATIONS_ENTITY_TYPES,
  OPERATIONS_ESCALATION_CATEGORIES,
  OPERATIONS_SLA_CATEGORIES,
  OPERATIONS_TASK_PRIORITIES,
} from "./operations.constants.js";

export type OperationsTaskPriority =
  (typeof OPERATIONS_TASK_PRIORITIES)[number];

export type OperationsEntityType = (typeof OPERATIONS_ENTITY_TYPES)[number];

export type OperationsEscalationCategory =
  (typeof OPERATIONS_ESCALATION_CATEGORIES)[number];

export type OperationsSlaCategory =
  (typeof OPERATIONS_SLA_CATEGORIES)[number];

/** Future dashboard KPI payload contract. */
export interface OperationsDashboardKpiDto {
  id: string;
  label: string;
  value: number;
  trendLabel: string;
  trendDirection: "up" | "down" | "neutral";
}

/** Future priority queue row contract. */
export interface OperationsPriorityQueueItemDto {
  id: string;
  type: OperationsEntityType;
  customer: string;
  task: string;
  priority: OperationsTaskPriority;
  language: string;
  assignedTo: { name: string; initials: string } | null;
  slaRemainingMinutes: number;
}

/** Aggregated dashboard response shape for future GET /operations/dashboard. */
export interface OperationsDashboardResponseDto {
  kpis: OperationsDashboardKpiDto[];
  priorityQueue: OperationsPriorityQueueItemDto[];
  slaOverall: number;
  slaTarget: number;
  generatedAt: string;
}
