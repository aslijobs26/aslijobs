import type { WhatsAppNotificationEvent } from "./whatsapp-notification.constants.js";

export type WhatsAppNotificationPayload = {
  event: WhatsAppNotificationEvent;
  entityId: string;
  phoneNumber: string;
  employerName?: string;
  /** Job title for job_application_submitted {{1}}. */
  jobTitle?: string;
  /** Company name for job_application_submitted {{2}}. */
  companyName?: string;
  /** Interview date for interview schedule templates {{3}}. */
  interviewDate?: string;
  /** Interview time for interview schedule templates {{4}}. */
  interviewTime?: string;
  /** Offline venue for interview_scheduled_offline {{5}}. */
  interviewVenue?: string;
  preferredLanguage?: string | null;
  /**
   * Dynamic URL-button suffixes. Meta stores the base URL on the template;
   * each value replaces that button's {{1}} in order.
   */
  urlButtonParameters?: string[];
  /**
   * Extra idempotency segment for events that can recur, such as a later
   * employer rejection after resubmission. Omitted events stay one-time.
   */
  idempotencyScope?: string;
};

export type WhatsAppNotificationQueueJob = {
  event: WhatsAppNotificationEvent;
  entityId: string;
  phoneNumber: string;
  templateName: string;
  languageCode: string;
  bodyParameters: string[];
  /** Present only when the approved template has a dynamic URL button. */
  urlButtonParameters?: string[];
  idempotencyScope?: string;
  idempotencyKey: string;
};

export type WhatsAppNotificationEnqueueResult =
  | "queued"
  | "skipped_duplicate"
  | "skipped_unconfigured";
