import { ROUTES } from "@/constants/routes";

export const APPLICATION_SUCCESS_STORAGE_KEY =
  "aslijobs.application-success.v1" as const;

export type ApplicationSuccessWhatsAppContext = {
  applicationId: string;
  jobId: string;
  applyWhatsAppNumber: string;
  jobTitle: string;
  companyName: string;
};

export function buildApplicationSuccessHref(input: {
  applicationId: string;
  jobId: string;
}): string {
  const params = new URLSearchParams({
    applicationId: input.applicationId,
    jobId: input.jobId,
  });
  return `${ROUTES.JOB_SEEKER_APPLICATION_SUCCESS}?${params.toString()}`;
}

export function storeApplicationSuccessWhatsAppContext(
  context: ApplicationSuccessWhatsAppContext,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    APPLICATION_SUCCESS_STORAGE_KEY,
    JSON.stringify(context),
  );
}

export function getApplicationSuccessWhatsAppContext(
  applicationId: string,
): ApplicationSuccessWhatsAppContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(APPLICATION_SUCCESS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ApplicationSuccessWhatsAppContext;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.applicationId !== applicationId ||
      typeof parsed.applyWhatsAppNumber !== "string" ||
      !parsed.applyWhatsAppNumber.trim()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
