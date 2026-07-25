import { RESUME_PROFILE_COMPLETENESS_WEIGHTS } from "../resume.constants.js";
import type {
  JobSeekerProfileForResume,
  ProfileCompletenessResult,
} from "../resume.types.js";

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPersonalDetails(profile: JobSeekerProfileForResume): boolean {
  if (!hasText(profile.fullName) || !hasText(profile.whatsappNumber)) {
    return false;
  }

  return Boolean(
    hasText(profile.city) ||
      hasText(profile.state) ||
      hasText(profile.pincode) ||
      profile.dateOfBirth,
  );
}

function hasPreferences(profile: JobSeekerProfileForResume): boolean {
  return Boolean(
    hasText(profile.jobRole) &&
      profile.jobType &&
      profile.workMode &&
      hasText(profile.preferredJobLocation) &&
      profile.expectedSalary != null &&
      profile.expectedSalary > 0,
  );
}

function hasEducation(profile: JobSeekerProfileForResume): boolean {
  const education = profile.education;
  if (!education || typeof education !== "object") {
    return false;
  }

  const level = "level" in education ? education.level : null;
  return typeof level === "string" && level.trim().length > 0;
}

function hasExperience(profile: JobSeekerProfileForResume): boolean {
  if (profile.experienceType === "fresher") {
    return true;
  }

  if (profile.experienceType === "experienced") {
    return Array.isArray(profile.experiences) && profile.experiences.length >= 1;
  }

  return false;
}

function hasLanguages(profile: JobSeekerProfileForResume): boolean {
  return Array.isArray(profile.languages) && profile.languages.length >= 1;
}

/**
 * Pure profile completeness calculator (20% × 5 sections).
 * Does not persist — callers store `percent` on the resume document.
 */
export function calculateProfileCompleteness(
  profile: JobSeekerProfileForResume,
): ProfileCompletenessResult {
  const breakdown = {
    personal: hasPersonalDetails(profile),
    preferences: hasPreferences(profile),
    education: hasEducation(profile),
    experience: hasExperience(profile),
    languages: hasLanguages(profile),
  };

  const percent =
    (breakdown.personal
      ? RESUME_PROFILE_COMPLETENESS_WEIGHTS.personal
      : 0) +
    (breakdown.preferences
      ? RESUME_PROFILE_COMPLETENESS_WEIGHTS.preferences
      : 0) +
    (breakdown.education
      ? RESUME_PROFILE_COMPLETENESS_WEIGHTS.education
      : 0) +
    (breakdown.experience
      ? RESUME_PROFILE_COMPLETENESS_WEIGHTS.experience
      : 0) +
    (breakdown.languages
      ? RESUME_PROFILE_COMPLETENESS_WEIGHTS.languages
      : 0);

  return { percent, breakdown };
}
