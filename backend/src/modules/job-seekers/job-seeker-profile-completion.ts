import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";

export const PROFILE_INCOMPLETE_CODE = "PROFILE_INCOMPLETE";

export const JOB_SEEKER_APPLY_SECTION_IDS = [
  "personal",
  "preferences",
  "education",
  "experience",
  "languages",
  "availability",
] as const;

export type JobSeekerApplySectionId =
  (typeof JOB_SEEKER_APPLY_SECTION_IDS)[number];

export type JobSeekerProfileCompletionSection = {
  id: JobSeekerApplySectionId;
  label: string;
  completed: boolean;
};

export type JobSeekerProfileCompletion = {
  isComplete: boolean;
  percent: number;
  sections: JobSeekerProfileCompletionSection[];
  missingSectionIds: JobSeekerApplySectionId[];
};

type ExperienceLike = {
  companyName?: string | null;
  jobRole?: string | null;
};

export type JobSeekerProfileCompletionSource = {
  fullName?: string | null;
  isWhatsappVerified?: boolean | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  jobRole?: string | null;
  jobType?: string | null;
  workMode?: string | null;
  preferredJobLocation?: string | null;
  expectedSalary?: number | null;
  education?: { level?: string | null } | null;
  experienceType?: string | null;
  experiences?: ExperienceLike[] | null;
  languages?: string[] | null;
  availabilityStatus?: string | null;
};

const SECTION_LABELS: Record<JobSeekerApplySectionId, string> = {
  personal: "Personal details",
  preferences: "Career preferences",
  education: "Education",
  experience: "Work experience",
  languages: "Languages",
  availability: "Availability",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasDate(value: Date | string | null | undefined): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  return text(value).length > 0;
}

function hasPersonalDetails(seeker: JobSeekerProfileCompletionSource): boolean {
  return (
    text(seeker.fullName).length > 0 &&
    seeker.isWhatsappVerified === true &&
    hasDate(seeker.dateOfBirth) &&
    text(seeker.gender).length > 0
  );
}

function hasCareerPreferences(seeker: JobSeekerProfileCompletionSource): boolean {
  return (
    text(seeker.jobRole).length > 0 &&
    text(seeker.jobType).length > 0 &&
    text(seeker.workMode).length > 0 &&
    text(seeker.preferredJobLocation).length > 0 &&
    typeof seeker.expectedSalary === "number" &&
    Number.isFinite(seeker.expectedSalary) &&
    seeker.expectedSalary > 0
  );
}

function hasEducation(seeker: JobSeekerProfileCompletionSource): boolean {
  return text(seeker.education?.level).length > 0;
}

function hasExperience(seeker: JobSeekerProfileCompletionSource): boolean {
  if (seeker.experienceType === "fresher") {
    return true;
  }
  if (seeker.experienceType !== "experienced") {
    return false;
  }
  return (seeker.experiences ?? []).some(
    (entry) => text(entry.companyName).length > 0 && text(entry.jobRole).length > 0,
  );
}

function hasLanguages(seeker: JobSeekerProfileCompletionSource): boolean {
  return (seeker.languages ?? []).some((language) => text(language).length > 0);
}

function hasAvailability(seeker: JobSeekerProfileCompletionSource): boolean {
  return text(seeker.availabilityStatus).length > 0;
}

const SECTION_CHECKS: Record<
  JobSeekerApplySectionId,
  (seeker: JobSeekerProfileCompletionSource) => boolean
> = {
  personal: hasPersonalDetails,
  preferences: hasCareerPreferences,
  education: hasEducation,
  experience: hasExperience,
  languages: hasLanguages,
  availability: hasAvailability,
};

/**
 * Required profile sections for applying. Photo, skills, resume, summary,
 * and current city are shown on the profile but do not block applications.
 */
export function evaluateJobSeekerProfileCompletion(
  seeker: JobSeekerProfileCompletionSource,
): JobSeekerProfileCompletion {
  const sections = JOB_SEEKER_APPLY_SECTION_IDS.map((id) => ({
    id,
    label: SECTION_LABELS[id],
    completed: SECTION_CHECKS[id](seeker),
  }));
  const missingSectionIds = sections
    .filter((section) => !section.completed)
    .map((section) => section.id);
  const completedCount = sections.length - missingSectionIds.length;
  const percent =
    sections.length === 0
      ? 0
      : Math.round((completedCount / sections.length) * 100);

  return {
    isComplete: missingSectionIds.length === 0,
    percent,
    sections,
    missingSectionIds,
  };
}

export function profileIncompleteApplyError(
  completion: JobSeekerProfileCompletion,
): AppError {
  return new AppError(
    "Complete your profile before applying for jobs.",
    HTTP_STATUS.FORBIDDEN,
    {
      code: PROFILE_INCOMPLETE_CODE,
      missingSections: completion.sections
        .filter((section) => !section.completed)
        .map((section) => ({ id: section.id, label: section.label })),
    },
  );
}

export function assertJobSeekerProfileAllowsApply(
  seeker: JobSeekerProfileCompletionSource,
): JobSeekerProfileCompletion {
  const completion = evaluateJobSeekerProfileCompletion(seeker);
  if (!completion.isComplete) {
    throw profileIncompleteApplyError(completion);
  }
  return completion;
}

/** A verified WhatsApp number is enough to log in. Profile fields stay separate. */
export function canLoginVerifiedJobSeeker(seeker: {
  isWhatsappVerified?: boolean | null;
}): boolean {
  return seeker.isWhatsappVerified === true;
}
