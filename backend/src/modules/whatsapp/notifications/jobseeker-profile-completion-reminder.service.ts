import mongoose from "mongoose";
import { env } from "../../../config/env.js";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { resolveJobSeekerNotificationLanguage } from "../job-seeker-whatsapp-language.js";
import { evaluateJobSeekerProfileCompletion } from "../../job-seekers/job-seeker-profile-completion.js";
import { resolveWhatsAppNotificationDelivery } from "./whatsapp-notification.policy.js";
import {
  claimJobSeekerProfileCompletionReminder,
  findDueJobSeekerProfileCompletionReminderIds,
  findJobSeekerProfileCompletionReminder,
  isSkippedJobSeekerProfileCompletionReminderStatus,
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
import {
  claimWhatsAppNotificationDispatch,
  wasWhatsAppNotificationDispatchHandedOff,
} from "./whatsapp-notification.model.js";
import { whatsAppNotificationIdempotencyKey } from "./whatsapp-notification.policy.js";
import { enqueueWhatsAppNotificationJobImmediate } from "./whatsapp-notification.queue.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

export type JobSeekerProfileCompletionReminderProcessResult =
  | "queued"
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
    preferredLanguage: string;
  }) => Promise<WhatsAppNotificationEnqueueResult>;
  markStatus: (input: {
    jobSeekerId: string;
    status: "queued" | "accepted" | "sent" | "skipped_complete" | "skipped_ineligible" | "failed";
    lastError?: string;
  }) => Promise<unknown>;
  now: () => Date;
};

const defaultProcessDeps: ProcessJobSeekerProfileCompletionReminderDeps = {
  loadReminder: findJobSeekerProfileCompletionReminder,
  claim: claimJobSeekerProfileCompletionReminder,
  loadJobSeeker: loadJobSeekerForReminder,
  enqueueNotification: (payload) =>
    enqueueWhatsAppNotification(payload, {
      claim: claimWhatsAppNotificationDispatch,
      enqueueJob: enqueueWhatsAppNotificationJobImmediate,
    }),
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
      "fullName isWhatsappVerified whatsappNumber whatsappLanguage dateOfBirth gender jobRole jobType workMode preferredJobLocation expectedSalary education experienceType experiences languages availabilityStatus registrationStatus accountStatus",
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
  const id = jobSeekerId.trim();
  const dueAt = new Date(Date.now() + getJobSeekerProfileCompletionReminderDelayMs());
  const outcome = await scheduleJobSeekerProfileCompletionReminderRecord({
    jobSeekerId: id,
    dueAt,
  });
  if (outcome === "scheduled") {
    console.info("[JobSeekerProfileReminder] scheduled", {
      jobSeekerId: id,
      dueAt: dueAt.toISOString(),
      delayMinutes: env.JOBSEEKER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
    });
  }
  return outcome;
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
  void skipPendingJobSeekerProfileCompletionReminder(id)
    .then((cancelled) => {
      if (cancelled) {
        console.info("[JobSeekerProfileReminder] cancelled", {
          jobSeekerId: id,
          reason: "registration_completed",
        });
      }
    })
    .catch((error) => {
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
    reminder.status === "accepted" ||
    reminder.status === "sent" ||
    isSkippedJobSeekerProfileCompletionReminderStatus(reminder.status)
  ) {
    return "skipped";
  }
  if (reminder.status === "queued" && mongoose.connection.readyState === 1) {
    const handedOff = await wasWhatsAppNotificationDispatchHandedOff(
      whatsAppNotificationIdempotencyKey(
        "JOBSEEKER_PROFILE_COMPLETION",
        jobSeekerId,
      ),
    );
    if (handedOff) {
      await deps.markStatus({ jobSeekerId, status: "accepted" });
      return "skipped";
    }
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
      console.info("[JobSeekerProfileReminder] skipped after recheck", {
        jobSeekerId,
        status: "skipped_ineligible",
        reason: "invalid_whatsapp_number",
      });
      return "skipped";
    }

    const latest = await deps.loadReminder(jobSeekerId);
    if (
      !latest ||
      isSkippedJobSeekerProfileCompletionReminderStatus(latest.status)
    ) {
      console.info("[JobSeekerProfileReminder] skipped after recheck", {
        jobSeekerId,
        status: latest?.status ?? "missing",
      });
      return "skipped";
    }

    const preferredLanguage = await resolveJobSeekerNotificationLanguage({
      phoneNumber,
      storedLanguage: seeker?.whatsappLanguage,
      jobSeekerId,
    });
    const delivery = resolveWhatsAppNotificationDelivery(
      "JOBSEEKER_PROFILE_COMPLETION",
      preferredLanguage,
    );
    const result = await deps.enqueueNotification({
      event: "JOBSEEKER_PROFILE_COMPLETION",
      entityId: jobSeekerId,
      phoneNumber,
      preferredLanguage,
    });

    if (result === "skipped_duplicate") {
      await deps.markStatus({ jobSeekerId, status: "queued" });
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

    await deps.markStatus({ jobSeekerId, status: "queued" });
    console.info("[JobSeekerProfileReminder] dispatched", {
      jobSeekerId,
      template: delivery?.templateName ?? "jobseeker_profile_completion",
      language: delivery?.languageCode ?? preferredLanguage,
      result,
    });
    return "queued";
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
