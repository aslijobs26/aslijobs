type PublicJobRecruiterSource = {
  contactPersonName?: string | null;
  applyWhatsAppNumber?: string | null;
  contactMobile?: string | null;
  contactEmail?: string | null;
};

export type PublicJobRecruiterDetails = {
  name: string;
  whatsapp: string;
  email: string;
  hasDetails: boolean;
};

export function getPublicJobRecruiterDetails(
  job: PublicJobRecruiterSource,
): PublicJobRecruiterDetails {
  const name = job.contactPersonName?.trim() ?? "";
  const whatsapp =
    job.applyWhatsAppNumber?.trim() || job.contactMobile?.trim() || "";
  const email = job.contactEmail?.trim() ?? "";

  return {
    name,
    whatsapp,
    email,
    hasDetails: Boolean(name || whatsapp || email),
  };
}
