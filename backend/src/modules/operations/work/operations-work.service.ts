import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import {
  getRoleDescendantIds,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import {
  WORK_ASSIGN_KEY,
  WORK_COMPLETE_KEY,
  WORK_CREATE_KEY,
  WORK_DETAIL_HISTORY_KEY,
  WORK_DETAIL_VIEW_KEY,
  WORK_DUE_UPDATE_KEY,
  WORK_EXPORT_KEY,
  WORK_LIST_VIEW_KEY,
  WORK_PRIORITY_UPDATE_KEY,
  WORK_REASSIGN_KEY,
  WORK_UPDATE_KEY,
} from "../rbac/operations-permission-catalog.js";
import {
  assertCanAssignWorkToUser,
  assertCanClaimWork,
  assertCanRouteWorkToDepartment,
  buildWorkVisibilityFilter,
  listEligibleAssignees,
  assertHasAssignOrReassignPermission,
  listEligibleDepartments,
  resolveBulkTargetValidationMode,
  WORK_BULK_ASSIGN_MAX,
} from "./operations-work-assignment.js";
import {
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_TYPE_LABELS,
  WORK_TYPE_DEFAULT_SLA_MS,
  type WorkItemPriority,
  type WorkItemStatus,
  type WorkItemType,
} from "./operations-work.constants.js";
import {
  addMs,
  assertWorkStatusTransition,
  buildDoNowFilter,
  endOfLocalDay,
  formatWorkDisplayId,
  isTerminalWorkStatus,
  kolkataDateKey,
  startOfLocalDay,
} from "./operations-work-domain.js";
import { buildOperationsWorkExportFile } from "./operations-work-export.js";
import { OperationsWorkItemModel } from "./operations-work.model.js";
import { scheduleWorkAssignmentNotification } from "./operations-work-notify.js";
import { reconcileOpenOperationsWork } from "./operations-work-reconcile.js";
import type {
  AssignOperationsWorkBody,
  BulkAssignOperationsWorkBody,
  ClaimOperationsWorkBody,
  CreateOperationsWorkBody,
  ExportOperationsWorkQuery,
  ListOperationsWorkQuery,
  PerformanceOperationsWorkQuery,
  UpdateWorkDueBody,
  UpdateWorkPriorityBody,
  UpdateWorkStatusBody,
} from "./operations-work.validation.js";
import type {
  OperationsWorkAnalyticsResult,
  OperationsWorkBulkAssignResult,
  OperationsWorkDetail,
  OperationsWorkListItem,
  OperationsWorkListResult,
  OperationsWorkPerformanceResult,
  OperationsWorkPerformanceTrendPoint,
} from "./operations-work.types.js";

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function actorName(access: OperationsResolvedAccess): string {
  return access.roleName?.trim() || "Operations";
}

async function nameMapForIds(
  ids: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(ids.filter((id): id is string => Boolean(id))),
  ];
  if (unique.length === 0) {
    return new Map();
  }
  const users = await OperationsTeamUserModel.find({
    _id: { $in: unique },
  })
    .select("_id fullName")
    .lean();
  return new Map(users.map((u) => [String(u._id), u.fullName]));
}

function toListItem(
  doc: Record<string, unknown>,
  names: Map<string, string>,
): OperationsWorkListItem {
  const assignedToUserId = doc.assignedToUserId
    ? String(doc.assignedToUserId)
    : null;
  const type = doc.type as OperationsWorkListItem["type"];
  const status = doc.status as WorkItemStatus;
  return {
    id: String(doc._id),
    displayId: String(doc.displayId ?? ""),
    title: String(doc.title ?? ""),
    description: String(doc.description ?? ""),
    type,
    typeLabel: WORK_ITEM_TYPE_LABELS[type],
    priority: doc.priority as WorkItemPriority,
    status,
    statusLabel: WORK_ITEM_STATUS_LABELS[status],
    origin: doc.origin as OperationsWorkListItem["origin"],
    relatedEntityType: (doc.relatedEntityType as OperationsWorkListItem["relatedEntityType"]) ?? null,
    relatedEntityId: doc.relatedEntityId ? String(doc.relatedEntityId) : null,
    relatedLabel: String(doc.relatedLabel ?? ""),
    relatedLocationLabel: String(doc.relatedLocationLabel ?? ""),
    departmentId: doc.departmentId ? String(doc.departmentId) : null,
    assignedToUserId,
    assignedToName: assignedToUserId
      ? names.get(assignedToUserId) ?? null
      : null,
    dueAt: iso(doc.dueAt as Date | null),
    slaTargetAt: iso(doc.slaTargetAt as Date | null),
    waitingReason: doc.waitingReason ? String(doc.waitingReason) : null,
    completedAt: iso(doc.completedAt as Date | null),
    revision: Number(doc.revision ?? 1),
    createdAt: iso(doc.createdAt as Date) ?? new Date(0).toISOString(),
    updatedAt: iso(doc.updatedAt as Date) ?? new Date(0).toISOString(),
  };
}

async function expandManagerAssigneeScope(
  access: OperationsResolvedAccess,
  baseFilter: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (
    access.isSuperAdmin ||
    !access.roleId ||
    (!operationsAccessCanKey(access, WORK_ASSIGN_KEY) &&
      !operationsAccessCanKey(access, WORK_REASSIGN_KEY))
  ) {
    return baseFilter;
  }

  const descendants = await getRoleDescendantIds(access.roleId);
  if (descendants.length === 0) {
    return baseFilter;
  }

  const subordinateUsers = await OperationsTeamUserModel.find({
    status: "active",
    roleId: { $in: descendants },
    ...(access.departmentId ? { departmentId: access.departmentId } : {}),
  })
    .select("_id")
    .lean();

  const subordinateIds = subordinateUsers.map((u) => u._id);
  if (subordinateIds.length === 0) {
    return baseFilter;
  }

  const orClauses = Array.isArray(baseFilter.$or)
    ? [...(baseFilter.$or as Record<string, unknown>[])]
    : [baseFilter];

  orClauses.push({ assignedToUserId: { $in: subordinateIds } });
  return { $or: orClauses };
}

