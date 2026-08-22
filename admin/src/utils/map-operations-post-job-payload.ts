import type { OperationsPostJobWizardFormData } from "../types/operations-post-job";

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(/[^\d.]/g, "");
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLocationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface OperationsPublishJobPayload {
  companyName: string;
  industry: string;
  businessCategory: string;
  companySize: string;
  jobTitle: string;
  jobType: "full-time" | "part-time" | "contract";
  contractPeriodFrom: string;
  contractPeriodTo: string;
  partTimeSchedule: string;
  partTimeStartTime: string;
  partTimeEndTime: string;
  partTimeFlexibleHours: string;
  workMode: "office" | "field" | "both" | "home";
  vacancies: number;
  description: string;
  state: string;
  stateName: string;
  city: string;
  cityName: string;
  address: string;
  landmark: string;
  salaryType: "fixed" | "range";
  salaryPeriod: "per-month" | "per-year";
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  perks: OperationsPostJobWizardFormData["locationAndSalary"]["perks"];
  education: OperationsPostJobWizardFormData["candidateAndInterview"]["education"];
  experience: OperationsPostJobWizardFormData["candidateAndInterview"]["experienceRequired"];
  languages: OperationsPostJobWizardFormData["candidateAndInterview"]["languages"];
  gender: OperationsPostJobWizardFormData["candidateAndInterview"]["gender"];
  minimumAge: number | null;
  maximumAge: number | null;
  walkInEnabled: boolean;
  interviewAddress: string;
  walkInStartDate: string;
  walkInEndDate: string;
  walkInStartTime: string;
  walkInEndTime: string;
  interviewInstructions: string;
  contactPersonName: string;
  contactEmail: string;
  contactMobile: string;
  status: "draft" | "active";
}

export function mapWizardDataToPublishPayload(
  formData: OperationsPostJobWizardFormData,
): OperationsPublishJobPayload {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;
  const walkInEnabled = candidateAndInterview.walkIn === "yes";
  const stateName = locationAndSalary.state.trim();
  const cityName = locationAndSalary.city.trim();

  return {
    companyName: jobInformation.companyDetails.trim(),
    industry: jobInformation.industry.trim(),
    businessCategory: jobInformation.businessCategory.trim(),
    companySize: jobInformation.companySize.trim(),
    jobTitle: jobInformation.jobTitle.trim(),
    jobType: jobInformation.jobType as OperationsPublishJobPayload["jobType"],
    contractPeriodFrom: jobInformation.contractPeriodFrom,
    contractPeriodTo: jobInformation.contractPeriodTo,
    partTimeSchedule: jobInformation.partTimeSchedule,
    partTimeStartTime: jobInformation.partTimeStartTime,
    partTimeEndTime: jobInformation.partTimeEndTime,
    partTimeFlexibleHours: jobInformation.partTimeFlexibleHours,
    workMode: jobInformation.workMode as OperationsPublishJobPayload["workMode"],
    vacancies: Number(jobInformation.vacancies),
    description: jobInformation.jobDescription.trim(),
    state: toLocationSlug(stateName) || stateName,
    stateName,
    city: toLocationSlug(cityName) || cityName,
    cityName,
    address: locationAndSalary.address.trim(),
    landmark: locationAndSalary.landmark.trim(),
    salaryType:
      locationAndSalary.salaryType as OperationsPublishJobPayload["salaryType"],
    salaryPeriod:
      locationAndSalary.salaryPeriod as OperationsPublishJobPayload["salaryPeriod"],
    fixedSalary:
      locationAndSalary.salaryType === "fixed"
        ? toOptionalNumber(locationAndSalary.incentives)
        : null,
    minimumSalary:
      locationAndSalary.salaryType === "range"
        ? toOptionalNumber(locationAndSalary.salaryMin)
        : null,
    maximumSalary:
      locationAndSalary.salaryType === "range"
        ? toOptionalNumber(locationAndSalary.salaryMax)
        : null,
    perks: locationAndSalary.perks,
    education: candidateAndInterview.education,
    experience: candidateAndInterview.experienceRequired,
    languages: candidateAndInterview.additionalRequirements.language
      ? candidateAndInterview.languages
      : [],
    gender: candidateAndInterview.additionalRequirements.gender
      ? candidateAndInterview.gender
      : [],
    minimumAge: candidateAndInterview.additionalRequirements.age
      ? toOptionalNumber(candidateAndInterview.ageMin)
      : null,
    maximumAge: candidateAndInterview.additionalRequirements.age
      ? toOptionalNumber(candidateAndInterview.ageMax)
      : null,
    walkInEnabled,
    interviewAddress: walkInEnabled
      ? candidateAndInterview.walkInAddress.trim()
      : "",
    walkInStartDate: walkInEnabled
      ? candidateAndInterview.walkInStartDate
      : "",
    walkInEndDate: walkInEnabled ? candidateAndInterview.walkInEndDate : "",
    walkInStartTime: walkInEnabled
      ? candidateAndInterview.walkInStartTime
      : "",
    walkInEndTime: walkInEnabled ? candidateAndInterview.walkInEndTime : "",
    interviewInstructions: candidateAndInterview.otherInstructions.trim(),
    contactPersonName: candidateAndInterview.contactName.trim(),
    contactEmail: candidateAndInterview.contactEmail.trim(),
    contactMobile: candidateAndInterview.contactMobile.trim(),
    status: "active",
  };
}
