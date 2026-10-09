const MONGO_OBJECT_ID = /^[a-f0-9]{24}$/i;

/**
 * `/post-job` creates a job. `/post-job/:jobId` edits that job.
 * The account-approval WhatsApp button uses `/post-job/{employerId}`.
 * That id is the signed-in employer, not a job, so it must open the create form.
 */
export function isEmployerAccountPostJobLink(
  routeId: string | null | undefined,
  employerId: string | null | undefined,
): boolean {
  const route = routeId?.trim().toLowerCase() ?? "";
  const employer = employerId?.trim().toLowerCase() ?? "";
  if (!route || !employer || !MONGO_OBJECT_ID.test(route)) {
    return false;
  }
  return route === employer;
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
