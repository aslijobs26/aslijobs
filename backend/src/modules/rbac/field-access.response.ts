import {
  CANDIDATE_DETAIL_FIELD_BINDINGS,
  CANDIDATE_LIST_FIELD_BINDINGS,
  COMPANY_PROFILE_FIELD_BINDINGS,
  INTERVIEW_LIST_FIELD_BINDINGS,
  JOB_PUBLIC_FIELD_BINDINGS,
  TEAM_MEMBER_FIELD_BINDINGS,
  sanitizeDtoByFieldAccess,
} from "./field-access.sanitize.js";
import type { ResolvedRbacContext } from "./rbac.engine.js";

export function sanitizeCandidateListItem(
  context: ResolvedRbacContext | undefined,
  item: Record<string, unknown>,
) {
  return sanitizeDtoByFieldAccess(
    context,
    "candidates",
    item,
    CANDIDATE_LIST_FIELD_BINDINGS,
  );
}

export function sanitizeCandidateDetail(
  context: ResolvedRbacContext | undefined,
  detail: Record<string, unknown>,
) {
  return sanitizeDtoByFieldAccess(
    context,
    "candidates",
    detail,
    CANDIDATE_DETAIL_FIELD_BINDINGS,
  );
}

export function sanitizeInterviewListItem(
  context: ResolvedRbacContext | undefined,
  item: Record<string, unknown>,
) {
  return sanitizeDtoByFieldAccess(
    context,
    "interviews",
    item,
    INTERVIEW_LIST_FIELD_BINDINGS,
  );
}

export function sanitizeJobDto(
  context: ResolvedRbacContext | undefined,
  job: Record<string, unknown>,
) {
  const sanitized = sanitizeDtoByFieldAccess(
    context,
    "jobs",
    job,
    JOB_PUBLIC_FIELD_BINDINGS,
  ) as Record<string, unknown>;

  if (!context || context.isSuperAdmin) {
    return sanitized;
  }

  const snapshot = sanitized.wizardSnapshot;
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    sanitized.wizardSnapshot = sanitizeDtoByFieldAccess(
      context,
      "jobs",
      snapshot as Record<string, unknown>,
      [
        { field: "salary", path: "fixedSalary" },
        { field: "salary", path: "minimumSalary" },
        { field: "salary", path: "maximumSalary" },
        { field: "salary", path: "salaryType" },
        { field: "salary", path: "salaryPeriod" },
        { field: "salary", path: "jobInformation.fixedSalary" },
        { field: "salary", path: "jobInformation.minimumSalary" },
        { field: "salary", path: "jobInformation.maximumSalary" },
        { field: "benefits", path: "perks" },
        { field: "benefits", path: "jobInformation.perks" },
        { field: "job_description", path: "description" },
        { field: "job_description", path: "jobInformation.description" },
        { field: "hiring_manager", path: "contactPersonName" },
        { field: "hiring_manager", path: "contactEmail" },
        { field: "hiring_manager", path: "contactMobile" },
        { field: "hiring_manager", path: "interview.contactPersonName" },
        { field: "hiring_manager", path: "interview.contactEmail" },
        { field: "hiring_manager", path: "interview.contactMobile" },
      ],
    );
  }

  return sanitized;
}

export function sanitizeTeamMemberDto(
  context: ResolvedRbacContext | undefined,
  member: Record<string, unknown>,
) {
  return sanitizeDtoByFieldAccess(
    context,
    "team_management",
    member,
    TEAM_MEMBER_FIELD_BINDINGS,
  );
}

export function sanitizeCompanyProfileDto(
  context: ResolvedRbacContext | undefined,
  profile: Record<string, unknown>,
) {
  return sanitizeDtoByFieldAccess(
    context,
    "company_profile",
    profile,
    COMPANY_PROFILE_FIELD_BINDINGS,
  );
}
