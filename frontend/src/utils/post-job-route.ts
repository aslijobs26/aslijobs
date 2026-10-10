import { ROUTES } from "@/constants/routes";

const MONGO_OBJECT_ID = /^[a-f0-9]{24}$/i;
const LITERAL_TEMPLATE_SLOT = /^\{\{1\}\}/;

/**
 * Older aslijobs_account_approved and job_post_incomplete_ buttons use
 * `https://www.aslijobs.com/post-job/%7B%7B1%7D%7D{{1}}`.
 * job_post_rejected_v1 uses `https://www.aslijobs.com/post-job/{{1}}`.
 * The encoded `{{1}}` is literal text. The real variable is appended after it.
 * Account approval appends the employer id. Complete Job Details appends the
 * draft Mongo id, which is the same id as the dashboard editor.
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

  const extracted = extractPostJobRouteId(route);
  return extracted || route;
}

/**
 * Login and the editor should open `/post-job/{mongoId}` for Complete Job
 * Details. The signed-in employer's own approval button is not a draft.
 */
export function resolveIncompleteDraftEditPath(
  path: string | null | undefined,
  employerId: string | null | undefined,
): string | null {
  const routeId = postJobRouteIdFromPath(path);
  if (!routeId || isEmployerAccountPostJobLink(routeId, employerId)) {
    return null;
  }

  const draftId = resolvePostJobDraftId(routeId, employerId);
  if (!draftId || !MONGO_OBJECT_ID.test(draftId)) {
    return null;
  }

  const canonical = ROUTES.postJobEdit(draftId);
  const pathname = path?.split("?")[0]?.split("#")[0] ?? "";
  if (pathname === canonical) {
    return null;
  }
  return canonical;
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
