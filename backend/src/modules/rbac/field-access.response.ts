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
  return sanitizeDtoByFieldAccess(
    context,
    "jobs",
    job,
    JOB_PUBLIC_FIELD_BINDINGS,
  );
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
