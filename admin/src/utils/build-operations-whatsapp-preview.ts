import {
  OPERATIONS_POST_JOB_EDUCATION_OPTIONS,
  OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS,
  OPERATIONS_POST_JOB_LANGUAGE_OPTIONS,
  OPERATIONS_POST_JOB_PERK_OPTIONS,
  OPERATIONS_POST_JOB_TYPE_OPTIONS,
  OPERATIONS_POST_JOB_WORK_MODE_OPTIONS,
} from "../constants/operations-post-job";
import type { OperationsPostJobWizardFormData } from "../types/operations-post-job";

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

function formatSalary(formData: OperationsPostJobWizardFormData): string {
  const { salaryType, salaryPeriod, incentives, salaryMin, salaryMax } =
    formData.locationAndSalary;
  const periodSuffix = salaryPeriod === "per-year" ? " /year" : " /month";

  if (salaryType === "fixed" && incentives.trim()) {
    return `₹${incentives.trim()}${periodSuffix}`;
  }

  if (salaryType === "range" && (salaryMin.trim() || salaryMax.trim())) {
    const min = salaryMin.trim() ? `₹${salaryMin.trim()}` : "";
    const max = salaryMax.trim() ? `₹${salaryMax.trim()}` : "";
    if (min && max) return `${min} - ${max}${periodSuffix}`;
    return `${min || max}${periodSuffix}`;
  }

  return "";
}

function formatLocation(formData: OperationsPostJobWizardFormData): string {
  const { city, state } = formData.locationAndSalary;
  const parts = [city.trim(), state.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}

function formatPerks(formData: OperationsPostJobWizardFormData): string {
  const { perks } = formData.locationAndSalary;
  if (perks.length === 0) return "";
  const labels = perks.map((perk) => labelForOption(OPERATIONS_POST_JOB_PERK_OPTIONS, perk));
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")}, etc.`;
}

function formatEducation(formData: OperationsPostJobWizardFormData): string {
  const { education } = formData.candidateAndInterview;
  if (education.length === 0) return "";
  return education
    .map((item) => labelForOption(OPERATIONS_POST_JOB_EDUCATION_OPTIONS, item))
    .join(", ");
}

function formatLanguages(formData: OperationsPostJobWizardFormData): string {
  const { languages, additionalRequirements } = formData.candidateAndInterview;
  if (!additionalRequirements.language || languages.length === 0) return "";
  return languages
    .map((item) => labelForOption(OPERATIONS_POST_JOB_LANGUAGE_OPTIONS, item))
    .join(", ");
}

export function buildOperationsWhatsAppPreview(
  formData: OperationsPostJobWizardFormData,
  companyName: string,
): {
  jobTitle: string;
  rows: WhatsAppPreviewRow[];
} {
  const { jobInformation } = formData;

  return {
    jobTitle: jobInformation.jobTitle.trim() || "Job Title",
    rows: [
      { label: "Company", value: companyName || jobInformation.companyDetails.trim() },
      { label: "Location", value: formatLocation(formData) },
      {
        label: "Job Type",
        value: jobInformation.jobType
          ? labelForOption(OPERATIONS_POST_JOB_TYPE_OPTIONS, jobInformation.jobType)
          : "",
      },
      {
        label: "Work Mode",
        value: jobInformation.workMode
          ? labelForOption(OPERATIONS_POST_JOB_WORK_MODE_OPTIONS, jobInformation.workMode)
          : "",
      },
      { label: "Salary", value: formatSalary(formData) },
      { label: "Vacancies", value: jobInformation.vacancies.trim() },
      {
        label: "Experience",
        value: formData.candidateAndInterview.experienceRequired
          ? labelForOption(
              OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS,
              formData.candidateAndInterview.experienceRequired,
            )
          : "",
      },
      { label: "Education", value: formatEducation(formData) },
      { label: "Language", value: formatLanguages(formData) },
      { label: "Benefits", value: formatPerks(formData) },
    ],
  };
}
