export function employerInboxName(employer: {
  accountType?: string;
  companyName?: string;
  establishmentName?: string;
  firstName?: string;
  lastName?: string;
}): string {
  const person = [employer.firstName, employer.lastName]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  const business =
    employer.accountType === "individual"
      ? employer.establishmentName?.trim() || employer.companyName?.trim() || ""
      : employer.companyName?.trim() || employer.establishmentName?.trim() || "";
  if (business && person && business.toLowerCase() !== person.toLowerCase()) {
    return `${business} · ${person}`;
  }
  return business || person;
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
  const employerParts = employer.split("·").map((part) => part.trim().toLowerCase());
  if (
    employer.toLowerCase() === seeker.toLowerCase() ||
    employerParts.includes(seeker.toLowerCase())
  ) {
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
