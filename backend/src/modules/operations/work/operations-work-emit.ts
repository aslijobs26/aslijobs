import mongoose from "mongoose";
import {
  WORK_TYPE_DEFAULT_PRIORITY,
  WORK_TYPE_DEFAULT_SLA_MS,
  type WorkItemType,
} from "./operations-work.constants.js";
import { addMs, formatWorkDisplayId } from "./operations-work-domain.js";
import { OperationsWorkItemModel } from "./operations-work.model.js";
import type { CreateSystemWorkItemInput } from "./operations-work.types.js";

/**
 * Idempotent system work creation via unique sourceEventKey.
 * Retries of the same key return the existing open/completed item without duplicates.
 */
export async function upsertSystemWorkItem(
  input: CreateSystemWorkItemInput,
): Promise<{ created: boolean; id: string }> {
  const now = new Date();
  const priority = input.priority ?? WORK_TYPE_DEFAULT_PRIORITY[input.type];
  const slaMs = WORK_TYPE_DEFAULT_SLA_MS[input.type];
  const dueAt = input.dueAt ?? addMs(now, slaMs);
  const slaTargetAt = input.slaTargetAt ?? dueAt;

  const placeholderId = new mongoose.Types.ObjectId();
  const displayId = formatWorkDisplayId(placeholderId.toHexString());

  try {
    const created = await OperationsWorkItemModel.create({
      _id: placeholderId,
      displayId,
      title: input.title.trim(),
      description: (input.description ?? "").trim(),
      type: input.type,
      priority,
      status: "queued",
      origin: "system_generated",
      sourceEventKey: input.sourceEventKey,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: String(input.relatedEntityId),
      relatedLabel: (input.relatedLabel ?? "").trim(),
      relatedLocationLabel: (input.relatedLocationLabel ?? "").trim(),
      departmentId: input.departmentId ?? null,
      assignedToUserId: null,
      dueAt,
      slaTargetAt,
      createdByUserId: null,
      revision: 1,
      history: [
        {
          action: "work.created",
          at: now,
          actorUserId: null,
          actorName: "SYSTEM",
          fromStatus: null,
          toStatus: "queued",
          note: "System-generated work item",
          metadata: input.metadata ?? {},
        },
      ],
      metadata: {
        ...(input.metadata ?? {}),
        actionPath: input.actionPath ?? null,
      },
    });
    return { created: true, id: String(created._id) };
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? Number((error as { code?: number }).code)
        : null;
    if (code === 11000) {
      const existing = await OperationsWorkItemModel.findOne({
        sourceEventKey: input.sourceEventKey,
      })
        .select("_id")
        .lean();
      if (existing) {
        return { created: false, id: String(existing._id) };
      }
    }
    throw error;
  }
}

