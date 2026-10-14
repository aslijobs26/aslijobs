import { evaluateJobSeekerProfileCompletion } from "../../job-seekers/job-seeker-profile-completion.js";
import type { JobSeekerProfileCompletionSource } from "../../job-seekers/job-seeker-profile-completion.js";

const MINUTES_TO_MS = 60_000;
const DUE_TOLERANCE_MS = 1_000;

export type JobSeekerProfileCompletionReminderSnapshot =
  JobSeekerProfileCompletionSource & {
    whatsappNumber?: string | null;
    whatsappLanguage?: string | null;
    accountStatus?: string | null;
    registrationStatus?: string | null;
  };

/**
 * Converts the configured delay minutes into milliseconds.
 * There is no separate fixed delay.
 */
export function jobSeekerProfileCompletionReminderDelayMs(
  delayMinutes: number,
): number {
  const minutes = Number.isFinite(delayMinutes)
    ? Math.max(1, Math.trunc(delayMinutes))
    : 30;
  return minutes * MINUTES_TO_MS;
}

export function isJobSeekerProfileCompletionReminderDue(
  dueAt: Date,
  now: Date,
): boolean {
  return dueAt.getTime() - now.getTime() <= DUE_TOLERANCE_MS;
}

/**
 * Rechecks the persisted job seeker. A complete, blocked, unverified,
 * or unreachable account must not receive the reminder.
 */
export function shouldSendJobSeekerProfileCompletionReminder(
  seeker: JobSeekerProfileCompletionReminderSnapshot | null,
): boolean {
  if (!seeker) {
    return false;
  }
  if (seeker.accountStatus === "blocked" || seeker.accountStatus === "suspended") {
    return false;
  }
  if (seeker.isWhatsappVerified !== true) {
    return false;
  }
  if (!seeker.whatsappNumber?.trim()) {
    return false;
  }
  if (seeker.registrationStatus === "COMPLETED") {
    return false;
  }
  return !evaluateJobSeekerProfileCompletion(seeker).isComplete;
}
