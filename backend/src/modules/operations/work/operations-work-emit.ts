import mongoose from "mongoose";
import {
  WORK_TYPE_DEFAULT_PRIORITY,
  WORK_TYPE_DEFAULT_SLA_MS,
  type WorkItemType,
} from "./operations-work.constants.js";
import {
  OPEN_WORK_STATUSES,
  resolveWorkDepartmentId,
} from "./operations-work-department.js";
import { addMs, formatWorkDisplayId } from "./operations-work-domain.js";
import { OperationsWorkItemModel } from "./operations-work.model.js";
import type { CreateSystemWorkItemInput } from "./operations-work.types.js";

export function verificationOpenSourceEventKey(employerId: string): string {
  return `employer.verification_open:${employerId}`;
}

export function jobModerationOpenSourceEventKey(publicJobId: string): string {
  return `job.moderation_open:${publicJobId.trim().toUpperCase()}`;
}

export function joiningPendingSourceEventKey(applicationId: string): string {
  return `placement.joining_pending:${applicationId}`;
}

function archiveSourceEventKey(key: string, workItemId: string): string {
  return `${key}:done:${workItemId}`;
}

/**
 * Find an existing open system WorkItem for the related entity + type.
 * Prevents duplicate open tasks across live events and reconciliation.
 */
export async function findOpenSystemWorkForEntity(input: {
  relatedEntityType: CreateSystemWorkItemInput["relatedEntityType"];
  relatedEntityId: string;
  type: WorkItemType;
}): Promise<{ _id: mongoose.Types.ObjectId; departmentId?: unknown } | null> {
  return OperationsWorkItemModel.findOne({
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: String(input.relatedEntityId),
    type: input.type,
    origin: "system_generated",
    status: { $in: [...OPEN_WORK_STATUSES] },
  })
    .select("_id departmentId")
    .lean();
}

/**
 * Idempotent system work creation via unique sourceEventKey.
 * Also short-circuits when an open WorkItem already exists for the entity.
 */
export async function upsertSystemWorkItem(
  input: CreateSystemWorkItemInput,
): Promise<{ created: boolean; id: string }> {
  const existingOpen = await findOpenSystemWorkForEntity({
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    type: input.type,
  });
  if (existingOpen) {
    if (!existingOpen.departmentId && input.departmentId) {
      await OperationsWorkItemModel.updateOne(
        { _id: existingOpen._id, departmentId: null },
        { $set: { departmentId: input.departmentId } },
      );
    }
    return { created: false, id: String(existingOpen._id) };
  }

  const departmentId =
    input.departmentId ?? (await resolveWorkDepartmentId(input.type));

  const now = new Date();
  const priority = input.priority ?? WORK_TYPE_DEFAULT_PRIORITY[input.type];
  const slaMs = WORK_TYPE_DEFAULT_SLA_MS[input.type];
  const dueAt = input.dueAt ?? addMs(now, slaMs);
  const slaTargetAt = input.slaTargetAt ?? dueAt;

  const createOnce = async (): Promise<{ created: boolean; id: string }> => {
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
        departmentId: departmentId ?? null,
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
      console.info("[operations-work] system work created", {
        sourceEventKey: input.sourceEventKey,
        type: input.type,
        workItemId: String(created._id),
        departmentId: departmentId ?? null,
      });
      return { created: true, id: String(created._id) };
    } catch (error: unknown) {
      const code =
        error && typeof error === "object" && "code" in error
          ? Number((error as { code?: number }).code)
          : null;
      if (code !== 11000) {
        throw error;
      }

      const existing = await OperationsWorkItemModel.findOne({
        sourceEventKey: input.sourceEventKey,
      })
        .select("_id status")
        .lean();

      if (!existing) {
        throw error;
      }

      if (
        existing.status === "completed" ||
        existing.status === "cancelled"
      ) {
        await OperationsWorkItemModel.updateOne(
          { _id: existing._id },
          {
            $set: {
              sourceEventKey: archiveSourceEventKey(
                input.sourceEventKey,
                String(existing._id),
              ),
            },
          },
        );
        console.info("[operations-work] archived terminal sourceEventKey", {
          sourceEventKey: input.sourceEventKey,
          workItemId: String(existing._id),
        });
        return createOnce();
      }

      console.info("[operations-work] system work upsert duplicate open", {
        sourceEventKey: input.sourceEventKey,
        workItemId: String(existing._id),
      });
      return { created: false, id: String(existing._id) };
    }
  };

  return createOnce();
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
    status: { $in: [...OPEN_WORK_STATUSES] },
  };
  if (input.types?.length) {
    filter.type = { $in: input.types };
  }

  const openItems = await OperationsWorkItemModel.find(filter)
    .select("_id sourceEventKey status")
    .lean();

  if (openItems.length === 0) {
    return 0;
  }

  const now = new Date();
  let modified = 0;

  for (const item of openItems) {
    const rawKey =
      typeof item.sourceEventKey === "string" && item.sourceEventKey.trim()
        ? item.sourceEventKey.trim()
        : null;
    const result = await OperationsWorkItemModel.updateOne(
      {
        _id: item._id,
        status: { $in: [...OPEN_WORK_STATUSES] },
      },
      {
        $set: {
          status: "completed",
          completedAt: now,
          waitingReason: null,
          ...(rawKey
            ? {
                sourceEventKey: archiveSourceEventKey(
                  rawKey,
                  String(item._id),
                ),
              }
            : {}),
        },
        $inc: { revision: 1 },
        $push: {
          history: {
            action: "work.completed",
            at: now,
            actorUserId: null,
            actorName: input.actorName ?? "SYSTEM",
            fromStatus: item.status ?? null,
            toStatus: "completed",
            note: input.note ?? "Resolved by source workflow",
            metadata: {},
          },
        },
      },
    );
    if (result.modifiedCount > 0) {
      modified += 1;
    }
  }

  if (modified > 0) {
    console.info("[operations-work] system work auto-completed", {
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      modified,
    });
  }

  return modified;
}

