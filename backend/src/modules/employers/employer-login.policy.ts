/**
 * WhatsApp-verified employers may log in before company-profile is finished.
 * The profile-completion reminder sends them to login; requiring
 * registrationStatus === "completed" made that flow a dead end.
 */
const LOGIN_ALLOWED_REGISTRATION_STATUSES = new Set([
  "otp_verified",
  "document_uploaded",
  "profile_incomplete",
  "completed",
]);

export function isEmployerEligibleForLogin(employer: {
  status?: string | null;
  isWhatsappVerified?: boolean;
  registrationStatus?: string | null;
}): boolean {
  if (employer.status && employer.status !== "active") {
    return false;
  }

  if (employer.isWhatsappVerified !== true) {
    return false;
  }

  return LOGIN_ALLOWED_REGISTRATION_STATUSES.has(
    employer.registrationStatus ?? "",
  );
}
