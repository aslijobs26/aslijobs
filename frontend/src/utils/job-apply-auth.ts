import { ROUTES } from "@/constants/routes";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import {
  clearJobSeekerAuthSession,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
import { buildJobApplyWhatsAppUrl } from "@/utils/job-search-whatsapp";
import { buildJobSeekerLoginHref } from "@/utils/safe-return-url";
import { showAppToast } from "@/utils/share-job";

type JwtPayload = {
  role?: unknown;
  sub?: unknown;
  exp?: unknown;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = globalThis.atob(padded);
    const payload = JSON.parse(json) as JwtPayload;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function isExpired(exp: unknown): boolean {
  const expirySeconds = typeof exp === "number" ? exp : Number(exp);
  if (!Number.isFinite(expirySeconds)) {
    // Fail closed: missing/invalid expiry is not a valid session.
    return true;
  }

  return expirySeconds * 1000 <= Date.now();
}

function isAuthenticatedJobSeeker(): boolean {
  const token = getJobSeekerAccessToken()?.trim();
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    clearJobSeekerAuthSession();
    return false;
  }

  if (payload.role !== "job_seeker") {
    clearJobSeekerAuthSession();
    return false;
  }

  if (typeof payload.sub !== "string" || !payload.sub.trim()) {
    clearJobSeekerAuthSession();
    return false;
  }

  if (isExpired(payload.exp)) {
    clearJobSeekerAuthSession();
    return false;
  }

  return true;
}

function isEmployerSessionPresent(): boolean {
  const token = getEmployerAccessToken()?.trim();
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (payload?.role === "employer" && !isExpired(payload.exp)) {
    return true;
  }

  // Any employer token key presence means this browser is in employer mode.
  return true;
}

function buildApplyReturnUrl(jobId: string): string {
  if (typeof window === "undefined") {
    return ROUTES.jobPublic(jobId);
  }

  const { pathname, search } = window.location;

  if (pathname === ROUTES.FIND_JOBS) {
    const params = new URLSearchParams(search);
    params.set("job", jobId);
    const query = params.toString();
    return `${ROUTES.FIND_JOBS}?${query}`;
  }

  const current = `${pathname}${search}`;
  return current || ROUTES.jobPublic(jobId);
}

export type ProtectedApplyInput = {
  applyWhatsAppNumber: string | null | undefined;
  jobTitle: string;
  companyName: string;
  jobId: string;
};

/**
 * Single protected Apply Now entry point for the whole app.
 * WhatsApp URL is created and opened ONLY after Job Seeker auth succeeds.
 * UI components must call this function and must never open WhatsApp themselves.
 */
export function protectedApply(input: ProtectedApplyInput): void {
  // 1) Auth check — stop immediately if not a Job Seeker.
  if (!isAuthenticatedJobSeeker()) {
    if (isEmployerSessionPresent()) {
      showAppToast(
        "You are logged in as an Employer. Please login with a Job Seeker account to apply.",
        "error",
        3500,
      );
      return;
    }

    showAppToast("Please login as a Job Seeker to apply.", "error", 3200);
    window.location.assign(
      buildJobSeekerLoginHref(buildApplyReturnUrl(input.jobId)),
    );
    return;
  }

  // 2) Role confirmed as Job Seeker — only now build WhatsApp URL.
  const whatsappUrl = buildJobApplyWhatsAppUrl({
    applyWhatsAppNumber: input.applyWhatsAppNumber,
    jobTitle: input.jobTitle,
    companyName: input.companyName,
    jobId: input.jobId,
  });

  if (!whatsappUrl) {
    showAppToast("Apply is unavailable for this job.", "error", 2800);
    return;
  }

  // 3) Open WhatsApp only after auth + role validation.
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

/** @deprecated Use protectedApply */
export const handleProtectedJobApply = (
  options: ProtectedApplyInput & {
    returnUrl?: string;
    onRedirectToLogin?: (loginHref: string) => void;
  },
): void => {
  protectedApply({
    applyWhatsAppNumber: options.applyWhatsAppNumber,
    jobTitle: options.jobTitle,
    companyName: options.companyName,
    jobId: options.jobId,
  });
};
