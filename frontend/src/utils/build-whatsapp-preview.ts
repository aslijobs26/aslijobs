import {
  JOB_TYPE_OPTIONS,
  POST_JOB_EDUCATION_OPTIONS,
  POST_JOB_EXPERIENCE_OPTIONS,
  POST_JOB_LANGUAGE_OPTIONS,
  POST_JOB_PERK_OPTIONS,
  WORK_MODE_OPTIONS,
} from "@/constants/post-job";
import type { PostJobWizardFormData } from "@/types/post-job";

export type WhatsAppPreviewRow = {
  label: string;
  value: string;
};

function labelForOption<T extends string>(
  options: readonly { value: T; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatSalary(formData: PostJobWizardFormData): string {
  const { salaryType, incentives, salaryMin, salaryMax } =
    formData.locationAndSalary;

  if (salaryType === "fixed" && incentives.trim()) {
    return `₹${incentives.trim()}`;
  }

  if (salaryType === "range" && (salaryMin.trim() || salaryMax.trim())) {
    const min = salaryMin.trim() ? `₹${salaryMin.trim()}` : "";
    const max = salaryMax.trim() ? `₹${salaryMax.trim()}` : "";
    if (min && max) {
      return `${min} - ${max}`;
    }
    return min || max;
  }

  return "";
}

function formatLocation(formData: PostJobWizardFormData): string {
  const { city, state } = formData.locationAndSalary;
  const parts = [city.trim(), state.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}

function formatPerks(formData: PostJobWizardFormData): string {
  const { perks } = formData.locationAndSalary;
  if (perks.length === 0) {
    return "";
  }

  const labels = perks.map((perk) =>
    labelForOption(POST_JOB_PERK_OPTIONS, perk),
  );

  if (labels.length <= 2) {
    return labels.join(", ");
  }

  return `${labels.slice(0, 2).join(", ")}, etc.`;
}

function formatEducation(formData: PostJobWizardFormData): string {
  const { education } = formData.candidateAndInterview;
  if (education.length === 0) {
    return "";
  }

  return education
    .map((item) => labelForOption(POST_JOB_EDUCATION_OPTIONS, item))
    .join(", ");
}

function formatLanguages(formData: PostJobWizardFormData): string {
  const { languages, additionalRequirements } = formData.candidateAndInterview;
  if (!additionalRequirements.language || languages.length === 0) {
    return "";
  }

  return languages
    .map((item) => labelForOption(POST_JOB_LANGUAGE_OPTIONS, item))
    .join(", ");
}

export function buildWhatsAppPreviewContent(formData: PostJobWizardFormData): {
  jobTitle: string;
  rows: WhatsAppPreviewRow[];
} {
  const { jobInformation } = formData;

  return {
    jobTitle: jobInformation.jobTitle.trim() || "Job Title",
    rows: [
      {
        label: "Company",
        value: jobInformation.companyDetails.trim(),
      },
      {
        label: "Location",
        value: formatLocation(formData),
      },
      {
        label: "Job Type",
        value: jobInformation.jobType
          ? labelForOption(JOB_TYPE_OPTIONS, jobInformation.jobType)
          : "",
      },
      {
        label: "Work Mode",
        value: jobInformation.workMode
          ? labelForOption(WORK_MODE_OPTIONS, jobInformation.workMode)
          : "",
      },
      {
        label: "Salary",
        value: formatSalary(formData),
      },
      {
        label: "Vacancies",
        value: jobInformation.vacancies.trim(),
      },
      {
        label: "Experience",
        value: formData.candidateAndInterview.experienceRequired
          ? labelForOption(
              POST_JOB_EXPERIENCE_OPTIONS,
              formData.candidateAndInterview.experienceRequired,
            )
          : "",
      },
      {
        label: "Education",
        value: formatEducation(formData),
      },
      {
        label: "Language",
        value: formatLanguages(formData),
      },
      {
        label: "Benefits",
        value: formatPerks(formData),
      },
    ],
  };
}
