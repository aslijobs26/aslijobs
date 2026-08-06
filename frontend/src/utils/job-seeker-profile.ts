import type { PublicResume } from "@/types/job-seeker-resume";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducation,
  JobSeekerExperienceEntry,
  JobSeekerLanguage,
  JobSeekerPublic,
} from "@/types/job-seeker";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS,
  JOB_SEEKER_EDUCATION_OPTIONS,
  JOB_SEEKER_JOB_TYPE_OPTIONS,
  JOB_SEEKER_LANGUAGE_OPTIONS,
  JOB_SEEKER_WORK_MODE_OPTIONS,
} from "@/constants/job-seeker-register";

export const JOB_SEEKER_PROFILE_TABS = [
  "overview",
  "experience",
  "education",
  "skills",
  "documents",
  "preferences",
  "activity",
] as const;

export type JobSeekerProfileTab = (typeof JOB_SEEKER_PROFILE_TABS)[number];

export const JOB_SEEKER_PROFILE_TAB_LABELS: Record<JobSeekerProfileTab, string> =
  {
    overview: "Overview",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    documents: "Documents",
    preferences: "Preferences",
    activity: "Activity",
  };

/** Profile strength weights — must sum to 100. */
export const PROFILE_STRENGTH_WEIGHTS = {
  photo: 10,
  summary: 10,
  experience: 20,
  education: 15,
  skills: 15,
  resume: 20,
  preferences: 10,
} as const;

export type ProfileChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

export type ProfileStrengthResult = {
  percent: number;
  message: string;
  breakdown: Record<keyof typeof PROFILE_STRENGTH_WEIGHTS, boolean>;
};

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "JS";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function formatCurrentLocation(jobSeeker: JobSeekerPublic): string {
  return (
    [jobSeeker.city, jobSeeker.state].filter((part) => hasText(part)).join(", ") ||
    ""
  );
}

export function formatWhatsappNumber(whatsappNumber: string): string {
  const digits = whatsappNumber.trim();
  if (!digits) {
    return "";
  }
  return digits.startsWith("+") ? digits : `+91 ${digits}`;
}