export function scheduleSystemWorkItem(input: CreateSystemWorkItemInput): void {
  void upsertSystemWorkItem(input).catch((error) => {
    console.error("[operations-work] system work upsert rejected", {
      sourceEventKey: input.sourceEventKey,
      type: input.type,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

/** Resolve open system work for an entity (complete without deleting). */
export async function completeOpenSystemWorkForEntity(input: {
  relatedEntityType: CreateSystemWorkItemInput["relatedEntityType"];
  relatedEntityId: string;
  types?: WorkItemType[];
  actorName?: string;
  note?: string;
}): Promise<number> {
  const filter: Record<string, unknown> = {
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: String(input.relatedEntityId),
    origin: "system_generated",
    status: { $in: ["queued", "assigned", "in_progress", "waiting"] },
  };
  if (input.types?.length) {
    filter.type = { $in: input.types };
  }

  const now = new Date();
  const result = await OperationsWorkItemModel.updateMany(filter, {
    $set: {
      status: "completed",
      completedAt: now,
      waitingReason: null,
    },
    $inc: { revision: 1 },
    $push: {
      history: {
        action: "work.completed",
        at: now,
        actorUserId: null,
        actorName: input.actorName ?? "SYSTEM",
        fromStatus: null,
        toStatus: "completed",
        note: input.note ?? "Resolved by source workflow",
        metadata: {},
      },
    },
  });

  return result.modifiedCount;
}

/* ─── Domain generators ─────────────────────────────────────────── */

export function scheduleEmployerVerificationWork(input: {
  employerId: string;
  companyName: string;
  locationLabel?: string;
  submittedAt: Date;
  kind: "submitted" | "resubmitted";
}): void {
  const submittedAt = input.submittedAt;
  const key = `employer.verification_${input.kind}:${input.employerId}:${submittedAt.toISOString()}`;
  scheduleSystemWorkItem({
    sourceEventKey: key,
    title: "Verify Employer Documents",
    description:
      input.kind === "resubmitted"
        ? "Employer resubmitted verification documents for review."
        : "Employer submitted verification documents for review.",
    type: "verification",
    priority: "P1",
    relatedEntityType: "employer",
    relatedEntityId: input.employerId,
    relatedLabel: input.companyName || "Employer",
    relatedLocationLabel: input.locationLabel ?? "",
    dueAt: addMs(submittedAt, WORK_TYPE_DEFAULT_SLA_MS.verification),
    actionPath: `/operations/verifications/${encodeURIComponent(input.employerId)}`,
    metadata: { kind: input.kind, submittedAt: submittedAt.toISOString() },
  });
}

export function scheduleJobModerationWork(input: {
  publicJobId: string;
  jobMongoId: string;
  jobTitle: string;
  companyName: string;
  kind: "submitted" | "resubmitted" | "live_revision";
  submittedAt: Date;
}): void {
  const key = `job.moderation_${input.kind}:${input.publicJobId.trim().toUpperCase()}:${input.submittedAt.toISOString()}`;
  const title =
    input.kind === "live_revision"
      ? "Review Live Job Changes"
      : "Review Job Posting";
  scheduleSystemWorkItem({
    sourceEventKey: key,
    title,
    description: `${input.companyName} · ${input.jobTitle}`,
    type: "job_operations",
    priority: input.kind === "live_revision" ? "P1" : "P2",
    relatedEntityType: "job",
    relatedEntityId: input.publicJobId.trim().toUpperCase(),
    relatedLabel: input.companyName || "Employer",
    relatedLocationLabel: "",
    dueAt: addMs(input.submittedAt, WORK_TYPE_DEFAULT_SLA_MS.job_operations),
    actionPath: `/operations/jobs/${encodeURIComponent(input.publicJobId.trim().toUpperCase())}`,
    metadata: {
      kind: input.kind,
      jobMongoId: input.jobMongoId,
      jobTitle: input.jobTitle,
      submittedAt: input.submittedAt.toISOString(),
    },
  });
}

export function scheduleJoiningPendingWork(input: {
  applicationId: string;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
  locationLabel?: string;
  selectedAt: Date;
}): void {
  const key = `placement.joining_pending:${input.applicationId}`;
  scheduleSystemWorkItem({
    sourceEventKey: key,
    title: "Follow up on Joining Pending",
    description: [
      input.candidateName,
      input.jobTitle,
      input.companyName,
    ]
      .filter(Boolean)
      .join(" · "),
    type: "placements",
    priority: "P2",
    relatedEntityType: "placement",
    relatedEntityId: input.applicationId,
    relatedLabel: input.candidateName || input.companyName || "Placement",
    relatedLocationLabel: input.locationLabel ?? "",
    dueAt: addMs(input.selectedAt, WORK_TYPE_DEFAULT_SLA_MS.placements),
    actionPath: `/operations/placements/${encodeURIComponent(input.applicationId)}`,
    metadata: {
      selectedAt: input.selectedAt.toISOString(),
      jobTitle: input.jobTitle ?? null,
    },
  });
}
