import { OperationsNotificationModel } from "../registration-awareness/operations-notification.model.js";
import type { OperationsJobNotificationType } from "./operations-job-moderation.constants.js";

export type EmitJobPendingOpsNotificationInput = {
  publicJobId: string;
  jobMongoId: string;
  jobTitle: string;
  companyName: string;
  kind: "submitted" | "resubmitted" | "live_revision";
  submittedAt?: Date;
};

function notificationTypeForKind(
  kind: EmitJobPendingOpsNotificationInput["kind"],
): OperationsJobNotificationType {
  if (kind === "resubmitted") {
    return "job.resubmitted";
  }
  if (kind === "live_revision") {
    return "job.live_revision_submitted";
  }
  return "job.pending_approval";
}

function idempotencyKey(
  kind: EmitJobPendingOpsNotificationInput["kind"],
  publicJobId: string,
  submittedAt: Date,
): string {
  const jobId = publicJobId.trim().toUpperCase();
  // Include submission instant so resubmits create a fresh Ops inbox item
  // while retries of the same write remain idempotent.
  return `job.${kind}:${jobId}:${submittedAt.toISOString()}`;
}

function titleForKind(
  kind: EmitJobPendingOpsNotificationInput["kind"],
): string {
  if (kind === "resubmitted") {
    return "Job Resubmitted for Approval";
  }
  if (kind === "live_revision") {
    return "Live Job Changes Submitted";
  }
  return "Job Pending Approval";
}

/**
 * Best-effort Operations workspace notification when a job enters review.
 * Never throws to the job submission/publish caller.
 */
export async function emitJobPendingOpsNotification(
  input: EmitJobPendingOpsNotificationInput,
): Promise<void> {
  const submittedAt = input.submittedAt ?? new Date();
  const publicJobId = input.publicJobId.trim().toUpperCase();
  const jobTitle = input.jobTitle.trim() || "Untitled job";
  const companyName = input.companyName.trim() || "Employer";
  const type = notificationTypeForKind(input.kind);
  const key = idempotencyKey(input.kind, publicJobId, submittedAt);
  const actionPath = `/operations/jobs/${encodeURIComponent(publicJobId)}`;

  const bodyParts = [
    `${companyName} · ${jobTitle}`,
    `Job ID: ${publicJobId}`,
  ];
  if (input.kind === "live_revision") {
    bodyParts.push("Live listing changes await Operations review.");
  } else if (input.kind === "resubmitted") {
    bodyParts.push("A previously rejected job was resubmitted.");
  } else {
    bodyParts.push("A new employer job awaits Operations approval.");
  }

  try {
    await OperationsNotificationModel.updateOne(
      { idempotencyKey: key },
      {
        $setOnInsert: {
          idempotencyKey: key,
          type,
          title: titleForKind(input.kind),
          body: bodyParts.join("\n"),
          entityType: "job",
          entityId: publicJobId,
          actionPath,
          actorName: "SYSTEM",
          metadata: {
            publicJobId,
            jobMongoId: input.jobMongoId,
            jobTitle,
            companyName,
            kind: input.kind,
            submittedAt: submittedAt.toISOString(),
          },
          reads: [],
          createdAt: submittedAt,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("[operations-jobs] pending notification failed", {
      type,
      publicJobId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

export function scheduleJobPendingOpsNotification(
  input: EmitJobPendingOpsNotificationInput,
): void {
  void emitJobPendingOpsNotification(input).catch((error) => {
    console.error("[operations-jobs] pending notification emit rejected", {
      publicJobId: input.publicJobId,
      kind: input.kind,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}
