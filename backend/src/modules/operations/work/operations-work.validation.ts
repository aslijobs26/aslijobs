import { z } from "zod";
import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_TYPES,
  WORK_RELATED_ENTITY_TYPES,
} from "./operations-work.constants.js";

const objectIdString = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id.");

export const listOperationsWorkQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tab: z
    .enum(["my_queue", "waiting", "completed", "all"])
    .default("my_queue"),
  type: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) => value === "" || (WORK_ITEM_TYPES as readonly string[]).includes(value),
      "Invalid work type.",
    ),
  priority: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) =>
        value === "" ||
        (WORK_ITEM_PRIORITIES as readonly string[]).includes(value),
      "Invalid priority.",
    ),
  due: z
    .enum(["all", "overdue", "due_today", "due_soon", "upcoming", "do_now"])
    .optional()
    .default("all"),
  search: z.string().trim().max(120).optional().default(""),
  sort: z
    .enum(["dueAt", "priority", "createdAt", "updatedAt"])
    .optional()
    .default("dueAt"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type ListOperationsWorkQuery = z.infer<
  typeof listOperationsWorkQuerySchema
>;

export const operationsWorkIdParamsSchema = z.object({
  id: objectIdString,
});

export type OperationsWorkIdParams = z.infer<
  typeof operationsWorkIdParamsSchema
>;

export const createOperationsWorkBodySchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(4000).optional().default(""),
    type: z.enum(WORK_ITEM_TYPES),
    priority: z.enum(WORK_ITEM_PRIORITIES),
    relatedEntityType: z.enum(WORK_RELATED_ENTITY_TYPES).optional().nullable(),
    relatedEntityId: z.string().trim().max(64).optional().nullable(),
    relatedLabel: z.string().trim().max(200).optional().default(""),
    relatedLocationLabel: z.string().trim().max(200).optional().default(""),
    departmentId: objectIdString.optional().nullable(),
    assignedToUserId: objectIdString.optional().nullable(),
    /**
     * none = queue under creator department (if any), no explicit assign.
     * team_queue = route to department Team Queue (requires assign).
     * user = assign to subordinate (requires assign).
     */
    assignTo: z
      .enum(["none", "team_queue", "user"])
      .optional()
      .default("none"),
    dueAt: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.assignTo === "user" && !value.assignedToUserId) {
      ctx.addIssue({
        code: "custom",
        path: ["assignedToUserId"],
        message: "Assignee is required when assigning to a team member.",
      });
    }
    if (value.assignTo === "team_queue" && value.assignedToUserId) {
      ctx.addIssue({
        code: "custom",
        path: ["assignedToUserId"],
        message: "Do not set an assignee when routing to Team Queue.",
      });
    }
  });

export type CreateOperationsWorkBody = z.infer<
  typeof createOperationsWorkBodySchema
>;

export const assignOperationsWorkBodySchema = z.object({
  assignedToUserId: objectIdString,
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(WORK_ITEM_PRIORITIES).optional(),
  expectedRevision: z.coerce.number().int().min(1),
});

export type AssignOperationsWorkBody = z.infer<
  typeof assignOperationsWorkBodySchema
>;

export const bulkAssignOperationsWorkBodySchema = z
  .object({
    workItemIds: z
      .array(objectIdString)
      .min(1, "Select at least one work item.")
      .max(50, "Bulk assign is limited to 50 work items."),
    targetType: z.enum(["department", "user"]),
    targetId: objectIdString,
    expectedRevisions: z
      .record(z.string(), z.coerce.number().int().min(1))
      .refine(
        (value) => Object.keys(value).length > 0,
        "expectedRevisions is required.",
      ),
  })
  .superRefine((value, ctx) => {
    const unique = new Set(value.workItemIds);
    if (unique.size !== value.workItemIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["workItemIds"],
        message: "Duplicate work item ids are not allowed.",
      });
    }
    for (const id of value.workItemIds) {
      if (value.expectedRevisions[id] == null) {
        ctx.addIssue({
          code: "custom",
          path: ["expectedRevisions", id],
          message: `Missing expectedRevision for work item ${id}.`,
        });
      }
    }
  });

export type BulkAssignOperationsWorkBody = z.infer<
  typeof bulkAssignOperationsWorkBodySchema
>;

export const claimOperationsWorkBodySchema = z.object({
  expectedRevision: z.coerce.number().int().min(1),
});

export type ClaimOperationsWorkBody = z.infer<
  typeof claimOperationsWorkBodySchema
>;

export const updateWorkStatusBodySchema = z.object({
  status: z.enum([
    "in_progress",
    "waiting",
    "completed",
    "queued",
    "assigned",
    "cancelled",
  ]),
  waitingReason: z.string().trim().max(500).optional().nullable(),
  expectedRevision: z.coerce.number().int().min(1),
  note: z.string().trim().max(500).optional().default(""),
});

export type UpdateWorkStatusBody = z.infer<typeof updateWorkStatusBodySchema>;

export const updateWorkPriorityBodySchema = z.object({
  priority: z.enum(WORK_ITEM_PRIORITIES),
  expectedRevision: z.coerce.number().int().min(1),
});

export type UpdateWorkPriorityBody = z.infer<
  typeof updateWorkPriorityBodySchema
>;

export const updateWorkDueBodySchema = z.object({
  dueAt: z.string().datetime().nullable(),
  expectedRevision: z.coerce.number().int().min(1),
});

export type UpdateWorkDueBody = z.infer<typeof updateWorkDueBodySchema>;

export const exportOperationsWorkQuerySchema = listOperationsWorkQuerySchema
  .omit({ page: true, limit: true })
  .extend({
    format: z.enum(["xlsx", "csv"]).optional().default("xlsx"),
  });

export type ExportOperationsWorkQuery = z.infer<
  typeof exportOperationsWorkQuerySchema
>;

export const performanceOperationsWorkQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type PerformanceOperationsWorkQuery = z.infer<
  typeof performanceOperationsWorkQuerySchema
>;
