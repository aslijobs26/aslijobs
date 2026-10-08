const MINUTES_TO_MS = 60_000;

export type EmployerProfileCompletionSnapshot = {
  isProfileComplete?: boolean;
  registrationStatus?: string;
  whatsappNumber?: string;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * Converts the configured delay minutes into milliseconds.
 * The production vs test duration lives in env, not in this function.
 */
export function employerProfileCompletionReminderDelayMs(
  delayMinutes: number,
): number {
  const minutes = Number.isFinite(delayMinutes)
    ? Math.max(1, Math.trunc(delayMinutes))
    : 1;
  return minutes * MINUTES_TO_MS;
}

export function shouldSendEmployerProfileCompletionReminder(
  employer: EmployerProfileCompletionSnapshot | null,
): boolean {
  if (!employer) {
    return false;
  }
  if (employer.isProfileComplete === true) {
    return false;
  }
  if (employer.registrationStatus === "completed") {
    return false;
  }
  return Boolean(employer.whatsappNumber?.trim());
}
