import { ROUTES } from "@/constants/routes";

const MONGO_OBJECT_ID = /^[a-f0-9]{24}$/i;
const LITERAL_TEMPLATE_SLOT = /^\{\{1\}\}/;

/**
 * Meta's aslijobs_account_approved button base is
 * `https://www.aslijobs.com/post-job/%7B%7B1%7D%7D{{1}}`.
 * The encoded `{{1}}` is literal text. The real variable is appended after it,
 * so the opened path is `/post-job/{{1}}{employerId}`.
 */
export function extractPostJobRouteId(
  routeId: string | null | undefined,
): string {
  let value = routeId?.trim() ?? "";
  if (!value) {
    return "";
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) {
        break;
      }
      value = decoded;
    } catch {
      break;
    }
  }

  return value.replace(LITERAL_TEMPLATE_SLOT, "").trim();
}

/**
 * `/post-job` creates a job. `/post-job/:jobId` edits that job.
 * The account-approval button is this employer's id, not a job id.
 */
export function isEmployerAccountPostJobLink(
  routeId: string | null | undefined,
  employerId: string | null | undefined,
): boolean {
  const route = extractPostJobRouteId(routeId).toLowerCase();
  const employer = employerId?.trim().toLowerCase() ?? "";
  if (!route || !employer || !MONGO_OBJECT_ID.test(route)) {
    return false;
  }
  return route === employer;
}

export function postJobRouteIdFromPath(
  path: string | null | undefined,
): string | null {
  const pathname = path?.split("?")[0]?.split("#")[0] ?? "";
  const match = pathname.match(/^\/post-job\/([^/]+)$/);
  return match?.[1] ?? null;
}

export function resolvePostJobDraftId(
  routeId: string | null | undefined,
  employerId: string | null | undefined,
): string | undefined {
  const route = routeId?.trim() ?? "";
  if (!route || isEmployerAccountPostJobLink(route, employerId)) {
    return undefined;
  }
  return route;
}

/**
 * Login restores the CTA path. When that path is this employer's approval
 * button, the destination is the new-job form, not a job fetch.
 */
export function resolveAccountApprovalPostJobDestination(
  path: string | null | undefined,
  employerId: string | null | undefined,
): typeof ROUTES.POST_JOB | null {
  const routeId = postJobRouteIdFromPath(path);
  if (!routeId || !isEmployerAccountPostJobLink(routeId, employerId)) {
    return null;
  }
  return ROUTES.POST_JOB;
}
