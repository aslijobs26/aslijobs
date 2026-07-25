import {
  RESUME_DEFAULT_TEMPLATE_ID,
  RESUME_TEMPLATE_VERSION,
} from "../resume.constants.js";
import type {
  JobSeekerProfileForResume,
  ResumeJson,
  ResumeJsonEducationEntry,
  ResumeJsonExperienceEntry,
} from "../resume.types.js";
import {
  deriveSkillsFromProfile,
  generateAvailability,
  generateCareerObjective,
  generateProfessionalHeadline,
  generateProfessionalSummary,
} from "./resume-content-generator.js";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatLocation(profile: JobSeekerProfileForResume): string {
  const parts = [text(profile.city), text(profile.state), text(profile.pincode)].filter(
    Boolean,
  );
  return parts.join(", ");
}

function formatDateOfBirth(
  value: string | Date | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString().slice(0, 10);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapEducation(
  education: JobSeekerProfileForResume["education"],
): ResumeJsonEducationEntry[] {
  if (!education || typeof education !== "object") {
    return [];
  }

  const entry = education as Record<string, unknown>;
  const level = typeof entry.level === "string" ? entry.level.trim() : "";
  if (!level) {
    return [];
  }

  return [
    {
      level,
      schoolName: text(entry.schoolName),
      collegeName: text(entry.collegeName),
      instituteName: text(entry.instituteName),
      board: text(entry.board),
      stream: text(entry.stream),
      trade: text(entry.trade),
      branch: text(entry.branch),
      degree: text(entry.degree),
      specialization: text(entry.specialization),
      passingYear: text(entry.passingYear),
      percentage: text(entry.percentage),
      cgpa: text(entry.cgpa),
    },
  ];
}

function mapExperiences(
  experiences: JobSeekerProfileForResume["experiences"],
): ResumeJsonExperienceEntry[] {
  if (!Array.isArray(experiences)) {
    return [];
  }

  return experiences.map((raw) => {
    const entry = raw as Record<string, unknown>;
    return {
      companyName: text(entry.companyName),
      jobRole: text(entry.jobRole),
      industry: text(entry.industry),
      startDate: text(entry.startDate),
      endDate: text(entry.endDate),
      currentlyWorking: Boolean(entry.currentlyWorking),
      duration: text(entry.duration),
      salary: text(entry.salary),
      location: text(entry.location),
      responsibilities: text(entry.responsibilities),
    };
  });
}

/**
 * Maps a Job Seeker profile into the canonical ResumeJson shape.
 * Pure function — does not persist, generate HTML/PDF, or mutate the profile.
 */
export function mapJobSeekerProfileToResumeJson(
  profile: JobSeekerProfileForResume,
): ResumeJson {
  return buildAtsResumeJson(profile);
}

/**
 * Builds a full ATS-friendly ResumeJson from profile data only.
 * All required sections are always present (empty when data is missing).
 */
export function buildAtsResumeJson(
  profile: JobSeekerProfileForResume,
  options?: {
    templateId?: string;
    templateVersion?: string;
    generatedAt?: Date;
  },
): ResumeJson {
  const isFresher = profile.experienceType === "fresher";
  const experiences = isFresher ? [] : mapExperiences(profile.experiences);
  const headline = generateProfessionalHeadline(profile);
  const city = text(profile.city);
  const state = text(profile.state);
  const fullName = text(profile.fullName);
  const phone = text(profile.whatsappNumber);
  const generatedAt = options?.generatedAt ?? new Date();

  return {
    header: {
      fullName,
      phone,
      city,
      state,
      location: formatLocation(profile),
      headline,
    },
    sections: {
      professionalHeadline: headline,
      professionalSummary: generateProfessionalSummary(profile, experiences),
      careerObjective: generateCareerObjective(profile),
      skills: deriveSkillsFromProfile(profile, experiences),
      education: mapEducation(profile.education),
      experience: experiences,
      isFresher,
      experienceLabel: isFresher ? "Fresher" : "",
      languages: Array.isArray(profile.languages)
        ? profile.languages.filter(
            (language): language is string =>
              typeof language === "string" && language.trim().length > 0,
          )
        : [],
      careerPreferences: {
        preferredJobRole: text(profile.jobRole),
        preferredJobLocation: text(profile.preferredJobLocation),
        jobType: profile.jobType ?? null,
        workMode: profile.workMode ?? null,
        expectedSalary:
          typeof profile.expectedSalary === "number"
            ? profile.expectedSalary
            : null,
        expectedSalaryPeriod: profile.expectedSalaryPeriod ?? null,
      },
      availability: generateAvailability(profile),
      contact: {
        fullName,
        phone,
        city,
        state,
      },
    },
    meta: {
      dateOfBirth: formatDateOfBirth(profile.dateOfBirth),
      sourceJobSeekerId: profile.id ? String(profile.id) : null,
      templateId: options?.templateId ?? RESUME_DEFAULT_TEMPLATE_ID,
      templateVersion: options?.templateVersion ?? RESUME_TEMPLATE_VERSION,
      generatedAt: generatedAt.toISOString(),
    },
  };
}

export function createEmptyResumeJson(): ResumeJson {
  return {
    header: {
      fullName: "",
      phone: "",
      city: "",
      state: "",
      location: "",
      headline: "",
    },
    sections: {
      professionalHeadline: "",
      professionalSummary: "",
      careerObjective: "",
      skills: [],
      education: [],
      experience: [],
      isFresher: false,
      experienceLabel: "",
      languages: [],
      careerPreferences: {
        preferredJobRole: "",
        preferredJobLocation: "",
        jobType: null,
        workMode: null,
        expectedSalary: null,
        expectedSalaryPeriod: null,
      },
      availability: "",
      contact: {
        fullName: "",
        phone: "",
        city: "",
        state: "",
      },
    },
    meta: {
      dateOfBirth: null,
      sourceJobSeekerId: null,
      templateId: RESUME_DEFAULT_TEMPLATE_ID,
      templateVersion: RESUME_TEMPLATE_VERSION,
      generatedAt: null,
    },
  };
}
