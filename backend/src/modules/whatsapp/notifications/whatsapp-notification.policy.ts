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
    event === "EMPLOYER_ACCOUNT_REJECTED"
  ) {
    const employerName = payload.employerName?.trim() || "Employer";
    return [employerName];
  }
  return [];
}

/**
 * URL button suffixes for templates whose CTA is a dynamic website button.
 * employer_account_approved opens https://www.aslijobs.com/post-job/{{employerId}}.
 * Meta already stores the base URL, so the parameter is only the employer id.
 */
export function buildWhatsAppNotificationUrlButtonParameters(
  event: WhatsAppNotificationEvent,
  payload: WhatsAppNotificationPayload,
): string[] {
  if (event !== "EMPLOYER_ACCOUNT_APPROVED") {
    return [];
  }
  const employerId = payload.entityId.trim();
  return employerId ? [employerId] : [];
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
