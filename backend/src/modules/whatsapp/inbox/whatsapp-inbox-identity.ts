import {
  EMPLOYER_ACCOUNT_TYPES,
  isBusinessEmployerAccountType,
} from "../../../constants/employer.constants.js";

export type EmployerInboxIdentityInput = {
  accountType?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type EmployerInboxIdentity = {
  /** Company/consultancy name, or the individual's registered personal name. */
  primaryName: string;
  /**
   * Contact person for company and consultancy accounts only.
   * Empty for individual accounts and when the person matches the primary name.
   */
  secondaryName: string;
};

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function personName(employer: EmployerInboxIdentityInput): string {
  return [text(employer.firstName), text(employer.lastName)]
    .filter(Boolean)
    .join(" ");
}

function sameName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isBusinessEmployerAccount(accountType: string | null | undefined): boolean {
  const key = accountType?.trim().toLowerCase() ?? "";
  if (!(EMPLOYER_ACCOUNT_TYPES as readonly string[]).includes(key)) {
    return false;
  }
  return isBusinessEmployerAccountType(
    key as (typeof EMPLOYER_ACCOUNT_TYPES)[number],
  );
}

/**
 * Authoritative Inbox name parts for an employer account.
 * Company and consultancy accounts lead with the registered business name.
 * Individual accounts lead with the registered person and have no secondary line.
 */
export function resolveEmployerInboxIdentity(
  employer: EmployerInboxIdentityInput,
): EmployerInboxIdentity {
  const person = personName(employer);
  const companyName = text(employer.companyName);
  const establishmentName = text(employer.establishmentName);

  if (isBusinessEmployerAccount(employer.accountType)) {
    const primaryName = companyName || establishmentName || person;
    const secondaryName =
      person && primaryName && !sameName(person, primaryName) ? person : "";
    return { primaryName, secondaryName };
  }

  // Individual: personal name is primary. Establishment/company is not promoted
  // to a company heading and is not shown as a secondary contact line.
  const primaryName = person || establishmentName || companyName;
  return { primaryName, secondaryName: "" };
}

/** Compact single-line label for lists, search hydration, and stored displayName. */
export function employerInboxName(employer: EmployerInboxIdentityInput): string {
  return resolveEmployerInboxIdentity(employer).primaryName;
}

export function seekerInboxName(fullName: string | undefined): string {
  return fullName?.trim() ?? "";
}

export function combinedInboxDisplayName(input: {
  ambiguous: boolean;
  employerName: string;
  seekerName: string;
  phoneNational: string;
}): string {
  if (input.ambiguous) {
    return "Multiple accounts share this number";
  }

  const employer = input.employerName.trim();
  const seeker = input.seekerName.trim();
  if (!employer) return seeker || input.phoneNational;
  if (!seeker) return employer;
  if (sameName(employer, seeker)) {
    return employer;
  }
  return `${employer} · ${seeker}`;
}

export function registeredAccountStatusLabel(input: {
  participantType: "job_seeker" | "employer";
  registrationStatus?: string;
  verificationStatus?: string;
}): string {
  if (input.participantType === "job_seeker") {
    if (input.registrationStatus === "COMPLETED") return "Registered";
    if (input.registrationStatus === "PENDING") return "Registration pending";
    return "";
  }

  const verification = input.verificationStatus?.trim() ?? "";
  const registration = input.registrationStatus?.trim() ?? "";
  if (verification === "verified") return "Verified";
  if (verification === "rejected") return "Verification rejected";
  if (registration === "completed") return "Registered";
  if (registration === "pending_otp" || registration === "otp_sent") {
    return "OTP pending";
  }
  if (registration === "otp_verified") return "WhatsApp verified";
  if (registration === "profile_incomplete") return "Profile incomplete";
  if (registration === "document_uploaded") return "Documents uploaded";
  if (verification === "pending") return "Verification pending";
  return "";
}

export function phoneLookupVariants(nationalPhone: string): string[] {
  const digits = nationalPhone.replace(/\D/g, "");
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  return [national, `91${national}`, `+91${national}`, `0${national}`];
}
