import type { Types } from "mongoose";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import type { OperationsJobAuditAction } from "./operations-job-moderation.constants.js";

export type JobModerationAuditInput = {
  actorUserId?: Types.ObjectId | string | null;
  actorName?: string;
  action: OperationsJobAuditAction;
  publicJobId: string;
  jobTitle?: string;
  previousStatus?: string | null;
  nextStatus?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort durable audit for job moderation.
 * Never throws to callers — status transitions must remain consistent.
 */
export async function recordJobModerationAudit(
  input: JobModerationAuditInput,
): Promise<void> {
  try {
    await recordOperationsAuditEvent({
      actorUserId: input.actorUserId ?? null,
      actorName: input.actorName?.trim() || "SYSTEM",
      action: input.action,
      targetType: "job",
      targetId: input.publicJobId.trim().toUpperCase(),
      targetLabel: input.jobTitle?.trim() || input.publicJobId,
      previousState: input.previousStatus
        ? { status: input.previousStatus }
        : null,
      nextState: input.nextStatus ? { status: input.nextStatus } : null,
      reason: input.reason,
      metadata: {
        ...(input.metadata ?? {}),
        publicJobId: input.publicJobId.trim().toUpperCase(),
      },
    });
  } catch (error) {
    console.error("[operations-jobs] audit failed", {
      action: input.action,
      publicJobId: input.publicJobId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

export function scheduleJobModerationAudit(
  input: JobModerationAuditInput,
): void {
  void recordJobModerationAudit(input);
}
