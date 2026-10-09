import { env } from "../../../config/env.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { resolveEmployerRegistrationDisplayName } from "../../operations/registration-awareness/operations-registration-awareness.service.js";
import {
  isJobDraftIncomplete,
  jobPostIncompleteReminderDelayMs,
  persistedEmployerId,
  type PersistedJobDraftSnapshot,
} from "./job-post-incomplete-reminder.policy.js";
import {
  claimJobPostIncompleteReminder,
  findDueJobPostIncompleteReminders,
  findJobPostIncompleteReminder,
  invalidateJobPostIncompleteReminderRecord,
  markJobPostIncompleteReminderStatus,
  refreshJobPostIncompleteReminderRecord,
  type JobPostIncompleteReminderRecord,
} from "./job-post-incomplete-reminder.model.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

export type JobPostIncompleteReminderProcessResult =
  | "sent"
  | "skipped"
  | "failed";

type EmployerReminderSnapshot = {
  whatsappNumber?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type JobPostIncompleteReminderDeps = {
  loadJob: (jobMongoId: string) => Promise<
    | (PersistedJobDraftSnapshot & {
        _id?: { toString(): string };
        jobId?: string;
      })
    | null
  >;
  loadEmployer: (employerId: string) => Promise<EmployerReminderSnapshot | null>;
  refresh: typeof refreshJobPostIncompleteReminderRecord;
  invalidate: typeof invalidateJobPostIncompleteReminderRecord;
  findReminder: typeof findJobPostIncompleteReminder;
  claim: typeof claimJobPostIncompleteReminder;
  markStatus: typeof markJobPostIncompleteReminderStatus;
  enqueueNotification: (payload: {
    event: "JOB_POST_INCOMPLETE";
    entityId: string;
    phoneNumber: string;
    employerName: string;
    preferredLanguage: "en";
    idempotencyScope: string;
  }) => Promise<WhatsAppNotificationEnqueueResult>;
  enqueueDelayedJob: (input: {
    jobMongoId: string;
    generation: number;
    previousGeneration: number | null;
  }) => Promise<void>;
  now: () => Date;
};

const defaultDeps: JobPostIncompleteReminderDeps = {
  loadJob: async (jobMongoId) =>
    JobModel.findById(jobMongoId)
      .select(
        "status employerId jobId companyName industry businessCategory companySize jobTitle jobType contractPeriodFrom contractPeriodTo partTimeSchedule partTimeStartTime partTimeEndTime partTimeFlexibleHours workMode vacancies description state stateName city cityName address landmark salaryType salaryPeriod fixedSalary minimumSalary maximumSalary perks education experience languages gender minimumAge maximumAge walkInEnabled interviewAddress walkInStartDate walkInEndDate walkInStartTime walkInEndTime interviewInstructions contactPersonName contactEmail contactMobile",
      )
      .lean(),
  loadEmployer: async (employerId) =>
    EmployerModel.findById(employerId)
      .select("whatsappNumber companyName establishmentName firstName lastName")
      .lean(),
  refresh: refreshJobPostIncompleteReminderRecord,
  invalidate: invalidateJobPostIncompleteReminderRecord,
  findReminder: findJobPostIncompleteReminder,
  claim: claimJobPostIncompleteReminder,
  markStatus: markJobPostIncompleteReminderStatus,
  enqueueNotification: enqueueWhatsAppNotification,
  enqueueDelayedJob: async (input) => {
    const queue = await import("./job-post-incomplete-reminder.queue.js");
    await queue.enqueueJobPostIncompleteReminderJob(input);
  },
  now: () => new Date(),
};

export function getJobPostIncompleteReminderDelayMs(): number {
  return jobPostIncompleteReminderDelayMs(
    env.JOB_POST_INCOMPLETE_REMINDER_DELAY_MINUTES,
  );
}

function reminderGenerationScope(generation: number): string {
  return `g${generation}`;
}

/**
 * Schedules or refreshes the incomplete-draft reminder after a successful save.
 * Never throws to the draft caller.
 */
export async function armJobPostIncompleteReminder(
  jobMongoId: string,
  deps: JobPostIncompleteReminderDeps = defaultDeps,
): Promise<"scheduled" | "rescheduled" | "skipped"> {
  const job = await deps.loadJob(jobMongoId);
  const publicJobId = job?.jobId?.trim() || jobMongoId;
  const employerId = persistedEmployerId(job?.employerId);
  const incomplete = Boolean(job && isJobDraftIncomplete(job) && employerId);
  if (!incomplete) {
    const completeDraft = Boolean(
      job &&
        String(job.status ?? "") === "draft" &&
        employerId &&
        !isJobDraftIncomplete(job),
    );
    const invalidatedGeneration = await deps.invalidate({
      jobMongoId,
      status: completeDraft ? "skipped_complete" : "skipped_ineligible",
    });
    console.info("[JobPostIncompleteReminder] skipped ineligible draft", {
      jobMongoId,
      publicJobId,
      employerId: employerId || null,
      reason: completeDraft ? "job_complete" : "not_an_incomplete_draft",
      invalidatedGeneration,
    });
    return "skipped";
  }

  const dueAt = new Date(deps.now().getTime() + getJobPostIncompleteReminderDelayMs());
  const refreshed = await deps.refresh({
    jobMongoId,
    publicJobId,
    employerId,
    dueAt,
  });
  await deps.enqueueDelayedJob({
    jobMongoId,
    generation: refreshed.generation,
    previousGeneration:
      refreshed.generation > 1 ? refreshed.generation - 1 : null,
  });
  console.info(
    refreshed.rescheduled
      ? "[JobPostIncompleteReminder] rescheduled"
      : "[JobPostIncompleteReminder] scheduled",
    {
      jobMongoId,
      publicJobId,
      employerId,
      generation: refreshed.generation,
      delayMinutes: env.JOB_POST_INCOMPLETE_REMINDER_DELAY_MINUTES,
      delayMs: getJobPostIncompleteReminderDelayMs(),
      dueAt: dueAt.toISOString(),
    },
  );
  return refreshed.rescheduled ? "rescheduled" : "scheduled";
}

export function scheduleJobPostIncompleteReminder(jobMongoId: string): void {
  void armJobPostIncompleteReminder(jobMongoId).catch((error: unknown) => {
    console.error("[JobPostIncompleteReminder] schedule rejected", {
      jobMongoId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export const jobPostIncompleteReminder = {
  schedule: scheduleJobPostIncompleteReminder,
};

async function skipReminder(input: {
  deps: JobPostIncompleteReminderDeps;
  reminder: JobPostIncompleteReminderRecord;
  generation: number;
  status: "skipped_complete" | "skipped_ineligible";
  reason: string;
}): Promise<JobPostIncompleteReminderProcessResult> {
  await input.deps.markStatus({
    jobMongoId: input.reminder.jobMongoId,
    generation: input.generation,
    status: input.status,
  });
  console.info("[JobPostIncompleteReminder] skipped", {
    jobMongoId: input.reminder.jobMongoId,
    publicJobId: input.reminder.publicJobId,
    employerId: input.reminder.employerId,
    generation: input.generation,
    reason: input.reason,
  });
  return "skipped";
}

/**
 * Reloads the job after the delay. A stale generation is ignored.
 * WhatsApp failure is recorded and does not throw to the queue caller
 * unless delivery itself should be retried.
 */
export async function processJobPostIncompleteReminder(
  jobMongoId: string,
  generation: number,
  deps: JobPostIncompleteReminderDeps = defaultDeps,
): Promise<JobPostIncompleteReminderProcessResult> {
  const reminder = await deps.findReminder(jobMongoId);
  if (!reminder || reminder.generation !== generation) {
    console.info("[JobPostIncompleteReminder] stale reminder skipped", {
      jobMongoId,
      generation,
      currentGeneration: reminder?.generation ?? null,
    });
    return "skipped";
  }
  if (reminder.status === "sent" || reminder.status.startsWith("skipped_")) {
    console.info("[JobPostIncompleteReminder] duplicate reminder skipped", {
      jobMongoId,
      publicJobId: reminder.publicJobId,
      generation,
      status: reminder.status,
    });
    return "skipped";
  }

  const claimed = await deps.claim({ jobMongoId, generation });
  if (!claimed) {
    console.info("[JobPostIncompleteReminder] duplicate reminder skipped", {
      jobMongoId,
      publicJobId: reminder.publicJobId,
      generation,
    });
    return "skipped";
  }

  try {
    const job = await deps.loadJob(jobMongoId);
    if (!job) {
      return skipReminder({
        deps,
        reminder,
        generation,
        status: "skipped_ineligible",
        reason: "job_missing",
      });
    }
    const employerId = persistedEmployerId(job.employerId);
    if (!employerId || employerId !== reminder.employerId) {
      return skipReminder({
        deps,
        reminder,
        generation,
        status: "skipped_ineligible",
        reason: employerId ? "employer_changed" : "employer_missing",
      });
    }
    if (String(job.status ?? "") !== "draft") {
      return skipReminder({
        deps,
        reminder,
        generation,
        status: "skipped_ineligible",
        reason: "job_not_draft",
      });
    }
    if (!isJobDraftIncomplete(job)) {
      return skipReminder({
        deps,
        reminder,
        generation,
        status: "skipped_complete",
        reason: "job_complete",
      });
    }

    const employer = await deps.loadEmployer(employerId);
    const phoneNumber = employer?.whatsappNumber?.trim() ?? "";
    if (!phoneNumber) {
      return skipReminder({
        deps,
        reminder,
        generation,
        status: "skipped_ineligible",
        reason: "whatsapp_missing",
      });
    }

    const result = await deps.enqueueNotification({
      event: "JOB_POST_INCOMPLETE",
      entityId: jobMongoId,
      phoneNumber,
      employerName: resolveEmployerRegistrationDisplayName(employer ?? {}),
      preferredLanguage: "en",
      idempotencyScope: reminderGenerationScope(generation),
    });
    if (result === "skipped_unconfigured") {
      await deps.markStatus({
        jobMongoId,
        generation,
        status: "failed",
        lastError: "template_unconfigured",
      });
      return "failed";
    }
    await deps.markStatus({
      jobMongoId,
      generation,
      status: "sent",
    });
    console.info("[JobPostIncompleteReminder] dispatched", {
      jobMongoId,
      publicJobId: reminder.publicJobId,
      employerId,
      generation,
      template: "job_post_incomplete",
      language: "en",
      result,
    });
    return "sent";
  } catch (error) {
    console.error("[JobPostIncompleteReminder] delivery failed", {
      jobMongoId,
      publicJobId: reminder.publicJobId,
      generation,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
    await deps.markStatus({
      jobMongoId,
      generation,
      status: "failed",
      lastError: error instanceof Error ? error.message : "reminder_failed",
    });
    return "failed";
  }
}

export async function processDueJobPostIncompleteReminders(
  now = new Date(),
): Promise<void> {
  const due = await findDueJobPostIncompleteReminders(now);
  for (const reminder of due) {
    await processJobPostIncompleteReminder(
      reminder.jobMongoId,
      reminder.generation,
    );
  }
}