/* ─── Domain generators ─────────────────────────────────────────── */

export async function upsertEmployerVerificationWork(input: {
  employerId: string;
  companyName: string;
  locationLabel?: string;
  submittedAt: Date;
  kind: "submitted" | "resubmitted" | "documents_requested" | "reconciled";
}): Promise<{ created: boolean; id: string }> {
  const submittedAt = input.submittedAt;
  const departmentId = await resolveWorkDepartmentId("verification");
  return upsertSystemWorkItem({
    sourceEventKey: verificationOpenSourceEventKey(input.employerId),
    title: "Verify Employer Documents",
    description:
      input.kind === "resubmitted"
        ? "Employer resubmitted verification documents for review."
        : input.kind === "documents_requested"
          ? "Additional documents requested — continue verification review."
          : "Employer submitted verification documents for review.",
    type: "verification",
    priority: "P1",
    relatedEntityType: "employer",
    relatedEntityId: input.employerId,
    relatedLabel: input.companyName || "Employer",
    relatedLocationLabel: input.locationLabel ?? "",
    departmentId,
    dueAt: addMs(submittedAt, WORK_TYPE_DEFAULT_SLA_MS.verification),
    actionPath: `/operations/verifications/${encodeURIComponent(input.employerId)}`,
    metadata: {
      kind: input.kind,
      submittedAt: submittedAt.toISOString(),
    },
  });
}

export function scheduleEmployerVerificationWork(input: {
  employerId: string;
  companyName: string;
  locationLabel?: string;
  submittedAt: Date;
  kind: "submitted" | "resubmitted";
}): void {
  void upsertEmployerVerificationWork(input).catch((error) => {
    console.error("[operations-work] verification work upsert rejected", {
      employerId: input.employerId,
      kind: input.kind,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export async function upsertJobModerationWork(input: {
  publicJobId: string;
  jobMongoId: string;
  jobTitle: string;
  companyName: string;
  kind: "submitted" | "resubmitted" | "live_revision" | "reconciled";
  submittedAt: Date;
}): Promise<{ created: boolean; id: string }> {
  const publicJobId = input.publicJobId.trim().toUpperCase();
  const departmentId = await resolveWorkDepartmentId("job_operations");
  const title =
    input.kind === "live_revision"
      ? "Review Live Job Changes"
      : "Review Job Posting";
  return upsertSystemWorkItem({
    sourceEventKey: jobModerationOpenSourceEventKey(publicJobId),
    title,
    description: `${input.companyName} · ${input.jobTitle}`,
    type: "job_operations",
    priority: input.kind === "live_revision" ? "P1" : "P2",
    relatedEntityType: "job",
    relatedEntityId: publicJobId,
    relatedLabel: input.companyName || "Employer",
    relatedLocationLabel: "",
    departmentId,
    dueAt: addMs(input.submittedAt, WORK_TYPE_DEFAULT_SLA_MS.job_operations),
    actionPath: `/operations/jobs/${encodeURIComponent(publicJobId)}`,
    metadata: {
      kind: input.kind,
      jobMongoId: input.jobMongoId,
      jobTitle: input.jobTitle,
      submittedAt: input.submittedAt.toISOString(),
    },
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
  void upsertJobModerationWork(input).catch((error) => {
    console.error("[operations-work] job moderation work upsert rejected", {
      publicJobId: input.publicJobId,
      kind: input.kind,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export async function upsertJoiningPendingWork(input: {
  applicationId: string;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
  locationLabel?: string;
  selectedAt: Date;
}): Promise<{ created: boolean; id: string }> {
  const departmentId = await resolveWorkDepartmentId("placements");
  return upsertSystemWorkItem({
    sourceEventKey: joiningPendingSourceEventKey(input.applicationId),
    title: "Follow up on Joining Pending",
    description: [input.candidateName, input.jobTitle, input.companyName]
      .filter(Boolean)
      .join(" · "),
    type: "placements",
    priority: "P2",
    relatedEntityType: "placement",
    relatedEntityId: input.applicationId,
    relatedLabel: input.candidateName || input.companyName || "Placement",
    relatedLocationLabel: input.locationLabel ?? "",
    departmentId,
    dueAt: addMs(input.selectedAt, WORK_TYPE_DEFAULT_SLA_MS.placements),
    actionPath: `/operations/placements/${encodeURIComponent(input.applicationId)}`,
    metadata: {
      selectedAt: input.selectedAt.toISOString(),
      jobTitle: input.jobTitle ?? null,
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
  void upsertJoiningPendingWork(input).catch((error) => {
    console.error("[operations-work] joining-pending work upsert rejected", {
      applicationId: input.applicationId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}
