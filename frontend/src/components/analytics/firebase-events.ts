import { WHATSAPP_CONTACT_URL, WHATSAPP_JOIN_URL } from "@/constants/cta";
import { ROUTES } from "@/constants/routes";
import { isSafeFreeText } from "./analytics-url";
import type { AnalyticsEventName } from "./track-analytics-event";

export type FirebaseEventParams = Record<string, string | number>;

export type FirebaseEvent = {
  name: string;
  params: FirebaseEventParams;
};

export type TrackedAnalyticsEvent = {
  eventName: AnalyticsEventName;
  path?: string;
  portal?: "public_site" | "employer" | "job_seeker";
  audience?: "job_seeker" | "employer" | "unknown";
};

/** Google Analytics drops parameter values longer than 100 characters. */
const MAX_PARAM_LENGTH = 100;

const SEARCH_FILTER_PARAMS = [
  ["state", "location_state"],
  ["city", "location_city"],
  ["jobType", "job_type"],
  ["experience", "experience"],
  ["workMode", "work_mode"],
] as const;

const CTA_BY_PATH: Readonly<Record<string, string>> = {
  [ROUTES.POST_JOB]: "post_job",
  [ROUTES.EMPLOYER_POST_A_JOB]: "post_job",
  [ROUTES.EMPLOYER_REGISTER]: "employer_register",
  [ROUTES.EMPLOYER_LOGIN]: "employer_login",
  [ROUTES.JOB_SEEKER_REGISTER]: "job_seeker_register",
  [ROUTES.JOB_SEEKER_LOGIN]: "job_seeker_login",
  [ROUTES.TEAM_MEMBER_LOGIN]: "team_member_login",
  [ROUTES.CONTACT]: "contact",
  [ROUTES.PRICING_PLANS]: "pricing",
};

/** Only AsliJobs' own WhatsApp entry points, never a candidate's number. */
const ASLIJOBS_WHATSAPP_LINKS = [WHATSAPP_JOIN_URL, WHATSAPP_CONTACT_URL]
  .map(linkTarget)
  .filter((target): target is string => target !== null);

function linkTarget(href: string): string | null {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

function clip(value: string): string {
  return value.trim().slice(0, MAX_PARAM_LENGTH);
}

function userRoleFor(event: TrackedAnalyticsEvent): string | null {
  const role =
    event.portal && event.portal !== "public_site" ? event.portal : event.audience;
  return role === "employer" || role === "job_seeker" ? role : null;
}

function jobIdFrom(path: string | undefined): FirebaseEventParams {
  const jobId = path?.match(/^\/jobs\/([^/?#]+)/)?.[1];
  return jobId ? { job_id: clip(decodeURIComponent(jobId)) } : {};
}

function searchParamsFrom(url: URL): FirebaseEventParams {
  const params: FirebaseEventParams = {};
  const term = url.searchParams.get("q") ?? url.searchParams.get("search") ?? "";
  if (term.trim() && isSafeFreeText(term)) {
    params.search_term = clip(term);
  }
  for (const [queryKey, paramName] of SEARCH_FILTER_PARAMS) {
    const value = url.searchParams.get(queryKey);
    if (value?.trim()) {
      params[paramName] = clip(value);
    }
  }
  return params;
}

/**
 * Maps an event from `trackAnalyticsEvent` to Google Analytics. Page views are
 * sent separately by `FirebaseAnalytics`, so they are skipped here.
 */
export function firebaseEventFor(
  event: TrackedAnalyticsEvent,
  currentUrl: URL,
): FirebaseEvent | null {
  const role = userRoleFor(event);
  const withRole = (params: FirebaseEventParams): FirebaseEventParams =>
    role ? { ...params, user_role: role } : params;

  switch (event.eventName) {
    case "page_view":
      return null;
    case "registration_completed":
      return { name: "sign_up", params: withRole({ method: "whatsapp_otp" }) };
    case "job_search":
      return { name: "search", params: searchParamsFrom(currentUrl) };
    case "job_detail_viewed":
    case "job_apply_started":
    case "job_application_submitted":
      return { name: event.eventName, params: withRole(jobIdFrom(event.path)) };
    default:
      return { name: event.eventName, params: withRole({}) };
  }
}

/** The CTA a link stands for, or null when it is ordinary navigation. */
export function ctaNameForLink(url: URL, siteOrigin: string): string | null {
  if (url.origin === siteOrigin) {
    return CTA_BY_PATH[url.pathname.replace(/\/+$/, "") || "/"] ?? null;
  }
  const target = linkTarget(url.href);
  return target && ASLIJOBS_WHATSAPP_LINKS.includes(target) ? "whatsapp" : null;
}

/**
 * Saving the first post-job draft swaps `/post-job` for `/post-job/<draftId>`
 * on the same screen, which is not a new page view.
 */
export function isSamePageView(previousPath: string, nextPath: string): boolean {
  return (
    previousPath === nextPath ||
    (previousPath === ROUTES.POST_JOB && /^\/post-job\/:id$/.test(nextPath))
  );
}
