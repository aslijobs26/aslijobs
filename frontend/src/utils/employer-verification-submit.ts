export type EmployerVerificationSubmitProfile = {
  accountType: string;
  isWhatsappVerified: boolean;
  verificationStatus?: string | null;
  registrationStatus?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  industry?: string | null;
  businessCategory?: string | null;
  companyAddress?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Mirrors the backend required-field and document gate. */
export function employerVerificationSubmitErrors(
  profile: EmployerVerificationSubmitProfile,
  documentCount: number,
): string[] {
  const errors: string[] = [];

  if (profile.isWhatsappVerified !== true) {
    errors.push("Verify your WhatsApp number before submitting.");
  }
  if (documentCount < 1) {
    errors.push("Upload the required verification document.");
  }

  if (profile.accountType === "individual") {
    const personName = [text(profile.firstName), text(profile.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!text(profile.establishmentName) && !personName) {
      errors.push("Establishment or name is required.");
    }
  } else if (!text(profile.companyName)) {
    errors.push("Company name is required.");
  }

  if (profile.accountType === "company") {
    if (!text(profile.industry)) {
      errors.push("Industry is required.");
    }
    if (!text(profile.businessCategory)) {
      errors.push("Business category is required.");
    }
  }

  if (!text(profile.companyAddress)) {
    errors.push("Address is required.");
  }
  if (!text(profile.pincode)) {
    errors.push("Pincode is required.");
  }
  if (!text(profile.city)) {
    errors.push("City is required.");
  }
  if (!text(profile.state)) {
    errors.push("State is required.");
  }

  return errors;
}

export function canOfferVerificationSubmit(
  profile: EmployerVerificationSubmitProfile,
): boolean {
  const status = String(profile.verificationStatus ?? "").toLowerCase();
  if (status === "verified" || status === "rejected") {
    return false;
  }
  return profile.registrationStatus !== "completed";
}
