import type { JobSeekerPublic } from "@/types/job-seeker";
import { computeProfileCompletion } from "@/utils/job-seeker-profile";

export const PROFILE_INCOMPLETE_CODE = "PROFILE_INCOMPLETE";

export type ProfileApplyGap = {
  id: string;
  label: string;
};

export function listIncompleteApplySections(
  jobSeeker: JobSeekerPublic,
): ProfileApplyGap[] {
  return computeProfileCompletion(jobSeeker, null).checklist
    .filter((item) => !item.completed)
    .map((item) => ({ id: item.id, label: item.label }));
}

export function isProfileReadyToApply(jobSeeker: JobSeekerPublic): boolean {
  return listIncompleteApplySections(jobSeeker).length === 0;
}

type ErrorDetails = {
  code?: string;
  missingSections?: Array<{ id?: string; label?: string }>;
};

function readErrorPayload(error: unknown): {
  message: string;
  details: ErrorDetails | null;
} {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (
      error as {
        response?: { data?: { message?: string; details?: ErrorDetails } };
      }
    ).response?.data;
    return {
      message:
        typeof data?.message === "string" ? data.message : "",
      details: data?.details ?? null,
    };
  }
  return { message: "", details: null };
}

export function readProfileIncompleteError(error: unknown): ProfileApplyGap[] | null {
  const payload = readErrorPayload(error);
  if (payload.details?.code !== PROFILE_INCOMPLETE_CODE) {
    return null;
  }
  const sections = (payload.details.missingSections ?? [])
    .filter((section) => section.id && section.label)
    .map((section) => ({
      id: section.id as string,
      label: section.label as string,
    }));
  return sections;
}
