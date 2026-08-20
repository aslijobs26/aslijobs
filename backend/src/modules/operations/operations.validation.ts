import { z } from "zod";
import {
  OPERATIONS_ENTITY_TYPES,
  OPERATIONS_TASK_PRIORITIES,
} from "./operations.constants.js";

/** Placeholder query schema for future dashboard listing endpoints. */
export const operationsDashboardQuerySchema = z.object({
  date: z.string().datetime().optional(),
  departmentId: z.string().trim().min(1).optional(),
});

export const operationsPriorityQueueQuerySchema = z.object({
  priority: z.enum(OPERATIONS_TASK_PRIORITIES).optional(),
  type: z.enum(OPERATIONS_ENTITY_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type OperationsDashboardQuery = z.infer<
  typeof operationsDashboardQuerySchema
>;

export type OperationsPriorityQueueQuery = z.infer<
  typeof operationsPriorityQueueQuerySchema
>;