export function languageLabel(value: JobSeekerLanguage): string {
  return (
    JOB_SEEKER_LANGUAGE_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function educationLevelLabel(level: string): string {
  return (
    JOB_SEEKER_EDUCATION_OPTIONS.find((option) => option.value === level)
      ?.label ?? level
  );
}

export function jobTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return (
    JOB_SEEKER_JOB_TYPE_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function workModeLabel(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return (
    JOB_SEEKER_WORK_MODE_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function availabilityLabel(
  value: JobSeekerAvailabilityStatus | null | undefined,
): string {
  if (!value) {
    return "";
  }
  return (
    JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

export function formatExpectedSalary(jobSeeker: JobSeekerPublic): string {
  if (
    typeof jobSeeker.expectedSalary !== "number" ||
    jobSeeker.expectedSalary <= 0
  ) {
    return "";
  }

  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(jobSeeker.expectedSalary);

  const period =
    jobSeeker.expectedSalaryPeriod === "per-year" ? "/ year" : "/ month";

  return `${amount} ${period}`;
}

export function formatExperienceDateRange(
  experience: JobSeekerExperienceEntry,
): string {
  const start = experience.startDate?.trim() || "";
  if (!start) {
    return experience.duration?.trim() || "";
  }

  const end = experience.currentlyWorking
    ? "Present"
    : experience.endDate?.trim() || "";

  const range = end ? `${start} – ${end}` : start;
  return experience.duration?.trim()
    ? `${range} · ${experience.duration.trim()}`
    : range;
}

export function educationInstitution(education: JobSeekerEducation): string {
  return (
    education.collegeName?.trim() ||
    education.instituteName?.trim() ||
    education.schoolName?.trim() ||
    ""
  );
}

export function educationTitle(education: JobSeekerEducation): string {
  return (
    education.degree?.trim() ||
    education.trade?.trim() ||
    education.stream?.trim() ||
    education.branch?.trim() ||
    educationLevelLabel(education.level)
  );
}

export function sortExperiencesChronologically(
  experiences: JobSeekerExperienceEntry[],
): JobSeekerExperienceEntry[] {
  return [...experiences].sort((left, right) => {
    if (left.currentlyWorking && !right.currentlyWorking) {
      return -1;
    }
    if (!left.currentlyWorking && right.currentlyWorking) {
      return 1;
    }
    return (right.startDate || "").localeCompare(left.startDate || "");
  });
}

export function resolveProfessionalSummary(
  jobSeeker: JobSeekerPublic,
  resume: PublicResume | null | undefined,
): string {
  if (hasText(jobSeeker.professionalSummary)) {
    return jobSeeker.professionalSummary!.trim();
  }

  const resumeJson = resume?.resumeJson;
  if (
    resumeJson &&
    "sections" in resumeJson &&
    resumeJson.sections &&
    hasText(resumeJson.sections.professionalSummary)
  ) {
    return resumeJson.sections.professionalSummary.trim();
  }

  return "";
}

export function resolveSkills(
  jobSeeker: JobSeekerPublic,
  resume: PublicResume | null | undefined,
): string[] {
  if (Array.isArray(jobSeeker.skills) && jobSeeker.skills.length > 0) {
    return jobSeeker.skills
      .map((skill) => skill.trim())
      .filter(Boolean)
      .filter((skill, index, list) => list.indexOf(skill) === index);
  }

  const resumeJson = resume?.resumeJson;
  if (
    resumeJson &&
    "sections" in resumeJson &&
    Array.isArray(resumeJson.sections?.skills)
  ) {
    return resumeJson.sections.skills
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

export function computeTotalExperienceLabel(
  jobSeeker: JobSeekerPublic,
): string {
  if (jobSeeker.experienceType === "fresher") {
    return "Fresher";
  }

  const experiences = jobSeeker.experiences ?? [];
  if (experiences.length === 0) {
    return "";
  }

  const withDuration = experiences.find((entry) => hasText(entry.duration));
  if (withDuration?.duration) {
    return withDuration.duration.trim();
  }

  return `${experiences.length} role${experiences.length === 1 ? "" : "s"}`;
}

export function buildProfileTags(jobSeeker: JobSeekerPublic): string[] {
  const tags: string[] = [];
  const experienceLabel = computeTotalExperienceLabel(jobSeeker);
  if (experienceLabel) {
    tags.push(
      jobSeeker.experienceType === "fresher"
        ? "Fresher"
        : experienceLabel.includes("Year") || experienceLabel.includes("year")
          ? experienceLabel
          : `${experienceLabel} Experience`,
    );
  }

  tags.push("Open to Work");

  if (jobSeeker.availabilityStatus === "immediate") {
    tags.push("Immediate Joiner");
  } else if (
    jobSeeker.availabilityStatus === "within_7" ||
    jobSeeker.availabilityStatus === "within_15"
  ) {
    tags.push("Actively Looking");
  } else if (jobSeeker.availabilityStatus) {
    tags.push("Actively Looking");
  }

  return tags;
}

export function buildProfileChecklist(
  jobSeeker: JobSeekerPublic,
  resume: PublicResume | null | undefined,
): ProfileChecklistItem[] {
  const skills = resolveSkills(jobSeeker, resume);
  const hasResume =
    Boolean(resume) &&
    (resume?.status === "READY" ||
      Boolean(resume?.pdfUrl) ||
      (resume?.resumeJson &&
        "sections" in resume.resumeJson &&
        Boolean(resume.resumeJson.sections)));

  return [
    {
      id: "photo",
      label: "Add Profile Photo",
      completed: Boolean(jobSeeker.profilePhoto?.url),
    },
    {
      id: "mobile",
      label: "Verify Mobile Number",
      completed: jobSeeker.isWhatsappVerified,
    },
    {
      id: "education",
      label: "Add Education",
      completed: Boolean(jobSeeker.education?.level),
    },
    {
      id: "experience",
      label: "Add Work Experience",
      completed:
        jobSeeker.experienceType === "fresher" ||
        (Array.isArray(jobSeeker.experiences) &&
          jobSeeker.experiences.length > 0),
    },
    {
      id: "skills",
      label: "Add Skills",
      completed: skills.length > 0,
    },
    {
      id: "resume",
      label: "Add Resume",
      completed: Boolean(hasResume),
    },
    {
      id: "languages",
      label: "Add Languages",
      completed:
        Array.isArray(jobSeeker.languages) && jobSeeker.languages.length > 0,
    },
    {
      id: "preferences",
      label: "Set Career Preferences",
      completed: Boolean(
        hasText(jobSeeker.jobRole) &&
          hasText(jobSeeker.preferredJobLocation) &&
          jobSeeker.jobType &&
          jobSeeker.workMode &&
          typeof jobSeeker.expectedSalary === "number" &&
          jobSeeker.expectedSalary > 0,
      ),
    },
  ];
}

export function computeProfileCompletion(
  jobSeeker: JobSeekerPublic,
  resume: PublicResume | null | undefined,
): { percent: number; checklist: ProfileChecklistItem[] } {
  const checklist = buildProfileChecklist(jobSeeker, resume);
  const completedCount = checklist.filter((item) => item.completed).length;
  const percent = Math.round((completedCount / checklist.length) * 100);
  return { percent, checklist };
}

export function computeProfileStrength(
  jobSeeker: JobSeekerPublic,
  resume: PublicResume | null | undefined,
): ProfileStrengthResult {
  const skills = resolveSkills(jobSeeker, resume);
  const summary = resolveProfessionalSummary(jobSeeker, resume);
  const hasResume =
    Boolean(resume) &&
    (resume?.status === "READY" ||
      Boolean(resume?.pdfUrl) ||
      (resume != null && resume.status !== "NOT_GENERATED"));

  const breakdown = {
    photo: Boolean(jobSeeker.profilePhoto?.url),
    summary: hasText(summary),
    experience:
      jobSeeker.experienceType === "fresher" ||
      (Array.isArray(jobSeeker.experiences) &&
        jobSeeker.experiences.length > 0),
    education: Boolean(jobSeeker.education?.level),
    skills: skills.length > 0,
    resume: Boolean(hasResume),
    preferences: Boolean(
      hasText(jobSeeker.jobRole) &&
        hasText(jobSeeker.preferredJobLocation) &&
        jobSeeker.jobType &&
        typeof jobSeeker.expectedSalary === "number" &&
        jobSeeker.expectedSalary > 0,
    ),
  };

  const percent = (
    Object.keys(PROFILE_STRENGTH_WEIGHTS) as Array<
      keyof typeof PROFILE_STRENGTH_WEIGHTS
    >
  ).reduce((total, key) => {
    return total + (breakdown[key] ? PROFILE_STRENGTH_WEIGHTS[key] : 0);
  }, 0);

  let message = "Let's get started";
  if (percent >= 85) {
    message = "Excellent profile!";
  } else if (percent >= 70) {
    message = "Great! Keep going";
  } else if (percent >= 40) {
    message = "Looking good";
  } else if (percent > 0) {
    message = "Keep building";
  }

  return { percent, message, breakdown };
}

export function parseProfileTab(
  value: string | null | undefined,
): JobSeekerProfileTab {
  if (
    value &&
    (JOB_SEEKER_PROFILE_TABS as readonly string[]).includes(value)
  ) {
    return value as JobSeekerProfileTab;
  }
  return "overview";
}

export function formatRelativeUpdatedAt(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
