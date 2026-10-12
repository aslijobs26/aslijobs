import { env } from "../../../config/env.js";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { evaluateJobSeekerProfileCompletion } from "../../job-seekers/job-seeker-profile-completion.js";
import {
  claimJobSeekerProfileCompletionReminder,
  findDueJobSeekerProfileCompletionReminderIds,
  findJobSeekerProfileCompletionReminder,
  markJobSeekerProfileCompletionReminderStatus,
  scheduleJobSeekerProfileCompletionReminderRecord,
  skipPendingJobSeekerProfileCompletionReminder,
} from "./jobseeker-profile-completion-reminder.model.js";
import {
  isJobSeekerProfileCompletionReminderDue,
  jobSeekerProfileCompletionReminderDelayMs,
  shouldSendJobSeekerProfileCompletionReminder,
  type JobSeekerProfileCompletionReminderSnapshot,
} from "./jobseeker-profile-completion-reminder.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

export type JobSeekerProfileCompletionReminderProcessResult =
  | "sent"
  | "skipped"
  | "failed";

export type JobSeekerProfileCompletionReminderRecord = {
  dueAt: Date;
  status: string;
};

export type ProcessJobSeekerProfileCompletionReminderDeps = {
  loadReminder: (
    jobSeekerId: string,
  ) => Promise<JobSeekerProfileCompletionReminderRecord | null>;
  claim: (jobSeekerId: string) => Promise<boolean>;
  loadJobSeeker: (
    jobSeekerId: string,
  ) => Promise<JobSeekerProfileCompletionReminderSnapshot | null>;
  enqueueNotification: (payload: {
    event: "JOBSEEKER_PROFILE_COMPLETION";
    entityId: string;
    phoneNumber: string;
    preferredLanguage: "en";
  }) => Promise<WhatsAppNotificationEnqueueResult>;
  markStatus: typeof markJobSeekerProfileCompletionReminderStatus;
  now: () => Date;
};

const defaultProcessDeps: ProcessJobSeekerProfileCompletionReminderDeps = {
  loadReminder: findJobSeekerProfileCompletionReminder,
  claim: claimJobSeekerProfileCompletionReminder,
  loadJobSeeker: loadJobSeekerForReminder,
  enqueueNotification: enqueueWhatsAppNotification,
  markStatus: markJobSeekerProfileCompletionReminderStatus,
  now: () => new Date(),
};

export function getJobSeekerProfileCompletionReminderDelayMs(): number {
  return jobSeekerProfileCompletionReminderDelayMs(
    env.JOBSEEKER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
  );
}

async function loadJobSeekerForReminder(
  jobSeekerId: string,
): Promise<JobSeekerProfileCompletionReminderSnapshot | null> {
  return JobSeekerModel.findById(jobSeekerId)
    .select(
      "fullName isWhatsappVerified whatsappNumber dateOfBirth gender jobRole jobType workMode preferredJobLocation expectedSalary education experienceType experiences languages availabilityStatus registrationStatus accountStatus",
    )
    .lean();
}

/**
 * Persists one delayed reminder for this verified incomplete registration.
 * A later login, refresh, or OTP retry does not move dueAt.
 * Never throws to the registration caller.
 */
export async function enqueueJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
): Promise<"scheduled" | "already_scheduled"> {
  const dueAt = new Date(Date.now() + getJobSeekerProfileCompletionReminderDelayMs());
  return scheduleJobSeekerProfileCompletionReminderRecord({
    jobSeekerId: jobSeekerId.trim(),
    dueAt,
  });
}

export function scheduleJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
): void {
  void enqueueJobSeekerProfileCompletionReminder(jobSeekerId).catch((error) => {
    console.error("[JobSeekerProfileReminder] schedule rejected", {
      jobSeekerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

/**
 * Marks a still-pending reminder complete so it is not sent.
 * Does not change jobseeker_account_created.
 */
export function cancelJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
): void {
  const id = jobSeekerId.trim();
  if (!id) {
    return;
  }
  void skipPendingJobSeekerProfileCompletionReminder(id).catch((error) => {
    console.error("[JobSeekerProfileReminder] cancel rejected", {
      jobSeekerId: id,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

/**
 * Reloads the job seeker after the delay and rechecks profile completion.
 * WhatsApp failure is recorded and does not roll back the account.
 */
export async function processJobSeekerProfileCompletionReminder(
  jobSeekerId: string,
  deps: ProcessJobSeekerProfileCompletionReminderDeps = defaultProcessDeps,
): Promise<JobSeekerProfileCompletionReminderProcessResult> {
  const reminder = await deps.loadReminder(jobSeekerId);
  if (!reminder) {
    return "skipped";
  }
  if (
    reminder.status === "sent" ||
    reminder.status === "skipped_complete" ||
    reminder.status === "skipped_ineligible"
  ) {
    return "skipped";
  }
  if (!isJobSeekerProfileCompletionReminderDue(reminder.dueAt, deps.now())) {
    console.info("[JobSeekerProfileReminder] not due yet", {
      jobSeekerId,
      dueAt: reminder.dueAt.toISOString(),
      delayMinutes: env.JOBSEEKER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
    });
    return "skipped";
  }

  const claimed = await deps.claim(jobSeekerId);
  if (!claimed) {
    return "skipped";
  }

  try {
    const seeker = await deps.loadJobSeeker(jobSeekerId);
    if (!shouldSendJobSeekerProfileCompletionReminder(seeker)) {
      const status =
        seeker &&
        (seeker.registrationStatus === "COMPLETED" ||
          evaluateJobSeekerProfileCompletion(seeker).isComplete)
          ? "skipped_complete"
          : "skipped_ineligible";
      await deps.markStatus({ jobSeekerId, status });
      console.info("[JobSeekerProfileReminder] skipped after recheck", {
        jobSeekerId,
        status,
      });
      return "skipped";
    }

    const phoneNumber = seeker?.whatsappNumber?.trim() ?? "";
    try {
      toWhatsAppCloudRecipient(phoneNumber);
    } catch {
      await deps.markStatus({
        jobSeekerId,
        status: "skipped_ineligible",
        lastError: "invalid_whatsapp_number",
      });
      return "skipped";
    }

    const result = await deps.enqueueNotification({
      event: "JOBSEEKER_PROFILE_COMPLETION",
      entityId: jobSeekerId,
      phoneNumber,
      preferredLanguage: "en",
    });

    if (result === "skipped_duplicate") {
      await deps.markStatus({ jobSeekerId, status: "sent" });
      return "skipped";
    }

    if (result === "skipped_unconfigured") {
      await deps.markStatus({
        jobSeekerId,
        status: "failed",
        lastError: "template_unconfigured",
      });
      return "failed";
    }

    await deps.markStatus({ jobSeekerId, status: "sent" });
    console.info("[JobSeekerProfileReminder] dispatched", {
      jobSeekerId,
      template: "jobseeker_profile_completion",
      language: "en",
      result,
    });
    return "sent";
  } catch (error) {
    const lastError = error instanceof Error ? error.message : "reminder_failed";
    console.error("[JobSeekerProfileReminder] delivery failed", {
      jobSeekerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
    await deps.markStatus({
      jobSeekerId,
      status: "failed",
      lastError,
    });
    return "failed";
  }
}

export async function processDueJobSeekerProfileCompletionReminders(
  now = new Date(),
): Promise<void> {
  const dueIds = await findDueJobSeekerProfileCompletionReminderIds(now);
  for (const jobSeekerId of dueIds) {
    await processJobSeekerProfileCompletionReminder(jobSeekerId);
  }
}
