import mongoose, { type Types } from "mongoose";
import type { JobReviewHistoryKind } from "../operations/jobs/operations-job-moderation.constants.js";
import { JOB_REVIEW_HISTORY_KINDS } from "../operations/jobs/operations-job-moderation.constants.js";

export type JobReviewHistoryEntry = {
  kind: JobReviewHistoryKind;
  decision: "approved" | "rejected";
  reason: string;
  reviewedAt: Date;
  reviewedByOperationsUserId: Types.ObjectId | null;
};

export function buildJobReviewHistoryEntry(input: {
  kind: JobReviewHistoryKind;
  decision: "approved" | "rejected";
  reason?: string;
  reviewedAt?: Date;
  reviewedByOperationsUserId?: Types.ObjectId | string | null;
}): JobReviewHistoryEntry {
  const raw = input.reviewedByOperationsUserId;
  let reviewedByOperationsUserId: Types.ObjectId | null = null;
  if (raw && typeof raw === "object") {
    reviewedByOperationsUserId = raw;
  } else if (typeof raw === "string" && mongoose.Types.ObjectId.isValid(raw)) {
    reviewedByOperationsUserId = new mongoose.Types.ObjectId(raw);
  }

  return {
    kind: input.kind,
    decision: input.decision,
    reason: (input.reason ?? "").trim(),
    reviewedAt: input.reviewedAt ?? new Date(),
    reviewedByOperationsUserId,
  };
}

/** Infer review history kind from job review state before overwrite. */
export function resolveJobReviewHistoryKind(input: {
  isLiveChange?: boolean;
  hadPriorReviewDecision?: boolean;
}): JobReviewHistoryKind {
  if (input.isLiveChange) {
    return "live_change";
  }
  if (input.hadPriorReviewDecision) {
    return "resubmission";
  }
  return "initial";
}

export function isJobReviewHistoryKind(
  value: string,
): value is JobReviewHistoryKind {
  return (JOB_REVIEW_HISTORY_KINDS as readonly string[]).includes(value);
}
