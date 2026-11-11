/**
 * Clarity sends the full page URL and the destination of every clicked link,
 * and masking cannot redact either. Element attributes such as aria-label are
 * also sent as written. Signed-in areas are therefore recorded only on pages
 * reviewed for names, contact details, application ids and tokens in their
 * URLs and attributes. New signed-in pages stay unrecorded until added here.
 */
const SIGNED_IN_AREAS = [
  "/employer",
  "/job-seeker",
  "/post-job",
  "/team",
  "/team-member",
] as const;

const RECORDED_SIGNED_IN_PAGES: readonly RegExp[] = [
  /^\/employer\/(login|register|member-login|dashboard|jobs|subscription|settings|help-center|notifications|campaigns|unauthorized)$/,
  /^\/employer\/jobs\/[^/]+\/under-review$/,
  /^\/post-job(\/[^/]+)?$/,
  /^\/job-seeker\/(login|register|dashboard|profile|my-resume|saved-jobs|applied-jobs|notifications|settings|help-support)$/,
  /^\/team-member\/login$/,
];

/** Query parameters that carry application ids or invitation tokens. */
const PRIVATE_QUERY_PARAMS = [
  "token",
  "application",
  "applicationId",
  "selected",
] as const;

/**
 * WhatsApp account-approval buttons open `/post-job/<employerId>`, so a visit
 * must not begin recording there. In-app links to `/post-job/<jobId>` are fine.
 */
const POST_JOB_ROUTE_ID = /^\/post-job\/(?!success$)[^/]+$/;

const AUTH_PAGES =
  /^\/(login|employer\/(login|register|member-login)|job-seeker\/(login|register)|team-member\/login)$/;

const PAGE_TYPE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/$/, "home"],
  [/^\/jobs\/[^/]+$/, "job_detail"],
  [/^\/post-job\/success$/, "post_job_success"],
  [POST_JOB_ROUTE_ID, "post_job_edit"],
  [/^\/employer\/jobs\/[^/]+\/under-review$/, "employer_job_under_review"],
];

/** Only fixed, id-free paths become a page type. */
const STATIC_PATH = /^(\/[a-z]+(-[a-z]+)*){1,2}$/;

export type ClarityUserRole = "guest" | "employer" | "job_seeker";

export type ClarityDashboardType =
  | "public_site"
  | "auth"
  | "employer_dashboard"
  | "job_seeker_dashboard";

export type ClarityTags = {
  user_role: ClarityUserRole;
  page_type: string;
  dashboard_type: ClarityDashboardType;
};

export function normalizeClarityPath(pathname: string): string {
  const path = pathname.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

function isInArea(path: string, area: string): boolean {
  return path === area || path.startsWith(`${area}/`);
}

export function isClarityRecordableUrl(url: URL): boolean {
  if (PRIVATE_QUERY_PARAMS.some((param) => url.searchParams.has(param))) {
    return false;
  }
  const path = normalizeClarityPath(url.pathname);
  if (!SIGNED_IN_AREAS.some((area) => isInArea(path, area))) {
    return true;
  }
  return RECORDED_SIGNED_IN_PAGES.some((pattern) => pattern.test(path));
}

/** Whether Clarity may load on a page the visitor opened directly. */
export function isClarityEntryUrl(url: URL): boolean {
  return (
    isClarityRecordableUrl(url) &&
    !POST_JOB_ROUTE_ID.test(normalizeClarityPath(url.pathname))
  );
}

/**
 * Clarity sends `document.referrer` with every page of a visit. A page opened
 * from an excluded page (new tab, reload chain) would carry that page's URL.
 */
export function isClaritySafeReferrer(referrer: string, origin: string): boolean {
  if (referrer === "") {
    return true;
  }
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return false;
  }
  return url.origin !== origin || isClarityRecordableUrl(url);
}

export function clarityDashboardType(pathname: string): ClarityDashboardType {
  const path = normalizeClarityPath(pathname);
  if (AUTH_PAGES.test(path)) {
    return "auth";
  }
  if (isInArea(path, "/employer") || isInArea(path, "/post-job")) {
    return "employer_dashboard";
  }
  if (isInArea(path, "/job-seeker")) {
    return "job_seeker_dashboard";
  }
  return "public_site";
}

export function clarityPageType(pathname: string): string {
  const path = normalizeClarityPath(pathname);
  for (const [pattern, pageType] of PAGE_TYPE_PATTERNS) {
    if (pattern.test(path)) {
      return pageType;
    }
  }
  if (!STATIC_PATH.test(path)) {
    return "other";
  }
  return path.slice(1).replace(/[/-]/g, "_");
}

export function clarityTagsFor(
  pathname: string,
  userRole: ClarityUserRole,
): ClarityTags {
  return {
    user_role: userRole,
    page_type: clarityPageType(pathname),
    dashboard_type: clarityDashboardType(pathname),
  };
}
