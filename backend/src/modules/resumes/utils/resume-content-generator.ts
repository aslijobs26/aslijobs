import type {
  JobSeekerProfileForResume,
  ResumeJsonExperienceEntry,
} from "../resume.types.js";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatJobTypeLabel(jobType: string | null | undefined): string {
  switch (jobType) {
    case "full-time":
      return "full-time";
    case "part-time":
      return "part-time";
    case "contract":
      return "contract";
    default:
      return "";
  }
}

function formatWorkModeLabel(workMode: string | null | undefined): string {
  switch (workMode) {
    case "on-site":
      return "on-site";
    case "work-from-home":
      return "work-from-home";
    case "hybrid":
      return "hybrid";
    case "field-work":
      return "field-work";
    case "any":
      return "flexible";
    default:
      return "";
  }
}

function formatSalaryPeriodLabel(
  period: string | null | undefined,
): string {
  if (period === "per-year") {
    return "per year";
  }
  if (period === "per-month") {
    return "per month";
  }
  return "";
}

function pickPrimaryExperience(
  experiences: ResumeJsonExperienceEntry[],
): ResumeJsonExperienceEntry | null {
  if (experiences.length === 0) {
    return null;
  }

  const current = experiences.find((entry) => entry.currentlyWorking);
  return current ?? experiences[0] ?? null;
}

/**
 * Deterministic professional headline from profile fields only.
 */
export function generateProfessionalHeadline(
  profile: JobSeekerProfileForResume,
): string {
  const jobRole = text(profile.jobRole);

  if (profile.experienceType === "fresher") {
    return jobRole ? `Fresher | ${jobRole}` : "Fresher";
  }

  if (profile.experienceType === "experienced") {
    return jobRole ? `Experienced ${jobRole}` : "Experienced Professional";
  }

  return jobRole || "Job Seeker";
}

/**
 * Professional summary using only stored profile data.
 */
export function generateProfessionalSummary(
  profile: JobSeekerProfileForResume,
  experiences: ResumeJsonExperienceEntry[],
): string {
  const jobRole = text(profile.jobRole) || "a suitable role";
  const primary = pickPrimaryExperience(experiences);
  const industry = primary ? text(primary.industry) : "";
  const duration = primary ? text(primary.duration) : "";

  if (profile.experienceType === "fresher") {
    return `Motivated and enthusiastic candidate seeking opportunities as a ${jobRole} with a willingness to learn, adapt quickly, and contribute effectively to organizational success.`;
  }

  if (profile.experienceType === "experienced") {
    const industryPhrase = industry ? ` in the ${industry} industry` : "";
    const durationPhrase = duration ? ` with ${duration} of experience` : "";
    return `Results-oriented professional seeking opportunities as a ${jobRole}${industryPhrase}${durationPhrase}. Committed to delivering reliable work and contributing to team goals.`;
  }

  return `Candidate seeking opportunities as a ${jobRole}.`;
}

/**
 * Career objective from preferences only.
 */
export function generateCareerObjective(
  profile: JobSeekerProfileForResume,
): string {
  const jobRole = text(profile.jobRole) || "a suitable role";
  const location = text(profile.preferredJobLocation);
  const workMode = formatWorkModeLabel(profile.workMode);
  const salary =
    typeof profile.expectedSalary === "number" && profile.expectedSalary > 0
      ? profile.expectedSalary
      : null;
  const salaryPeriod = formatSalaryPeriodLabel(profile.expectedSalaryPeriod);

  const parts: string[] = [
    `Seeking a ${jobRole} position`,
  ];

  if (workMode) {
    parts.push(`in a ${workMode} setting`);
  }

  if (location) {
    parts.push(`preferably in ${location}`);
  }

  let objective = `${parts.join(" ")}.`;

  if (salary != null) {
    const periodSuffix = salaryPeriod ? ` ${salaryPeriod}` : "";
    objective += ` Expected salary: ${salary}${periodSuffix}.`;
  }

  return objective;
}

/**
 * Availability string from job type / work mode only.
 */
export function generateAvailability(
  profile: JobSeekerProfileForResume,
): string {
  const jobType = formatJobTypeLabel(profile.jobType);
  const workMode = formatWorkModeLabel(profile.workMode);

  if (!jobType && !workMode) {
    return "";
  }

  if (jobType && workMode) {
    return `Open to ${jobType}, ${workMode} roles`;
  }

  if (jobType) {
    return `Open to ${jobType} roles`;
  }

  return `Open to ${workMode} roles`;
}

/**
 * Skills derived only from real profile fields — never invent technologies.
 */
export function deriveSkillsFromProfile(
  profile: JobSeekerProfileForResume,
  experiences: ResumeJsonExperienceEntry[],
): string[] {
  const skills = new Set<string>();

  const add = (value: unknown) => {
    const trimmed = text(value);
    if (trimmed) {
      skills.add(trimmed);
    }
  };

  add(profile.jobRole);

  if (profile.education && typeof profile.education === "object") {
    const education = profile.education as Record<string, unknown>;
    add(education.trade);
    add(education.branch);
    add(education.stream);
    add(education.specialization);
    add(education.degree);
  }

  for (const experience of experiences) {
    add(experience.jobRole);
    add(experience.industry);
  }

  return [...skills];
}
