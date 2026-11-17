import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { assertWorkStatusTransition } from "../operations/work/operations-work-domain.js";
import { upsertSystemWorkItem } from "../operations/work/operations-work-emit.js";
import { OperationsWorkItemModel } from "../operations/work/operations-work.model.js";
import type { WorkItemStatus } from "../operations/work/operations-work.constants.js";
import { recordOperationsAuditEvent } from "../operations/rbac/operations-audit.service.js";
import type { OperationsResolvedAccess } from "../operations/rbac/operations-access.types.js";
import type { UpdateWorkStatusBody } from "../operations/work/operations-work.validation.js";
import {
  HIRE_ASSIST_ASSISTANCE_LABELS,
  HIRE_ASSIST_SOURCE_LABEL,
  HIRE_ASSIST_STATUS_LABELS,
  HIRE_ASSIST_TICKET_KIND,
  type HireAssistAssistanceType,
} from "./hire-assist.constants.js";
import type {
  CreateHireAssistBody,
  ListHireAssistTicketsQuery,
} from "./hire-assist.validation.js";

function stripControls(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readMeta(
  metadata: unknown,
): Record<string, unknown> {
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : {};
}

function metaString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export interface HireAssistTicket {
  id: string;
  ticketId: string;
  fullName: string;
  companyName: string;
  mobileNumber: string;
  email: string;
  designation: string;
  assistanceType: string;
  assistanceLabel: string;
  message: string;
  source: typeof HIRE_ASSIST_SOURCE_LABEL;
  status: WorkItemStatus;
  statusLabel: string;
  priority: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

function toTicket(doc: Record<string, unknown>): HireAssistTicket {
  const metadata = readMeta(doc.metadata);
  const assistanceType = metaString(metadata, "assistanceType");
  const status = String(doc.status ?? "queued") as WorkItemStatus;
  const label =
    HIRE_ASSIST_ASSISTANCE_LABELS[assistanceType as HireAssistAssistanceType] ??
    assistanceType;

  return {
    id: String(doc._id),
    ticketId: String(doc.displayId ?? ""),
    fullName: metaString(metadata, "fullName"),
    companyName: metaString(metadata, "companyName"),
    mobileNumber: metaString(metadata, "mobileNumber"),
    email: metaString(metadata, "email"),
    designation: metaString(metadata, "designation"),
    assistanceType,
    assistanceLabel: label,
    message: metaString(metadata, "message") || String(doc.description ?? ""),
    source: HIRE_ASSIST_SOURCE_LABEL,
    status,
    statusLabel: HIRE_ASSIST_STATUS_LABELS[status] ?? status,
    priority: String(doc.priority ?? "P3"),
    revision: Number(doc.revision ?? 1),
    createdAt: isoDate(doc.createdAt),
    updatedAt: isoDate(doc.updatedAt),
  };
}

function isoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === "string" ? value : "";
}

function hireAssistFilter(
  query: Pick<ListHireAssistTicketsQuery, "search" | "status" | "assistanceType">,
): Record<string, unknown> {
  const andClauses: Record<string, unknown>[] = [
    { type: "support" },
    { "metadata.ticketKind": HIRE_ASSIST_TICKET_KIND },
  ];

  if (query.status) {
    andClauses.push({ status: query.status });
  }
  if (query.assistanceType) {
    andClauses.push({ "metadata.assistanceType": query.assistanceType });
  }
  if (query.search.trim()) {
    const pattern = escapeRegex(query.search.trim());
    andClauses.push({
      $or: [
        { displayId: { $regex: pattern, $options: "i" } },
        { "metadata.fullName": { $regex: pattern, $options: "i" } },
        { "metadata.companyName": { $regex: pattern, $options: "i" } },
        { "metadata.email": { $regex: pattern, $options: "i" } },
        { "metadata.mobileNumber": { $regex: pattern, $options: "i" } },
      ],
    });
  }

  return { $and: andClauses };
}

export const hireAssistService = {
  async submit(body: CreateHireAssistBody): Promise<{
    ticketId: string;
    status: string;
    statusLabel: string;
    created: boolean;
  }> {
    const fullName = stripControls(body.fullName);
    const companyName = stripControls(body.companyName);
    const designation = stripControls(body.designation ?? "");
    const message = stripControls(body.message);
    const assistanceType = body.assistanceType as HireAssistAssistanceType;
    const assistanceLabel = HIRE_ASSIST_ASSISTANCE_LABELS[assistanceType];
    const relatedEntityId = new mongoose.Types.ObjectId().toString();
    const sourceEventKey = `hire_assist:${body.clientRequestId ?? relatedEntityId}`;

    const result = await upsertSystemWorkItem({
      sourceEventKey,
      type: "support",
      priority: "P3",
      title: `Hire Assist: ${fullName}`.slice(0, 200),
      description: message,
      relatedEntityType: "support",
      relatedEntityId,
      relatedLabel: companyName.slice(0, 200),
      relatedLocationLabel: `${body.email} · ${body.mobileNumber}`.slice(0, 200),
      actionPath: "/operations/support-tickets",
      metadata: {
        ticketKind: HIRE_ASSIST_TICKET_KIND,
        source: HIRE_ASSIST_SOURCE_LABEL,
        fullName,
        companyName,
        mobileNumber: body.mobileNumber,
        email: body.email,
        designation,
        assistanceType,
        assistanceLabel,
        message,
      },
    });

    const saved = await OperationsWorkItemModel.findById(result.id)
      .select("displayId status")
      .lean();

    if (!saved?.displayId) {
      throw new AppError(
        "Your request was received, but the ticket could not be loaded. Please contact support.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const status = String(saved.status ?? "queued") as WorkItemStatus;
    return {
      ticketId: String(saved.displayId),
      status,
      statusLabel: HIRE_ASSIST_STATUS_LABELS[status] ?? "New",
      created: result.created,
    };
  },

  async list(query: ListHireAssistTicketsQuery): Promise<{
    items: HireAssistTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const filter = hireAssistFilter(query);
    const skip = (query.page - 1) * query.limit;
    const [docs, total] = await Promise.all([
      OperationsWorkItemModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      OperationsWorkItemModel.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => toTicket(doc as Record<string, unknown>)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },

  async getById(id: string): Promise<HireAssistTicket> {
    const doc = await OperationsWorkItemModel.findOne({
      _id: id,
      type: "support",
      "metadata.ticketKind": HIRE_ASSIST_TICKET_KIND,
    }).lean();

    if (!doc) {
      throw new AppError("Ticket not found.", HTTP_STATUS.NOT_FOUND);
    }

    return toTicket(doc as Record<string, unknown>);
  },

  async updateStatus(
    id: string,
    body: UpdateWorkStatusBody,
    access: OperationsResolvedAccess,
  ): Promise<HireAssistTicket> {
    const existing = await OperationsWorkItemModel.findOne({
      _id: id,
      type: "support",
      "metadata.ticketKind": HIRE_ASSIST_TICKET_KIND,
    })
      .select("status displayId revision")
      .lean();

    if (!existing) {
      throw new AppError("Ticket not found.", HTTP_STATUS.NOT_FOUND);
    }

    const fromStatus = String(existing.status) as WorkItemStatus;
    const toStatus = body.status;
    assertWorkStatusTransition(fromStatus, toStatus);

    if (toStatus === "waiting" && !body.waitingReason?.trim()) {
      throw new AppError(
        "A waiting reason is required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const now = new Date();
    const setFields: Record<string, unknown> = { status: toStatus };
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

    const updated = await OperationsWorkItemModel.updateOne(
      { _id: id, revision: body.expectedRevision, status: fromStatus },
      {
        $set: setFields,
        $inc: { revision: 1 },
        $push: {
          history: {
            action: "work.status_changed",
            at: now,
            actorUserId: access.userId,
            actorName: access.roleName?.trim() || "Operations",
            fromStatus,
            toStatus,
            note: body.note?.trim() ?? "",
            metadata: { source: HIRE_ASSIST_SOURCE_LABEL },
          },
        },
      },
    );

    if (!updated.matchedCount) {
      throw new AppError(
        "This ticket was updated by someone else. Refresh and try again.",
        HTTP_STATUS.CONFLICT,
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName?.trim() || "Operations",
      action: "work.status_changed",
      targetType: "work_item",
      targetId: id,
      targetLabel: String(existing.displayId ?? id),
      previousState: { status: fromStatus },
      nextState: { status: toStatus },
      reason: body.waitingReason ?? body.note,
    });

    return this.getById(id);
  },
};
