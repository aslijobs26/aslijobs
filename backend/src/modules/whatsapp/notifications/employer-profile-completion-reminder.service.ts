import { env } from "../../../config/env.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { resolveEmployerRegistrationDisplayName } from "../../operations/registration-awareness/operations-registration-awareness.service.js";
import {
  claimEmployerProfileCompletionReminder,
  findDueEmployerProfileCompletionReminderIds,
  markEmployerProfileCompletionReminderStatus,
  scheduleEmployerProfileCompletionReminderRecord,
} from "./employer-profile-completion-reminder.model.js";
import {
  employerProfileCompletionReminderDelayMs,
  shouldSendEmployerProfileCompletionReminder,
  type EmployerProfileCompletionSnapshot,
} from "./employer-profile-completion-reminder.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

export type EmployerProfileCompletionReminderProcessResult =
  | "sent"
  | "skipped"
  | "failed";

export type ProcessEmployerProfileCompletionReminderDeps = {
  claim: (employerId: string) => Promise<boolean>;
  loadEmployer: (
    employerId: string,
  ) => Promise<EmployerProfileCompletionSnapshot | null>;
  enqueueNotification: (payload: {
    event: "EMPLOYER_PROFILE_COMPLETION_REQUIRED";
    entityId: string;
    phoneNumber: string;
    employerName: string;
    preferredLanguage: "en";
  }) => Promise<WhatsAppNotificationEnqueueResult>;
  markStatus: typeof markEmployerProfileCompletionReminderStatus;
};

const defaultProcessDeps: ProcessEmployerProfileCompletionReminderDeps = {
  claim: claimEmployerProfileCompletionReminder,
  loadEmployer: loadEmployerForReminder,
  enqueueNotification: enqueueWhatsAppNotification,
  markStatus: markEmployerProfileCompletionReminderStatus,
};

export function getEmployerProfileCompletionReminderDelayMs(): number {
  return employerProfileCompletionReminderDelayMs(
    env.EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
  );
}

async function loadEmployerForReminder(
  employerId: string,
): Promise<EmployerProfileCompletionSnapshot | null> {
  const employer = await EmployerModel.findById(employerId)
    .select(
      "isProfileComplete registrationStatus whatsappNumber companyName establishmentName firstName lastName",
    )
    .lean();
  return employer;
}

/**
 * Persists a delayed reminder after OTP verification.
 * Never throws to the employer registration caller.
 */
export async function enqueueEmployerProfileCompletionReminder(
  employerId: string,
): Promise<"scheduled" | "already_scheduled"> {
  const dueAt = new Date(Date.now() + getEmployerProfileCompletionReminderDelayMs());
  return scheduleEmployerProfileCompletionReminderRecord({
    employerId: employerId.trim(),
    dueAt,
  });
}

export function scheduleEmployerProfileCompletionReminder(
  employerId: string,
): void {
  void enqueueEmployerProfileCompletionReminder(employerId).catch((error) => {
    console.error("[EmployerProfileReminder] schedule rejected", {
      employerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

/**
 * Re-reads the latest employer profile before sending.
 * WhatsApp failures are isolated from the employer account.
 */
export async function processEmployerProfileCompletionReminder(
  employerId: string,
  deps: ProcessEmployerProfileCompletionReminderDeps = defaultProcessDeps,
): Promise<EmployerProfileCompletionReminderProcessResult> {
  const claimed = await deps.claim(employerId);
  if (!claimed) {
    return "skipped";
  }

  try {
    const employer = await deps.loadEmployer(employerId);
    if (!shouldSendEmployerProfileCompletionReminder(employer)) {
      await deps.markStatus({
        employerId,
        status: "skipped_complete",
      });
      console.info("[EmployerProfileReminder] skipped complete or missing profile", {
        employerId,
      });
      return "skipped";
    }

    const result = await deps.enqueueNotification({
      event: "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
      entityId: employerId,
      phoneNumber: employer?.whatsappNumber?.trim() ?? "",
      employerName: resolveEmployerRegistrationDisplayName({
        companyName: employer?.companyName,
        establishmentName: employer?.establishmentName,
        firstName: employer?.firstName,
        lastName: employer?.lastName,
      }),
      preferredLanguage: "en",
    });

    if (result === "skipped_duplicate") {
      await deps.markStatus({
        employerId,
        status: "sent",
      });
      return "skipped";
    }

    if (result === "skipped_unconfigured") {
      await deps.markStatus({
        employerId,
        status: "failed",
        lastError: "template_unconfigured",
      });
      return "failed";
    }

    await deps.markStatus({
      employerId,
      status: "sent",
    });
    return "sent";
  } catch (error) {
    const lastError = error instanceof Error ? error.message : "reminder_failed";
    console.error("[EmployerProfileReminder] delivery failed", {
      employerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
    await deps.markStatus({
      employerId,
      status: "failed",
      lastError,
    });
    return "failed";
  }
}

export async function processDueEmployerProfileCompletionReminders(
  now = new Date(),
): Promise<void> {
  const dueIds = await findDueEmployerProfileCompletionReminderIds(now);
  for (const employerId of dueIds) {
    await processEmployerProfileCompletionReminder(employerId);
  }
}
