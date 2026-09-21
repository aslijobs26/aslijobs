/**
 * Pure invitation lifecycle helpers — used by People service and tests.
 */

export function isInvitationResendEligible(member: {
  email?: string | null;
  role?: string | null;
  lastActiveAt?: Date | string | null;
  invitedAt?: Date | string | null;
}): boolean {
  if (!member.email) return false;
  if (member.role === "SUPER_ADMIN") return false;
  if (member.lastActiveAt != null) return false;
  if (member.invitedAt == null) return false;
  return true;
}

export function buildMemberSearchFields(input: {
  pattern: string;
  canViewEmail: boolean;
  canViewMobile: boolean;
}): Record<string, unknown>[] {
  const fields: Record<string, unknown>[] = [
    { fullName: { $regex: input.pattern, $options: "i" } },
  ];
  if (input.canViewEmail) {
    fields.push({ email: { $regex: input.pattern, $options: "i" } });
  }
  if (input.canViewMobile) {
    fields.push({ mobileNumber: { $regex: input.pattern, $options: "i" } });
  }
  return fields;
}

export function sanitizeMemberContactFields(input: {
  email?: string | null;
  mobileNumber?: string | null;
  canViewEmail: boolean;
  canViewMobile: boolean;
}): { email?: string; mobileNumber?: string } {
  const out: { email?: string; mobileNumber?: string } = {};
  if (input.canViewEmail) {
    out.email = input.email ?? "";
  }
  if (input.canViewMobile) {
    out.mobileNumber = input.mobileNumber ?? "";
  }
  return out;
}

/**
 * Simulates CAS: first writer with expectedRevision wins; second gets conflict.
 */
export function applyCasRevision(input: {
  currentRevision: number;
  expectedRevision: number;
}): { ok: true; nextRevision: number } | { ok: false; code: "STALE_REVISION" } {
  if (input.expectedRevision !== input.currentRevision) {
    return { ok: false, code: "STALE_REVISION" };
  }
  return { ok: true, nextRevision: input.currentRevision + 1 };
}