function applyTabFilter(
  tab: ListOperationsWorkQuery["tab"],
  access: OperationsResolvedAccess,
  _now: Date,
): Record<string, unknown> {
  switch (tab) {
    case "my_queue":
      return {
        assignedToUserId: access.userId,
        status: { $in: ["assigned", "in_progress", "queued"] },
      };
    case "waiting":
      return {
        status: "waiting",
        $or: [
          { assignedToUserId: access.userId },
          ...(access.departmentId
            ? [{ departmentId: access.departmentId }]
            : []),
        ],
      };
    case "completed":
      // All completed work in the actor's visibility scope (not only today).
      // KPI "Completed" remains completed-today via analytics.
      return {
        status: "completed",
      };
    case "all":
    default:
      return {};
  }
}

function applyDueFilter(
  due: ListOperationsWorkQuery["due"],
  now: Date,
): Record<string, unknown> {
  if (due === "all") return {};
  const startToday = startOfLocalDay(now);
  const endToday = endOfLocalDay(now);
  const in7 = addMs(endToday, 7 * 24 * 60 * 60 * 1000);
  const in48 = addMs(now, 48 * 60 * 60 * 1000);

  switch (due) {
    case "do_now":
      return buildDoNowFilter(now);
    case "overdue":
      return {
        dueAt: { $lt: now },
        status: { $nin: ["completed", "cancelled"] },
      };
    case "due_today":
      return {
        dueAt: { $gte: startToday, $lte: endToday },
        status: { $nin: ["completed", "cancelled"] },
      };
    case "due_soon":
      return {
        dueAt: { $gte: now, $lte: in48 },
        status: { $nin: ["completed", "cancelled"] },
      };
    case "upcoming":
      return {
        dueAt: { $gt: endToday, $lte: in7 },
        status: { $nin: ["completed", "cancelled"] },
      };
    default:
      return {};
  }
}

