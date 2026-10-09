import { parseJobContentLanguage } from "../../jobs/job-content-language.js";
import {
  WHATSAPP_NOTIFICATION_EVENTS,
  WHATSAPP_NOTIFICATION_TEMPLATES,
  type WhatsAppNotificationEvent,
  type WhatsAppNotificationTemplateConfig,
} from "./whatsapp-notification.constants.js";
import type { WhatsAppNotificationPayload } from "./whatsapp-notification.types.js";

export function isWhatsAppNotificationEvent(
  value: string,
): value is WhatsAppNotificationEvent {
  return (WHATSAPP_NOTIFICATION_EVENTS as readonly string[]).includes(value);
}

export function getWhatsAppNotificationTemplate(
  event: WhatsAppNotificationEvent,
): WhatsAppNotificationTemplateConfig | null {
  return WHATSAPP_NOTIFICATION_TEMPLATES[event] ?? null;
}

export function whatsAppNotificationIdempotencyKey(
  event: WhatsAppNotificationEvent,
  entityId: string,
  scope?: string | null,
): string {
  const base = `${event}:${entityId.trim()}`;
  const cycle = scope?.trim();
  return cycle ? `${base}:${cycle}` : base;
}

/** BullMQ custom ids cannot contain ":". */
export function whatsAppNotificationQueueJobId(
  event: WhatsAppNotificationEvent,
  entityId: string,
  scope?: string | null,
): string {
  const cycle = scope?.trim().replace(/[^a-zA-Z0-9_-]/g, "") ?? "";
  return cycle
    ? `wa-notify-${event}-${entityId.trim()}-${cycle}`
    : `wa-notify-${event}-${entityId.trim()}`;
}

export function resolveWhatsAppNotificationLanguage(
  event: WhatsAppNotificationEvent,
  preferredLanguage?: string | null,
): string {
  const config = getWhatsAppNotificationTemplate(event);
  if (!config) {
    return "en";
  }

  const siteLanguage = parseJobContentLanguage(preferredLanguage) ?? "en";
  return (
    config.approvedLanguages[siteLanguage] ??
    config.approvedLanguages[config.defaultLanguage] ??
    "en"
  );
}

export function buildWhatsAppNotificationBodyParameters(
  event: WhatsAppNotificationEvent,
  payload: WhatsAppNotificationPayload,
): string[] {
  if (
    event === "EMPLOYER_ACCOUNT_CREATED" ||
    event === "EMPLOYER_PROFILE_COMPLETION_REQUIRED" ||
    event === "EMPLOYER_ACCOUNT_APPROVED" ||
    event === "EMPLOYER_ACCOUNT_REJECTED" ||
    event === "JOB_POST_SUBMITTED" ||
    event === "JOB_POST_APPROVED" ||
    event === "JOB_POST_INCOMPLETE"
  ) {
    const employerName = payload.employerName?.trim() || "Employer";
    return [employerName];
  }
  return [];
}

/**
 * URL button suffixes for templates whose CTA is a dynamic website button.
 * aslijobs_account_approved opens https://www.aslijobs.com/post-job/{{employerId}}.
 * Meta already stores the base URL, so the parameter is only the employer id.
 */
export function buildWhatsAppNotificationUrlButtonParameters(
  event: WhatsAppNotificationEvent,
  payload: WhatsAppNotificationPayload,
): string[] {
  if (event === "EMPLOYER_ACCOUNT_APPROVED" || event === "JOB_POST_INCOMPLETE") {
    const id = payload.entityId.trim();
    return id ? [id] : [];
  }
  return [];
}

export const EMPLOYER_ACCOUNT_APPROVED_POST_JOB_URL_PREFIX =
  "https://www.aslijobs.com/post-job/";

export function employerAccountApprovedPostJobUrl(employerId: string): string {
  const id = employerId.trim();
  return id ? `${EMPLOYER_ACCOUNT_APPROVED_POST_JOB_URL_PREFIX}${id}` : "";
}

/**
 * Static Resubmit Details destination already configured for the approved
 * employer_account_rejected template. The logged-in employer opens the
 * existing company profile page; no per-employer URL suffix is required.
 */
export const EMPLOYER_ACCOUNT_REJECTED_RESUBMIT_URL =
  "https://www.aslijobs.com/employer/company-profile";

export const EMPLOYER_ACCOUNT_REJECTED_RESUBMIT_PATH =
  "/employer/company-profile";

/**
 * job_post_submitted has no button. job_post_approved uses a static
 * View Job Post button, so the API must not send a URL suffix.
 */
export const JOB_POST_APPROVED_VIEW_URL =
  "https://www.aslijobs.com/employer/jobs";

export const JOB_POST_APPROVED_VIEW_PATH = "/employer/jobs";

/**
 * job_post_incomplete_ Complete Job Details button.
 * The only dynamic parameter is the draft Mongo _id.
 * The corrected Meta button base is https://www.aslijobs.com/post-job/{{1}}.
 * The template currently stored in Meta is still
 * https://www.aslijobs.com/post-job/%7B%7B1%7D%7D{{1}}, which leaves a literal
 * {{1}} in front of the job id until that button is edited and re-approved.
 */
export const JOB_POST_INCOMPLETE_EDIT_URL_PREFIX =
  "https://www.aslijobs.com/post-job/";

export const JOB_POST_INCOMPLETE_EDIT_PATH = "/post-job/";

export const JOB_POST_INCOMPLETE_APPROVED_BUTTON_URL =
  "https://www.aslijobs.com/post-job/%7B%7B1%7D%7D{{1}}";

export function jobPostIncompleteEditUrl(jobMongoId: string): string {
  const id = jobMongoId.trim();
  return id ? `${JOB_POST_INCOMPLETE_EDIT_URL_PREFIX}${id}` : "";
}

/**
 * URL the currently stored Meta button opens. This is not the corrected URL.
 * Meta still has a literal encoded {{1}} before the dynamic job id.
 */
export function composeApprovedJobPostIncompleteButtonUrl(
  jobMongoId: string,
): string {
  const id = jobMongoId.trim();
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return "";
  }
  return JOB_POST_INCOMPLETE_APPROVED_BUTTON_URL.replace(/\{\{1\}\}$/, id);
}
