import type {
  ApplicationNotificationInterviewSummary,
  NotificationRecipientType,
  NotificationTemplate,
  NotificationType,
} from "./notification.types.js";

/** Metadata key holding the dynamic values used to render translated copy. */
export const NOTIFICATION_TEMPLATE_PARAMS_KEY = "templateParams";

/**
 * Seeker rows shown in the employer conversation whose employer-facing copy
 * has no dynamic values (see `employerConversationCopy`).
 */
const STATIC_MIRROR_TYPES: ReadonlySet<NotificationType> = new Set([
  "application_submitted",
  "application_viewed",
  "application_under_review",
  "application_shortlisted",
  "interview_completed",
  "offer_accepted",
  "offer_declined",
  "application_selected",
  "application_joined",
  "application_did_not_join",
  "application_rejected",
  "application_withdrawn",
]);

/** Drops empty values so translated copy can supply its own fallbacks. */
export function buildTemplateParams(
  values: Record<string, string | null | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) {
      params[key] = trimmed;
    }
  }
  return params;
}

export function interviewTemplateParams(
  interview: ApplicationNotificationInterviewSummary | undefined,
): Record<string, string> {
  if (!interview) {
    return {};
  }
  return buildTemplateParams({
    date: interview.date,
    time: interview.time,
    mode: interview.mode,
    meetingLink: interview.mode === "online" ? interview.meetingLink : "",
    venue: interview.mode === "offline" ? interview.venue : "",
  });
}

export function readTemplateParams(
  metadata: unknown,
): Record<string, string> | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const raw = (metadata as Record<string, unknown>)[
    NOTIFICATION_TEMPLATE_PARAMS_KEY
  ];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }
  return params;
}

/**
 * Render-time localisation hint. Stored title/body remain the English source
 * of truth; `params` is null for rows created before params were recorded.
 */
export function resolveNotificationTemplate(input: {
  recipientType?: NotificationRecipientType;
  type: NotificationType;
  metadata?: unknown;
}): NotificationTemplate {
  const audience = input.recipientType === "job_seeker" ? "seeker" : "employer";
  return {
    key: `${audience}.${input.type}`,
    params: readTemplateParams(input.metadata),
  };
}

/** Template for a seeker row re-worded for the employer conversation. */
export function resolveMirrorTemplate(input: {
  type: NotificationType;
  metadata?: unknown;
}): NotificationTemplate {
  return {
    key: `mirror.${input.type}`,
    params: STATIC_MIRROR_TYPES.has(input.type)
      ? {}
      : readTemplateParams(input.metadata),
  };
}
