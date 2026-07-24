export function buildJobApplyWhatsAppUrl(options: {
  applyWhatsAppNumber: string | null | undefined;
  jobTitle: string;
  companyName: string;
  jobId: string;
}): string | null {
  if (!options.applyWhatsAppNumber) {
    return null;
  }

  const digits = options.applyWhatsAppNumber.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  const phone = digits.length === 10 ? `91${digits}` : digits;
  const message = [
    `Hi, I am interested in applying for ${options.jobTitle}`,
    `at ${options.companyName}.`,
    `Job ID: ${options.jobId}`,
  ].join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Availability check only — does not build a WhatsApp URL. */
export function canApplyViaWhatsApp(
  applyWhatsAppNumber: string | null | undefined,
): boolean {
  if (!applyWhatsAppNumber) {
    return false;
  }

  return applyWhatsAppNumber.replace(/\D/g, "").length >= 10;
}
