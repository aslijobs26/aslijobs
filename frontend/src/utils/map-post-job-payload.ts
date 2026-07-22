import { JOB_CITIES, JOB_STATES } from "@/constants/job-locations";
import type { CreateJobPayload } from "@/types/employer-jobs";
import type { PostJobWizardFormData } from "@/types/post-job";

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

function resolveStateName(stateValue: string): string {
  const trimmed = stateValue.trim();
  return JOB_STATES.find((state) => state.id === trimmed)?.name ?? trimmed;
}

function resolveCityName(cityValue: string): string {
  const trimmed = cityValue.trim();
  return JOB_CITIES.find((city) => city.id === trimmed)?.name ?? trimmed;
}

export function mapWizardDataToCreateJobPayload(
  formData: PostJobWizardFormData,
  status: CreateJobPayload["status"] = "active",
): CreateJobPayload {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;
  const walkInEnabled = candidateAndInterview.walkIn === "yes";

  return {
    companyName: jobInformation.companyDetails.trim(),
    jobTitle: jobInformation.jobTitle.trim(),
    jobType: jobInformation.jobType as CreateJobPayload["jobType"],
    contractPeriodFrom: jobInformation.contractPeriodFrom,
    contractPeriodTo: jobInformation.contractPeriodTo,
    partTimeSchedule: jobInformation.partTimeSchedule,
    partTimeStartTime: jobInformation.partTimeStartTime,
    partTimeEndTime: jobInformation.partTimeEndTime,
    partTimeFlexibleHours: jobInformation.partTimeFlexibleHours,
    workMode: jobInformation.workMode as CreateJobPayload["workMode"],
    vacancies: Number(jobInformation.vacancies),
    description: jobInformation.jobDescription.trim(),
    state: toLocationSlug(locationAndSalary.state) || locationAndSalary.state.trim(),
    stateName: resolveStateName(locationAndSalary.state),
    city: toLocationSlug(locationAndSalary.city) || locationAndSalary.city.trim(),
    cityName: resolveCityName(locationAndSalary.city),
    address: locationAndSalary.address.trim(),
    landmark: locationAndSalary.landmark.trim(),
    salaryType: locationAndSalary.salaryType as CreateJobPayload["salaryType"],
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
    status,
  };
}
