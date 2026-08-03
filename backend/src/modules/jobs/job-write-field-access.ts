/**
 * Job write-side field ACL helpers.
 * Catalog fields must be editable before sensitive salary/contact/description
 * values are accepted on create/update/draft/publish payloads.
 */
import { assertFieldsEditable } from "../rbac/field-access.guards.js";
import type { ResolvedRbacContext } from "../rbac/rbac.engine.js";

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDefinedNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function collectJobWriteFieldKeys(body: Record<string, unknown>): string[] {
  const fields = new Set<string>();

  if (
    hasDefinedNumber(body.fixedSalary) ||
    hasDefinedNumber(body.minimumSalary) ||
    hasDefinedNumber(body.maximumSalary) ||
    hasNonEmptyString(body.salaryType) ||
    hasNonEmptyString(body.salaryPeriod)
  ) {
    fields.add("salary");
  }

  if (Array.isArray(body.perks) && body.perks.length > 0) {
    fields.add("benefits");
  }

  if (hasNonEmptyString(body.description)) {
    fields.add("job_description");
  }

  if (
    hasNonEmptyString(body.contactPersonName) ||
    hasNonEmptyString(body.contactEmail) ||
    hasNonEmptyString(body.contactMobile)
  ) {
    fields.add("hiring_manager");
  }

  const snapshot = body.wizardSnapshot;
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    const snap = snapshot as Record<string, unknown>;
    const jobInfo =
      snap.jobInformation && typeof snap.jobInformation === "object"
        ? (snap.jobInformation as Record<string, unknown>)
        : snap;
    const interview =
      snap.interview && typeof snap.interview === "object"
        ? (snap.interview as Record<string, unknown>)
        : null;

    if (
      hasDefinedNumber(jobInfo.fixedSalary) ||
      hasDefinedNumber(jobInfo.minimumSalary) ||
      hasDefinedNumber(jobInfo.maximumSalary) ||
      hasNonEmptyString(jobInfo.salaryType) ||
      hasNonEmptyString(jobInfo.salaryPeriod)
    ) {
      fields.add("salary");
    }
    if (Array.isArray(jobInfo.perks) && jobInfo.perks.length > 0) {
      fields.add("benefits");
    }
    if (hasNonEmptyString(jobInfo.description)) {
      fields.add("job_description");
    }
    if (
      (interview &&
        (hasNonEmptyString(interview.contactPersonName) ||
          hasNonEmptyString(interview.contactEmail) ||
          hasNonEmptyString(interview.contactMobile))) ||
      hasNonEmptyString(snap.contactPersonName) ||
      hasNonEmptyString(snap.contactEmail) ||
      hasNonEmptyString(snap.contactMobile)
    ) {
      fields.add("hiring_manager");
    }
  }

  return [...fields];
}

export function assertJobWriteFieldsAllowed(
  context: ResolvedRbacContext | undefined,
  body: unknown,
): void {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return;
  }
  const fieldKeys = collectJobWriteFieldKeys(body as Record<string, unknown>);
  if (fieldKeys.length === 0) {
    return;
  }
  assertFieldsEditable(context, "jobs", fieldKeys);
}
