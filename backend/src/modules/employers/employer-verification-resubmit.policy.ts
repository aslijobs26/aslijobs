export type EmployerResubmitSnapshot = {
  accountType?: string | null;
  isProfileComplete?: boolean;
  registrationStatus?: string | null;
  isWhatsappVerified?: boolean;
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

/**
 * Same required profile facts as company/individual completion.
 * Returns field errors when resubmission must stay rejected.
 */
export function employerResubmitFieldErrors(
  employer: EmployerResubmitSnapshot,
  documentCount: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const accountType = text(employer.accountType);

  if (employer.isWhatsappVerified !== true) {
    errors.whatsappNumber = "Verify your WhatsApp number before resubmitting.";
  }
  // Completion flags can stay stale after a document-only rejection.
  // Required facts below are the gate; a successful resubmit refreshes the flags.
  if (documentCount < 1) {
    errors.document = "Upload the required verification document.";
  }

  if (accountType === "individual") {
    const personName = [text(employer.firstName), text(employer.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!text(employer.establishmentName) && !personName) {
      errors.establishmentName = "Establishment or name is required.";
    }
  } else if (!text(employer.companyName)) {
    errors.companyName = "Company name is required.";
  }

  if (accountType === "company") {
    if (!text(employer.industry)) {
      errors.industry = "Industry is required.";
    }
    if (!text(employer.businessCategory)) {
      errors.businessCategory = "Business category is required.";
    }
  }

  if (!text(employer.companyAddress)) {
    errors.companyAddress = "Address is required.";
  }
  if (!text(employer.pincode)) {
    errors.pincode = "Pincode is required.";
  }
  if (!text(employer.city)) {
    errors.city = "City is required.";
  }
  if (!text(employer.state)) {
    errors.state = "State is required.";
  }

  return errors;
}

/**
 * A rejected employer stays rejected until they submit again.
 * Document replacement alone must not approve them or skip that submit.
 */
export function documentUploadLeavesEmployerRejected(
  verificationStatus: string | null | undefined,
): boolean {
  return String(verificationStatus ?? "").toLowerCase() === "rejected";
}

/**
 * Uploading or replacing a document stores the file only.
 * Operations review starts when registration is already submitted, or when
 * the employer explicitly submits or resubmits verification.
 */
export function shouldQueueVerificationOnDocumentUpload(input: {
  verificationStatus?: string | null;
  registrationStatus?: string | null;
}): boolean {
  if (documentUploadLeavesEmployerRejected(input.verificationStatus)) {
    return false;
  }
  return String(input.registrationStatus ?? "").toLowerCase() === "completed";
}
