import { z } from "zod";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { buildListPagination } from "../../../utils/pagination.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";

export const listOperationsAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(80).optional().default(""),
  targetType: z.string().trim().max(40).optional().default(""),
  targetId: z.string().trim().max(80).optional().default(""),
  search: z.string().trim().max(80).optional().default(""),
});

export type ListOperationsAuditQuery = z.infer<
  typeof listOperationsAuditQuerySchema
>;

export async function listOperationsAuditEvents(
  actor: OperationsResolvedAccess,
  query: ListOperationsAuditQuery,
) {
  if (!actor.isSuperAdmin && !actor.permissions.activity_logs.read) {
    throw new AppError(
      "Access denied. You do not have permission to view the activity log.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const filter: Record<string, unknown> = {};
  if (query.action) {
    filter.action = query.action;
  }
  if (query.targetType) {
    filter.targetType = query.targetType;
  }
  if (query.targetId) {
    filter.targetId = query.targetId;
  }
  if (query.search.trim()) {
    const pattern = query.search.trim();
    filter.$or = [
      { actorName: { $regex: pattern, $options: "i" } },
      { targetLabel: { $regex: pattern, $options: "i" } },
      { action: { $regex: pattern, $options: "i" } },
    ];
  }

  const total = await OperationsAuditLogModel.countDocuments(filter);
  const pagination = buildListPagination(query.page, query.limit, total);
  const events = await OperationsAuditLogModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .lean();

  return {
    events: events.map((event) => ({
      id: String(event._id),
      actorUserId: event.actorUserId ? String(event.actorUserId) : null,
      actorName: event.actorName,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      targetLabel: event.targetLabel,
      previousState: event.previousState ?? null,
      nextState: event.nextState ?? null,
      reason: event.reason ?? "",
      createdAt:
        event.createdAt instanceof Date ? event.createdAt.toISOString() : null,
    })),
    pagination,
  };
}