async function loadWorkOrThrow(
  id: string,
  access: OperationsResolvedAccess,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Work item not found.", HTTP_STATUS.NOT_FOUND);
  }

  const visibility = await expandManagerAssigneeScope(
    access,
    buildWorkVisibilityFilter(access),
  );

  const doc = await OperationsWorkItemModel.findOne({
    _id: id,
    ...visibility,
  }).lean();

  if (!doc) {
    const exists = await OperationsWorkItemModel.exists({ _id: id });
    if (exists) {
      throw new AppError(
        "You don't have permission to view this work.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    throw new AppError("Work item not found.", HTTP_STATUS.NOT_FOUND);
  }

  return doc as Record<string, unknown>;
}

function conflictIfStale(
  matched: { matchedCount?: number; modifiedCount?: number } | null,
): void {
  if (!matched || matched.matchedCount === 0) {
    throw new AppError(
      "This work item was updated by another user. Refresh and try again.",
      HTTP_STATUS.CONFLICT,
    );
  }
}

class OperationsWorkService {
  async listEligibleAssignees(access: OperationsResolvedAccess) {
    return listEligibleAssignees(access);
  }

  async listEligibleDepartments(access: OperationsResolvedAccess) {
    return listEligibleDepartments(access);
  }

  async getAnalytics(
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkAnalyticsResult> {
    assertPermission(access, WORK_LIST_VIEW_KEY);
    const now = new Date();
    const startToday = startOfLocalDay(now);
    const endToday = endOfLocalDay(now);
    const in7 = addMs(endToday, 7 * 24 * 60 * 60 * 1000);

    const visibility = await expandManagerAssigneeScope(
      access,
      buildWorkVisibilityFilter(access),
    );

    // KPI strip = actionable work in the actor's visibility scope (includes
    // team queue for Super Admin / same-department unassigned). My Queue badge
    // remains personal assignments only.
    const openVisible = {
      $and: [
        visibility,
        { status: { $in: ["assigned", "in_progress", "queued"] } },
      ],
    };

    const [
      doNow,
      dueToday,
      upcoming,
      waiting,
      completedToday,
      myQueueBadge,
      p1Open,
      p1Done,
      dueTodayAssigned,
      dueTodayDone,
    ] = await Promise.all([
      OperationsWorkItemModel.countDocuments({
        $and: [visibility, buildDoNowFilter(now)],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          openVisible,
          { dueAt: { $gte: startToday, $lte: endToday } },
        ],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          openVisible,
          { dueAt: { $gt: endToday, $lte: in7 } },
        ],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [visibility, { status: "waiting" }],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          visibility,
          { status: "completed", completedAt: { $gte: startToday } },
        ],
      }),
      OperationsWorkItemModel.countDocuments({
        assignedToUserId: access.userId,
        status: { $in: ["assigned", "in_progress", "queued", "waiting"] },
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          visibility,
          {
            priority: "P1",
            status: { $in: ["assigned", "in_progress", "queued", "waiting"] },
          },
        ],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          visibility,
          {
            priority: "P1",
            status: "completed",
            completedAt: { $gte: startToday },
          },
        ],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          visibility,
          {
            dueAt: { $gte: startToday, $lte: endToday },
            status: { $ne: "cancelled" },
          },
        ],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [
          visibility,
          {
            dueAt: { $gte: startToday, $lte: endToday },
            status: "completed",
            completedAt: { $gte: startToday },
          },
        ],
      }),
    ]);

    const p1Target = p1Open + p1Done;
    const todayTarget = dueTodayAssigned;
    const todayDone = dueTodayDone;

    return {
      kpis: {
        doNow,
        doNowCaption: "Urgent action required",
        dueToday,
        dueTodayCaption: "Complete today",
        upcoming,
        upcomingCaption: "Next 7 days",
        waiting,
        waitingCaption: "On hold",
        completedToday,
        completedTodayCaption: "Today",
      },
      focus: [
        {
          id: "clear_p1",
          title: "Clear all P1 items",
          current: p1Done,
          target: Math.max(p1Target, 1),
          status:
            p1Open === 0 ? "done" : p1Open <= 1 ? "on_track" : "at_risk",
          progressLabel: `${p1Done} of ${Math.max(p1Target, p1Done)}`,
        },
        {
          id: "clear_overdue",
          title: "Clear overdue work",
          current: Math.max(doNow - p1Open, 0) === 0 && doNow === 0 ? 1 : 0,
          target: 1,
          status: doNow === 0 ? "done" : "at_risk",
          progressLabel:
            doNow === 0
              ? "No urgent work"
              : `${doNow} urgent item${doNow === 1 ? "" : "s"}`,
        },
        {
          id: "complete_today",
          title: "Complete today's assignments",
          current: todayDone,
          target: Math.max(todayTarget, 1),
          status:
            todayTarget === 0 || todayDone >= todayTarget
              ? "done"
              : todayDone > 0
                ? "on_track"
                : "at_risk",
          progressLabel: `${todayDone} of ${Math.max(todayTarget, todayDone)}`,
        },
      ],
      myQueueBadge,
    };
  }

  async list(
    query: ListOperationsWorkQuery,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkListResult> {
    assertPermission(access, WORK_LIST_VIEW_KEY);
    const now = new Date();
    const visibility = await expandManagerAssigneeScope(
      access,
      buildWorkVisibilityFilter(access),
    );
    const tabFilter = applyTabFilter(query.tab, access, now);
    const dueFilter = applyDueFilter(query.due, now);

    const andClauses: Record<string, unknown>[] = [visibility, tabFilter];
    if (Object.keys(dueFilter).length > 0) {
      andClauses.push(dueFilter);
    }
    if (query.type) {
      andClauses.push({ type: query.type });
    }
    if (query.priority) {
      andClauses.push({ priority: query.priority });
    }
    if (query.search.trim()) {
      const q = query.search.trim();
      andClauses.push({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { displayId: { $regex: q, $options: "i" } },
          { relatedLabel: { $regex: q, $options: "i" } },
          { relatedLocationLabel: { $regex: q, $options: "i" } },
          { relatedEntityId: { $regex: q, $options: "i" } },
        ],
      });
    }

    const filter = { $and: andClauses };
    const sortDir = query.order === "desc" ? -1 : 1;
    const sort: Record<string, 1 | -1> =
      query.sort === "priority"
        ? { priority: sortDir, dueAt: 1 }
        : { [query.sort]: sortDir, _id: -1 };

    const skip = (query.page - 1) * query.limit;
    const [total, rows, myQueue, waiting, completed, all] = await Promise.all([
      OperationsWorkItemModel.countDocuments(filter),
      OperationsWorkItemModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      OperationsWorkItemModel.countDocuments({
        $and: [visibility, applyTabFilter("my_queue", access, now)],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [visibility, applyTabFilter("waiting", access, now)],
      }),
      OperationsWorkItemModel.countDocuments({
        $and: [visibility, applyTabFilter("completed", access, now)],
      }),
      OperationsWorkItemModel.countDocuments(visibility),
    ]);

    const names = await nameMapForIds(
      rows.map((row) =>
        row.assignedToUserId ? String(row.assignedToUserId) : null,
      ),
    );

    return {
      items: rows.map((row) => toListItem(row as Record<string, unknown>, names)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      tabs: {
        myQueue,
        waiting,
        completed,
        all,
      },
    };
  }

  async getById(
    id: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    assertPermission(access, WORK_DETAIL_VIEW_KEY);
    const doc = await loadWorkOrThrow(id, access);
    const names = await nameMapForIds([
      doc.assignedToUserId ? String(doc.assignedToUserId) : null,
      doc.createdByUserId ? String(doc.createdByUserId) : null,
      doc.assignedByUserId ? String(doc.assignedByUserId) : null,
      doc.completedByUserId ? String(doc.completedByUserId) : null,
    ]);
    const base = toListItem(doc, names);
    const historyRaw = Array.isArray(doc.history) ? doc.history : [];
    const canHistory = operationsAccessCanKey(access, WORK_DETAIL_HISTORY_KEY);

    return {
      ...base,
      createdByUserId: doc.createdByUserId
        ? String(doc.createdByUserId)
        : null,
      createdByName: doc.createdByUserId
        ? names.get(String(doc.createdByUserId)) ?? null
        : null,
      assignedByUserId: doc.assignedByUserId
        ? String(doc.assignedByUserId)
        : null,
      assignedByName: doc.assignedByUserId
        ? names.get(String(doc.assignedByUserId)) ?? null
        : null,
      assignedAt: iso(doc.assignedAt as Date | null),
      completedByUserId: doc.completedByUserId
        ? String(doc.completedByUserId)
        : null,
      sourceEventKey: doc.sourceEventKey ? String(doc.sourceEventKey) : null,
      metadata:
        doc.metadata && typeof doc.metadata === "object"
          ? (doc.metadata as Record<string, unknown>)
          : {},
      history: canHistory
        ? historyRaw.map((entry) => {
            const e = entry as Record<string, unknown>;
            return {
              action: String(e.action ?? ""),
              at: iso(e.at as Date) ?? new Date(0).toISOString(),
              actorUserId: e.actorUserId ? String(e.actorUserId) : null,
              actorName: String(e.actorName ?? "SYSTEM"),
              fromStatus: e.fromStatus ? String(e.fromStatus) : null,
              toStatus: e.toStatus ? String(e.toStatus) : null,
              note: String(e.note ?? ""),
              metadata:
                e.metadata && typeof e.metadata === "object"
                  ? (e.metadata as Record<string, unknown>)
                  : {},
            };
          })
        : [],
    };
  }

  async create(
    body: CreateOperationsWorkBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    assertPermission(access, WORK_CREATE_KEY);
    const now = new Date();
    const id = new mongoose.Types.ObjectId();

    const assignTo =
      body.assignTo ??
      (body.assignedToUserId
        ? "user"
        : body.departmentId
          ? "team_queue"
          : "none");

    let assignedToUserId: string | null = null;
    let departmentId: string | null =
      body.departmentId ?? access.departmentId ?? null;
    let status: WorkItemStatus = "queued";
    let historyNote = "Manual work created";

    if (assignTo === "user") {
      if (!body.assignedToUserId) {
        throw new AppError(
          "Assignee is required when assigning to a team member.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      const { target } = await assertCanAssignWorkToUser({
        actor: access,
        targetUserId: body.assignedToUserId,
        mode: "assign",
      });
      assignedToUserId = String(target._id);
      departmentId = target.departmentId
        ? String(target.departmentId)
        : departmentId;
      status = "assigned";
      historyNote = "Manual work created and assigned";
    } else if (assignTo === "team_queue") {
      const routeDepartmentId =
        body.departmentId ?? access.departmentId ?? null;
      if (!routeDepartmentId) {
        throw new AppError(
          "Select a department for Team Queue assignment.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      const { department } = await assertCanRouteWorkToDepartment({
        actor: access,
        departmentId: routeDepartmentId,
        mode: "assign",
      });
      departmentId = String(department._id);
      assignedToUserId = null;
      status = "queued";
      historyNote = "Manual work created in Team Queue";
    }

    const dueAt = body.dueAt
      ? new Date(body.dueAt)
      : addMs(now, WORK_TYPE_DEFAULT_SLA_MS[body.type]);

    const doc = await OperationsWorkItemModel.create({
      _id: id,
      displayId: formatWorkDisplayId(id.toHexString()),
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      type: body.type,
      priority: body.priority,
      status,
      origin: "manual",
      sourceEventKey: null,
      relatedEntityType: body.relatedEntityType ?? null,
      relatedEntityId: body.relatedEntityId ?? null,
      relatedLabel: body.relatedLabel ?? "",
      relatedLocationLabel: body.relatedLocationLabel ?? "",
      departmentId,
      assignedToUserId,
      assignedByUserId: assignedToUserId ? access.userId : null,
      assignedAt: assignedToUserId ? now : null,
      createdByUserId: access.userId,
      dueAt,
      slaTargetAt: dueAt,
      revision: 1,
      history: [
        {
          action: "work.created",
          at: now,
          actorUserId: access.userId,
          actorName: actorName(access),
          fromStatus: null,
          toStatus: status,
          note: historyNote,
          metadata: {
            assignTo,
            departmentId,
            assignedToUserId,
          },
        },
        ...(assignedToUserId
          ? [
              {
                action: "work.assigned",
                at: now,
                actorUserId: access.userId,
                actorName: actorName(access),
                fromStatus: "queued",
                toStatus: "assigned",
                note: "",
                metadata: { assignedToUserId },
              },
            ]
          : []),
      ],
    });

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: "work.created",
      targetType: "work_item",
      targetId: String(doc._id),
      targetLabel: doc.displayId,
      nextState: {
        status: doc.status,
        type: doc.type,
        priority: doc.priority,
        assignTo,
        departmentId,
        assignedToUserId,
      },
    });

    if (assignedToUserId) {
      scheduleWorkAssignmentNotification({
        workItemId: String(doc._id),
        displayId: doc.displayId,
        title: doc.title,
        assigneeUserId: assignedToUserId,
        actorName: actorName(access),
        kind: "assigned",
        revision: 1,
      });
    }

    return this.getById(String(doc._id), access);
  }

  async bulkAssign(
    body: BulkAssignOperationsWorkBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkBulkAssignResult> {
    if (body.workItemIds.length > WORK_BULK_ASSIGN_MAX) {
      throw new AppError(
        `Bulk assign is limited to ${WORK_BULK_ASSIGN_MAX} work items.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    assertHasAssignOrReassignPermission(access);

    const result: OperationsWorkBulkAssignResult = {
      requested: body.workItemIds.length,
      succeeded: 0,
      failed: 0,
      targetType: body.targetType,
      targetId: body.targetId,
      targetLabel: body.targetId,
      successful: [],
      failures: [],
    };

    let userTarget: Awaited<
      ReturnType<typeof assertCanAssignWorkToUser>
    >["target"] | null = null;

    const targetValidationMode = resolveBulkTargetValidationMode(access);

    // Pre-validate target once (still re-check per item for mode).
    try {
      if (body.targetType === "user") {
        const validated = await assertCanAssignWorkToUser({
          actor: access,
          targetUserId: body.targetId,
          mode: targetValidationMode,
        });
        userTarget = validated.target;
        result.targetLabel = validated.target.fullName;
      } else {
        const validated = await assertCanRouteWorkToDepartment({
          actor: access,
          departmentId: body.targetId,
          mode: targetValidationMode,
        });
        result.targetLabel = validated.department.name;
      }
    } catch (error) {
      const mapped = mapBulkItemError(error);
      for (const workItemId of body.workItemIds) {
        result.failures.push({
          workItemId,
          displayId: null,
          code: mapped.code,
          reason: mapped.reason,
        });
      }
      result.failed = result.failures.length;
      await recordOperationsAuditEvent({
        actorUserId: access.userId,
        actorName: actorName(access),
        action: "work.bulk_assign",
        targetType: "work_item",
        targetId: "bulk",
        targetLabel: result.targetLabel,
        metadata: {
          targetType: body.targetType,
          targetId: body.targetId,
          requested: result.requested,
          succeeded: 0,
          failed: result.failed,
          failures: result.failures,
        },
      });
      return result;
    }

    const now = new Date();

    for (const workItemId of body.workItemIds) {
      const expectedRevision = body.expectedRevisions[workItemId];
      const displayFallback = workItemId;
      try {
        if (expectedRevision == null) {
          result.failures.push({
            workItemId,
            displayId: null,
            code: "BAD_REQUEST",
            reason: "Missing expectedRevision.",
          });
          continue;
        }

        let existing: Record<string, unknown>;
        try {
          existing = await loadWorkOrThrow(workItemId, access);
        } catch (error) {
          const mapped = mapBulkItemError(error);
          result.failures.push({
            workItemId,
            displayId: null,
            code: mapped.code,
            reason: mapped.reason,
          });
          continue;
        }

        const displayId = String(existing.displayId ?? displayFallback);
        const fromStatus = existing.status as WorkItemStatus;
        if (isTerminalWorkStatus(fromStatus)) {
          result.failures.push({
            workItemId,
            displayId,
            code: "TERMINAL",
            reason: "Cannot assign a completed or cancelled work item.",
          });
          continue;
        }

        const previousAssignee = existing.assignedToUserId
          ? String(existing.assignedToUserId)
          : null;
        const mode = previousAssignee ? "reassign" : "assign";

        if (body.targetType === "user") {
          await assertCanAssignWorkToUser({
            actor: access,
            targetUserId: body.targetId,
            mode,
          });
          assertWorkStatusTransition(fromStatus, "assigned");

          const targetDepartmentId = userTarget?.departmentId
            ? String(userTarget.departmentId)
            : null;

          const updated = await OperationsWorkItemModel.updateOne(
            {
              _id: workItemId,
              revision: expectedRevision,
              status: { $nin: ["completed", "cancelled"] },
            },
            {
              $set: {
                assignedToUserId: body.targetId,
                assignedByUserId: access.userId,
                assignedAt: now,
                status: "assigned",
                waitingReason: null,
                ...(targetDepartmentId
                  ? { departmentId: targetDepartmentId }
                  : {}),
              },
              $inc: { revision: 1 },
              $push: {
                history: {
                  action:
                    mode === "reassign" ? "work.reassigned" : "work.assigned",
                  at: now,
                  actorUserId: access.userId,
                  actorName: actorName(access),
                  fromStatus,
                  toStatus: "assigned",
                  note: "Bulk assign",
                  metadata: {
                    bulk: true,
                    assignedToUserId: body.targetId,
                    previousAssigneeUserId: previousAssignee,
                  },
                },
              },
            },
          );

          if (!updated.matchedCount) {
            result.failures.push({
              workItemId,
              displayId,
              code: "CONFLICT",
              reason:
                "This work item was updated by another user. Refresh and try again.",
            });
            continue;
          }

          scheduleWorkAssignmentNotification({
            workItemId,
            displayId,
            title: String(existing.title ?? ""),
            assigneeUserId: body.targetId,
            actorName: actorName(access),
            kind: mode === "reassign" ? "reassigned" : "assigned",
            previousAssigneeUserId: previousAssignee,
            revision: expectedRevision + 1,
          });

          result.successful.push({ workItemId, displayId });
        } else {
          await assertCanRouteWorkToDepartment({
            actor: access,
            departmentId: body.targetId,
            mode,
          });
          if (fromStatus === "in_progress" || fromStatus === "waiting") {
            result.failures.push({
              workItemId,
              displayId,
              code: "BAD_REQUEST",
              reason:
                "Return work to Assigned before routing it to Team Queue.",
            });
            continue;
          }
          if (fromStatus !== "queued") {
            assertWorkStatusTransition(fromStatus, "queued");
          }

          const updated = await OperationsWorkItemModel.updateOne(
            {
              _id: workItemId,
              revision: expectedRevision,
              status: { $nin: ["completed", "cancelled"] },
            },
            {
              $set: {
                assignedToUserId: null,
                assignedByUserId: null,
                assignedAt: null,
                departmentId: body.targetId,
                status: "queued",
                waitingReason: null,
              },
              $inc: { revision: 1 },
              $push: {
                history: {
                  action: "work.routed_to_team_queue",
                  at: now,
                  actorUserId: access.userId,
                  actorName: actorName(access),
                  fromStatus,
                  toStatus: "queued",
                  note: "Bulk assign to department Team Queue",
                  metadata: {
                    bulk: true,
                    departmentId: body.targetId,
                    previousAssigneeUserId: previousAssignee,
                  },
                },
              },
            },
          );

          if (!updated.matchedCount) {
            result.failures.push({
              workItemId,
              displayId,
              code: "CONFLICT",
              reason:
                "This work item was updated by another user. Refresh and try again.",
            });
            continue;
          }

          // No mass notification to every department member for Team Queue.
          result.successful.push({ workItemId, displayId });
        }
      } catch (error) {
        const mapped = mapBulkItemError(error);
        result.failures.push({
          workItemId,
          displayId: null,
          code: mapped.code,
          reason: mapped.reason,
        });
      }
    }

    result.succeeded = result.successful.length;
    result.failed = result.failures.length;

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: "work.bulk_assign",
      targetType: "work_item",
      targetId: "bulk",
      targetLabel: result.targetLabel,
      metadata: {
        targetType: body.targetType,
        targetId: body.targetId,
        requested: result.requested,
        succeeded: result.succeeded,
        failed: result.failed,
        successfulIds: result.successful.map((row) => row.workItemId),
        failures: result.failures.map((row) => ({
          workItemId: row.workItemId,
          code: row.code,
          reason: row.reason,
        })),
      },
    });

    return result;
  }

  async assign(
    id: string,
    body: AssignOperationsWorkBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    const existing = await loadWorkOrThrow(id, access);
    const previousAssignee = existing.assignedToUserId
      ? String(existing.assignedToUserId)
      : null;
    const mode = previousAssignee ? "reassign" : "assign";

    if (mode === "reassign") {
      if (
        !operationsAccessCanKey(access, WORK_REASSIGN_KEY) &&
        !operationsAccessCanKey(access, WORK_ASSIGN_KEY)
      ) {
        throw new AppError(
          "You do not have permission to reassign work.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
    }

    const { target } = await assertCanAssignWorkToUser({
      actor: access,
      targetUserId: body.assignedToUserId,
      mode,
    });

    if (isTerminalWorkStatus(existing.status as WorkItemStatus)) {
      throw new AppError(
        "Cannot assign a completed or cancelled work item.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const fromStatus = existing.status as WorkItemStatus;
    assertWorkStatusTransition(fromStatus, "assigned");

    const now = new Date();
    const setFields: Record<string, unknown> = {
      assignedToUserId: target._id,
      assignedByUserId: access.userId,
      assignedAt: now,
      status: "assigned",
      waitingReason: null,
    };
    if (body.dueAt !== undefined) {
      setFields.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    }
    if (body.priority) {
      setFields.priority = body.priority;
    }

    const updated = await OperationsWorkItemModel.updateOne(
      {
        _id: id,
        revision: body.expectedRevision,
        status: { $nin: ["completed", "cancelled"] },
      },
      {
        $set: setFields,
        $inc: { revision: 1 },
        $push: {
          history: {
            action: mode === "reassign" ? "work.reassigned" : "work.assigned",
            at: now,
            actorUserId: access.userId,
            actorName: actorName(access),
            fromStatus,
            toStatus: "assigned",
            note: "",
            metadata: {
              assignedToUserId: String(target._id),
              previousAssigneeUserId: previousAssignee,
            },
          },
        },
      },
    );
    conflictIfStale(updated);

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: mode === "reassign" ? "work.reassigned" : "work.assigned",
      targetType: "work_item",
      targetId: id,
      targetLabel: String(existing.displayId ?? id),
      previousState: {
        assignedToUserId: previousAssignee,
        status: fromStatus,
      },
      nextState: {
        assignedToUserId: String(target._id),
        status: "assigned",
      },
    });

    scheduleWorkAssignmentNotification({
      workItemId: id,
      displayId: String(existing.displayId ?? id),
      title: String(existing.title ?? ""),
      assigneeUserId: String(target._id),
      actorName: actorName(access),
      kind: mode === "reassign" ? "reassigned" : "assigned",
      previousAssigneeUserId: previousAssignee,
      revision: Number(existing.revision ?? 1) + 1,
    });

    return this.getById(id, access);
  }

  async claim(
    id: string,
    body: ClaimOperationsWorkBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    assertCanClaimWork(access);
    const existing = await loadWorkOrThrow(id, access);

    if (existing.assignedToUserId) {
      throw new AppError(
        "This work item is already assigned.",
        HTTP_STATUS.CONFLICT,
      );
    }
    if ((existing.status as WorkItemStatus) !== "queued") {
      throw new AppError(
        "Only queued team work can be claimed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (
      access.departmentId &&
      existing.departmentId &&
      String(access.departmentId) !== String(existing.departmentId)
    ) {
      throw new AppError(
        "You cannot claim work outside your department.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const now = new Date();
    const updated = await OperationsWorkItemModel.updateOne(
      {
        _id: id,
        revision: body.expectedRevision,
        status: "queued",
        assignedToUserId: null,
      },
      {
        $set: {
          assignedToUserId: access.userId,
          assignedByUserId: access.userId,
          assignedAt: now,
          status: "assigned",
        },
        $inc: { revision: 1 },
        $push: {
          history: {
            action: "work.claimed",
            at: now,
            actorUserId: access.userId,
            actorName: actorName(access),
            fromStatus: "queued",
            toStatus: "assigned",
            note: "Claimed from team queue",
            metadata: {},
          },
        },
      },
    );
    conflictIfStale(updated);

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: "work.claimed",
      targetType: "work_item",
      targetId: id,
      targetLabel: String(existing.displayId ?? id),
      nextState: { assignedToUserId: access.userId, status: "assigned" },
    });

    scheduleWorkAssignmentNotification({
      workItemId: id,
      displayId: String(existing.displayId ?? id),
      title: String(existing.title ?? ""),
      assigneeUserId: String(access.userId),
      actorName: actorName(access),
      kind: "claimed",
      revision: Number(existing.revision ?? 1) + 1,
    });

    return this.getById(id, access);
  }

  async updateStatus(
    id: string,
    body: UpdateWorkStatusBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    const existing = await loadWorkOrThrow(id, access);
    const fromStatus = existing.status as WorkItemStatus;
    const toStatus = body.status as WorkItemStatus;
    assertWorkStatusTransition(fromStatus, toStatus);

    const isAssignee =
      existing.assignedToUserId &&
      String(existing.assignedToUserId) === String(access.userId);

    if (toStatus === "completed") {
      assertPermission(access, WORK_COMPLETE_KEY);
    } else {
      assertPermission(access, WORK_UPDATE_KEY);
    }

    if (
      !access.isSuperAdmin &&
      !operationsAccessCanKey(access, WORK_ASSIGN_KEY) &&
      !isAssignee
    ) {
      throw new AppError(
        "You can only update work assigned to you.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (toStatus === "waiting" && !body.waitingReason?.trim()) {
      throw new AppError(
        "A waiting reason is required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const now = new Date();
    const setFields: Record<string, unknown> = {
      status: toStatus,
    };
    if (toStatus === "waiting") {
      setFields.waitingReason = body.waitingReason?.trim() ?? "";
    } else {
      setFields.waitingReason = null;
    }
    if (toStatus === "completed") {
      setFields.completedAt = now;
      setFields.completedByUserId = access.userId;
    }
    if (toStatus === "queued") {
      setFields.assignedToUserId = null;
      setFields.assignedAt = null;
    }

    const action =
      toStatus === "waiting"
        ? "work.waiting"
        : toStatus === "completed"
          ? "work.completed"
          : toStatus === "in_progress" && fromStatus === "waiting"
            ? "work.resumed"
            : toStatus === "in_progress"
              ? "work.started"
              : "work.status_changed";

    const updated = await OperationsWorkItemModel.updateOne(
      {
        _id: id,
        revision: body.expectedRevision,
        status: fromStatus,
      },
      {
        $set: setFields,
        $inc: { revision: 1 },
        $push: {
          history: {
            action,
            at: now,
            actorUserId: access.userId,
            actorName: actorName(access),
            fromStatus,
            toStatus,
            note: body.note?.trim() ?? "",
            metadata: {},
          },
        },
      },
    );
    conflictIfStale(updated);

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action,
      targetType: "work_item",
      targetId: id,
      targetLabel: String(existing.displayId ?? id),
      previousState: { status: fromStatus },
      nextState: { status: toStatus },
      reason: body.waitingReason ?? body.note,
    });

    return this.getById(id, access);
  }

  async updatePriority(
    id: string,
    body: UpdateWorkPriorityBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    assertPermission(access, WORK_PRIORITY_UPDATE_KEY);
    const existing = await loadWorkOrThrow(id, access);
    const now = new Date();
    const updated = await OperationsWorkItemModel.updateOne(
      { _id: id, revision: body.expectedRevision },
      {
        $set: { priority: body.priority },
        $inc: { revision: 1 },
        $push: {
          history: {
            action: "work.priority_changed",
            at: now,
            actorUserId: access.userId,
            actorName: actorName(access),
            fromStatus: existing.status,
            toStatus: existing.status,
            note: "",
            metadata: {
              from: existing.priority,
              to: body.priority,
            },
          },
        },
      },
    );
    conflictIfStale(updated);

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: "work.priority_changed",
      targetType: "work_item",
      targetId: id,
      targetLabel: String(existing.displayId ?? id),
      previousState: { priority: existing.priority },
      nextState: { priority: body.priority },
    });

    return this.getById(id, access);
  }

  async updateDue(
    id: string,
    body: UpdateWorkDueBody,
    access: OperationsResolvedAccess,
  ): Promise<OperationsWorkDetail> {
    assertPermission(access, WORK_DUE_UPDATE_KEY);
    const existing = await loadWorkOrThrow(id, access);
    const now = new Date();
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;
    const updated = await OperationsWorkItemModel.updateOne(
      { _id: id, revision: body.expectedRevision },
      {
        $set: { dueAt, slaTargetAt: dueAt },
        $inc: { revision: 1 },
        $push: {
          history: {
            action: "work.due_date_changed",
            at: now,
            actorUserId: access.userId,
            actorName: actorName(access),
            fromStatus: existing.status,
            toStatus: existing.status,
            note: "",
            metadata: {
              from: existing.dueAt,
              to: dueAt,
            },
          },
        },
      },
    );
    conflictIfStale(updated);

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: "work.due_date_changed",
      targetType: "work_item",
      targetId: id,
      targetLabel: String(existing.displayId ?? id),
      previousState: { dueAt: existing.dueAt },
      nextState: { dueAt },
    });

    return this.getById(id, access);
  }

  async export(
    query: ExportOperationsWorkQuery,
    access: OperationsResolvedAccess,
    format: "xlsx" | "csv",
    actor: { operationsUserId: string },
  ) {
    assertPermission(access, WORK_LIST_VIEW_KEY);
    assertPermission(access, WORK_EXPORT_KEY);

    const listQuery: ListOperationsWorkQuery = {
      ...query,
      page: 1,
      limit: 2000,
    };
    const result = await this.list(listQuery, access);
    if (result.pagination.total > 2000) {
      throw new AppError(
        "Export is limited to 2,000 rows. Narrow your filters and try again.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const file = await buildOperationsWorkExportFile({
      items: result.items,
      format,
    });

    await recordOperationsAuditEvent({
      actorUserId: actor.operationsUserId,
      actorName: actorName(access),
      action: "work.export",
      targetType: "work_item",
      targetId: "export",
      targetLabel: file.fileName,
      metadata: {
        format,
        count: result.items.length,
        tab: query.tab,
        type: query.type || null,
        priority: query.priority || null,
        due: query.due,
        search: query.search || null,
      },
    });

    return file;
  }

  async reconcile(access: OperationsResolvedAccess) {
    if (!access.isSuperAdmin) {
      throw new AppError(
        "Only Super Admin can run work reconciliation.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    const stats = await reconcileOpenOperationsWork();
    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: actorName(access),
      action: "work.reconciled",
      targetType: "work_item",
      targetId: "reconcile",
      targetLabel: "operations_work_items",
      metadata: { ...stats },
    });
    return stats;
  }

  async getPerformance(
    access: OperationsResolvedAccess,
    query: PerformanceOperationsWorkQuery = {},
  ): Promise<OperationsWorkPerformanceResult> {
    assertPermission(access, WORK_LIST_VIEW_KEY);
    const now = new Date();
    const startToday = startOfLocalDay(now);
    const rangeTo = query.to ? new Date(query.to) : endOfLocalDay(now);
    const rangeFrom = query.from
      ? new Date(query.from)
      : addMs(startToday, -6 * 24 * 60 * 60 * 1000);

    if (
      Number.isNaN(rangeFrom.getTime()) ||
      Number.isNaN(rangeTo.getTime()) ||
      rangeFrom > rangeTo
    ) {
      throw new AppError(
        "Invalid performance date range.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const mine = { assignedToUserId: access.userId };
    const completedInRange = {
      ...mine,
      status: "completed" as const,
      completedAt: { $gte: rangeFrom, $lte: rangeTo },
    };

    const dayCount = Math.min(
      31,
      Math.max(
        1,
        Math.ceil(
          (rangeTo.getTime() - rangeFrom.getTime()) / (24 * 60 * 60 * 1000),
        ) + 1,
      ),
    );

    const [
      assignedOpen,
      completedTotal,
      completedInWindow,
      overdue,
      openWithSla,
      breachedOpen,
      completedDocs,
      byTypeAgg,
    ] = await Promise.all([
      OperationsWorkItemModel.countDocuments({
        ...mine,
        status: { $in: ["assigned", "in_progress", "queued", "waiting"] },
      }),
      OperationsWorkItemModel.countDocuments({
        ...mine,
        status: "completed",
      }),
      OperationsWorkItemModel.countDocuments(completedInRange),
      OperationsWorkItemModel.countDocuments({
        ...mine,
        status: { $nin: ["completed", "cancelled"] },
        dueAt: { $lt: now },
      }),
      OperationsWorkItemModel.countDocuments({
        ...mine,
        status: { $nin: ["completed", "cancelled"] },
        slaTargetAt: { $ne: null },
      }),
      OperationsWorkItemModel.countDocuments({
        ...mine,
        status: { $nin: ["completed", "cancelled"] },
        $or: [{ breachedAt: { $ne: null } }, { slaTargetAt: { $lt: now } }],
      }),
      OperationsWorkItemModel.find({
        ...mine,
        status: "completed",
        completedAt: { $gte: rangeFrom, $lte: rangeTo },
        assignedAt: { $ne: null },
      })
        .select("assignedAt completedAt createdAt")
        .limit(500)
        .lean(),
      OperationsWorkItemModel.aggregate<{
        _id: string;
        assigned: number;
        completed: number;
      }>([
        {
          $match: {
            assignedToUserId: new mongoose.Types.ObjectId(
              String(access.userId),
            ),
          },
        },
        {
          $group: {
            _id: "$type",
            assigned: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    await OperationsWorkItemModel.updateMany(
      {
        ...mine,
        status: { $nin: ["completed", "cancelled"] },
        slaTargetAt: { $ne: null, $lt: now },
        $or: [{ breachedAt: null }, { breachedAt: { $exists: false } }],
      },
      { $set: { breachedAt: now } },
    );

    let resolutionSumMs = 0;
    let resolutionCount = 0;
    let responseSumMs = 0;
    let responseCount = 0;
    for (const doc of completedDocs) {
      if (doc.assignedAt && doc.completedAt) {
        const ms =
          new Date(doc.completedAt).getTime() -
          new Date(doc.assignedAt).getTime();
        if (ms >= 0) {
          resolutionSumMs += ms;
          resolutionCount += 1;
        }
      }
      if (doc.createdAt && doc.assignedAt) {
        const ms =
          new Date(doc.assignedAt).getTime() -
          new Date(doc.createdAt).getTime();
        if (ms >= 0) {
          responseSumMs += ms;
          responseCount += 1;
        }
      }
    }

    const denominator = assignedOpen + completedTotal;
    const completionRatePercent =
      denominator > 0
        ? Math.round((completedTotal / denominator) * 1000) / 10
        : null;
    const slaOnTrack = Math.max(openWithSla - breachedOpen, 0);
    const slaCompliancePercent =
      openWithSla > 0
        ? Math.round((slaOnTrack / openWithSla) * 1000) / 10
        : null;

    const trend: OperationsWorkPerformanceTrendPoint[] = [];
    for (let i = dayCount - 1; i >= 0; i -= 1) {
      const dayStart = addMs(startOfLocalDay(rangeTo), -i * 24 * 60 * 60 * 1000);
      if (dayStart < startOfLocalDay(rangeFrom)) continue;
      const dayEnd = endOfLocalDay(dayStart);
      const count = await OperationsWorkItemModel.countDocuments({
        ...mine,
        status: "completed",
        completedAt: { $gte: dayStart, $lte: dayEnd },
      });
      trend.push({
        date: kolkataDateKey(dayStart),
        label: dayStart.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "numeric",
        }),
        completed: count,
      });
    }

    return {
      assignedOpen,
      completedTotal,
      completedLast7Days: completedInWindow,
      completionRatePercent,
      overdue,
      slaOnTrack,
      slaBreached: breachedOpen,
      slaCompliancePercent,
      averageResolutionHours:
        resolutionCount > 0
          ? Math.round((resolutionSumMs / resolutionCount / 3_600_000) * 10) /
            10
          : null,
      averageResponseHours:
        responseCount > 0
          ? Math.round((responseSumMs / responseCount / 3_600_000) * 10) / 10
          : null,
      byType: byTypeAgg.map((row) => ({
        type: row._id as WorkItemType,
        typeLabel:
          WORK_ITEM_TYPE_LABELS[row._id as WorkItemType] ?? row._id,
        assigned: row.assigned,
        completed: row.completed,
      })),
      completionTrend: trend,
      rangeFrom: rangeFrom.toISOString(),
      rangeTo: rangeTo.toISOString(),
      generatedAt: now.toISOString(),
    };
  }
}

function mapBulkItemError(error: unknown): {
  code: OperationsWorkBulkAssignResult["failures"][number]["code"];
  reason: string;
} {
  if (error instanceof AppError) {
    if (error.statusCode === HTTP_STATUS.FORBIDDEN) {
      return { code: "FORBIDDEN", reason: error.message };
    }
    if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
      return { code: "NOT_FOUND", reason: error.message };
    }
    if (error.statusCode === HTTP_STATUS.CONFLICT) {
      return { code: "CONFLICT", reason: error.message };
    }
    if (error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
      return { code: "UNAUTHORIZED", reason: error.message };
    }
    return { code: "BAD_REQUEST", reason: error.message };
  }
  return {
    code: "BAD_REQUEST",
    reason: "Unable to assign this work item.",
  };
}

function assertPermission(
  access: OperationsResolvedAccess,
  key: string,
): void {
  if (!operationsAccessCanKey(access, key)) {
    throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
  }
}

export const operationsWorkService = new OperationsWorkService();
