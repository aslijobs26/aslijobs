import mongoose from "mongoose";
import { markEmployerProfileCompletionReminderStatus } from "./employer-profile-completion-reminder.model.js";
import { markJobPostIncompleteReminderStatus } from "./job-post-incomplete-reminder.model.js";
import { JobPostIncompleteReminderModel } from "./job-post-incomplete-reminder.model.js";
import {
  isSkippedJobSeekerProfileCompletionReminderStatus,
  JobSeekerProfileCompletionReminderModel,
  markJobSeekerProfileCompletionReminderStatus,
} from "./jobseeker-profile-completion-reminder.model.js";
import type { WhatsAppNotificationQueueJob } from "./whatsapp-notification.types.js";

type ReminderDeliveryStatus = "queued" | "accepted" | "sent" | "failed";

async function markJobPostReminder(
  jobMongoId: string,
  status: ReminderDeliveryStatus,
  lastError = "",
): Promise<void> {
  const row = await JobPostIncompleteReminderModel.findOne({ jobMongoId })
    .select("generation status")
    .lean();
  if (!row) {
    return;
  }
  if (row.status.startsWith("skipped_")) {
    return;
  }
  await markJobPostIncompleteReminderStatus({
    jobMongoId,
    generation: row.generation,
    status,
    lastError,
  });
}

/**
 * Drops a WhatsApp send when registration completed (or the account became
 * ineligible) after the reminder was already queued.
 */
export async function shouldAbortJobSeekerProfileCompletionDelivery(
  job: WhatsAppNotificationQueueJob,
): Promise<boolean> {
  if (job.event !== "JOBSEEKER_PROFILE_COMPLETION") {
    return false;
  }
  if (mongoose.connection.readyState !== 1) {
    return false;
  }
  try {
    const row = await JobSeekerProfileCompletionReminderModel.findOne({
      jobSeekerId: job.entityId,
    })
      .select("status")
      .lean();
    return isSkippedJobSeekerProfileCompletionReminderStatus(row?.status);
  } catch (error) {
    console.error("[JobSeekerProfileReminder] eligibility lookup failed", {
      jobSeekerId: job.entityId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
    return false;
  }
}

export async function syncReminderWithDispatchStatus(input: {
  event: string;
  entityId: string;
  status: ReminderDeliveryStatus;
  lastError?: string;
}): Promise<void> {
  const lastError = input.lastError ?? "";
  if (input.event === "JOBSEEKER_PROFILE_COMPLETION") {
    const row = await JobSeekerProfileCompletionReminderModel.findOne({
      jobSeekerId: input.entityId,
    })
      .select("status")
      .lean();
    if (isSkippedJobSeekerProfileCompletionReminderStatus(row?.status)) {
      return;
    }
    await markJobSeekerProfileCompletionReminderStatus({
      jobSeekerId: input.entityId,
      status: input.status,
      lastError,
    });
    return;
  }
  if (input.event === "EMPLOYER_PROFILE_COMPLETION_REQUIRED") {
    await markEmployerProfileCompletionReminderStatus({
      employerId: input.entityId,
      status: input.status,
      lastError,
    });
    return;
  }
  if (input.event === "JOB_POST_INCOMPLETE") {
    await markJobPostReminder(input.entityId, input.status, lastError);
  }
}

export function syncReminderFromQueueJob(
  job: WhatsAppNotificationQueueJob,
  status: ReminderDeliveryStatus,
  lastError = "",
): void {
  void syncReminderWithDispatchStatus({
    event: job.event,
    entityId: job.entityId,
    status,
    lastError,
  }).catch((error: unknown) => {
    console.error("[WhatsAppNotification] reminder status sync failed", {
      event: job.event,
      entityId: job.entityId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}
