import { ROUTES } from "@/constants/routes";
import { applyToJob } from "@/services/job-seeker-apply.service";
import {
  buildApplicationSuccessHref,
  storeApplicationSuccessWhatsAppContext,
} from "@/utils/application-success";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import {
  clearJobSeekerAuthSession,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
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

function getApplyErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "We couldn't submit your application right now. Please try again.";
}

export type ProtectedApplyInput = {
  applyWhatsAppNumber: string | null | undefined;
  jobTitle: string;
  companyName: string;
  jobId: string;
};

export type ProtectedApplyResult =
  | { status: "redirected_to_login" }
  | { status: "blocked_employer" }
  | { status: "error"; message: string }
  | {
      status: "success";
      applicationId: string;
      jobId: string;
    };

/**
 * Single protected Apply Now entry point for the whole app.
 * Persists application + resume snapshot, then navigates to the success page.
 * WhatsApp is never opened automatically.
 */
export async function protectedApply(
  input: ProtectedApplyInput,
): Promise<ProtectedApplyResult> {
  if (!isAuthenticatedJobSeeker()) {
    if (isEmployerSessionPresent()) {
      showAppToast(
        "You are logged in as an Employer. Please login with a Job Seeker account to apply.",
        "error",
        3500,
      );
      return { status: "blocked_employer" };
    }

    showAppToast("Please login as a Job Seeker to apply.", "error", 3200);
    window.location.assign(
      buildJobSeekerLoginHref(buildApplyReturnUrl(input.jobId)),
    );
    return { status: "redirected_to_login" };
  }

  try {
    const result = await applyToJob(input.jobId);
    const applicationId = result.application.id;
    const jobId = result.application.publicJobId || input.jobId;

    if (input.applyWhatsAppNumber?.trim()) {
      storeApplicationSuccessWhatsAppContext({
        applicationId,
        jobId,
        applyWhatsAppNumber: input.applyWhatsAppNumber.trim(),
        jobTitle: input.jobTitle,
        companyName: input.companyName,
      });
    }

    window.location.assign(
      buildApplicationSuccessHref({ applicationId, jobId }),
    );

    return {
      status: "success",
      applicationId,
      jobId,
    };
  } catch (error) {
    const message = getApplyErrorMessage(error);
    showAppToast(message, "error", 3500);
    return { status: "error", message };
  }
}

/** @deprecated Use protectedApply */
export const handleProtectedJobApply = (
  options: ProtectedApplyInput & {
    returnUrl?: string;
    onRedirectToLogin?: (loginHref: string) => void;
  },
): void => {
  void protectedApply({
    applyWhatsAppNumber: options.applyWhatsAppNumber,
    jobTitle: options.jobTitle,
    companyName: options.companyName,
    jobId: options.jobId,
  });
};
