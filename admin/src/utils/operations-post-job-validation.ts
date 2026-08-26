import type { OperationsPostJobWizardFormData } from "../types/operations-post-job";
import { OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH } from "../constants/operations-post-job";
import {
  getJobDescriptionPlainTextLength,
  isJobDescriptionEmpty,
} from "./job-description-html";

function validateJobInformationCore(
  jobInformation: OperationsPostJobWizardFormData["jobInformation"],
  options: { requireCompanyProfile: boolean },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!jobInformation.companyDetails.trim()) {
    errors.companyDetails = "Company Name is required.";
  }
  if (options.requireCompanyProfile) {
    if (!jobInformation.companySize.trim()) {
      errors.companySize = "Please select Company Size.";
    }
    if (!jobInformation.industry.trim()) {
      errors.industry = "Please select Industry.";
    }
    if (!jobInformation.businessCategory.trim()) {
      errors.businessCategory = "Please select Business Category.";
    }
  }
  if (!jobInformation.jobTitle.trim()) {
    errors.jobTitle = "Job Title is required.";
  }
  if (!jobInformation.jobType) {
    errors.jobType = "Please select Job Type.";
  }
  if (jobInformation.jobType === "contract") {
    if (!jobInformation.contractPeriodFrom.trim()) {
      errors.contractPeriodFrom = "Contract Period is required.";
    }
    if (!jobInformation.contractPeriodTo.trim()) {
      errors.contractPeriodTo = "Contract Period is required.";
    }
  }
  if (jobInformation.jobType === "part-time") {
    if (!jobInformation.partTimeSchedule) {
      errors.partTimeSchedule = "Please select Part Time Schedule.";
    } else if (jobInformation.partTimeSchedule === "fixed-timings") {
      if (!jobInformation.partTimeStartTime.trim()) {
        errors.partTimeStartTime = "Start Time is required.";
      }
      if (!jobInformation.partTimeEndTime.trim()) {
        errors.partTimeEndTime = "End Time is required.";
      }
    } else if (!jobInformation.partTimeFlexibleHours.trim()) {
      errors.partTimeFlexibleHours = "Flexible hours are required.";
    }
  }
  if (!jobInformation.workMode) {
    errors.workMode = "Please select Work Mode.";
  }
  if (!jobInformation.vacancies.trim() || Number(jobInformation.vacancies) < 1) {
    errors.vacancies = "Please enter Number of Vacancies.";
  }
  if (isJobDescriptionEmpty(jobInformation.jobDescription)) {
    errors.jobDescription = "Job Description is required.";
  } else if (
    getJobDescriptionPlainTextLength(jobInformation.jobDescription) >
    OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH
  ) {
    errors.jobDescription = `Job Description must be ${OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH} characters or less.`;
  }

  return errors;
}

function validateLocationSalaryStep(
  locationAndSalary: OperationsPostJobWizardFormData["locationAndSalary"],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!locationAndSalary.state.trim()) {
    errors.state = "Please select State.";
  }
  if (!locationAndSalary.city.trim()) {
    errors.city = "Please enter City.";
  }
  if (!locationAndSalary.address.trim()) {
    errors.address = "Please enter Address.";
  }
  if (!locationAndSalary.salaryType) {
    errors.salaryType = "Please select Salary Type.";
  }
  if (!locationAndSalary.salaryPeriod) {
    errors.salaryPeriod = "Please select Salary Period.";
  }
  if (
    locationAndSalary.salaryType === "fixed" &&
    !locationAndSalary.incentives.trim()
  ) {
    errors.incentives = "Please enter Fixed Salary.";
  }
  if (locationAndSalary.salaryType === "range") {
    if (!locationAndSalary.salaryMin.trim()) {
      errors.salaryMin = "Minimum Salary is required.";
    }
    if (!locationAndSalary.salaryMax.trim()) {
      errors.salaryMax = "Maximum Salary is required.";
    }
    if (locationAndSalary.salaryMin.trim() && locationAndSalary.salaryMax.trim()) {
      if (
        Number(locationAndSalary.salaryMax) <= Number(locationAndSalary.salaryMin)
      ) {
        errors.salaryMax = "Maximum Salary must be greater than Minimum Salary.";
      }
    }
  }

  return errors;
}

function validateCandidateInterviewStep(
  candidateAndInterview: OperationsPostJobWizardFormData["candidateAndInterview"],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (candidateAndInterview.education.length === 0) {
    errors.education = "Please select Education.";
  }
  if (!candidateAndInterview.experienceRequired) {
    errors.experienceRequired = "Please select Experience.";
  }
  if (
    candidateAndInterview.additionalRequirements.language &&
    candidateAndInterview.languages.length === 0
  ) {
    errors.languages = "Please select Language.";
  }
  if (
    candidateAndInterview.additionalRequirements.gender &&
    candidateAndInterview.gender.length === 0
  ) {
    errors.gender = "Please select Gender.";
  }
  if (candidateAndInterview.additionalRequirements.age) {
    if (!candidateAndInterview.ageMin.trim()) {
      errors.ageMin = "Minimum Age is required.";
    }
    if (!candidateAndInterview.ageMax.trim()) {
      errors.ageMax = "Maximum Age is required.";
    }
    if (
      candidateAndInterview.ageMin.trim() &&
      candidateAndInterview.ageMax.trim() &&
      Number(candidateAndInterview.ageMin) > Number(candidateAndInterview.ageMax)
    ) {
      errors.ageMax = "Maximum Age must be greater than Minimum Age.";
    }
  }
  if (!candidateAndInterview.contactName.trim()) {
    errors.contactName = "Contact Person Name is required.";
  }
  if (!candidateAndInterview.contactEmail.trim()) {
    errors.contactEmail = "Please enter a valid Email Address.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateAndInterview.contactEmail.trim())
  ) {
    errors.contactEmail = "Please enter a valid Email Address.";
  }
  if (!/^\d{10}$/.test(candidateAndInterview.contactMobile.trim())) {
    errors.contactMobile = "Please enter Mobile Number.";
  }
  if (candidateAndInterview.walkIn === "yes") {
    if (!candidateAndInterview.walkInAddress.trim()) {
      errors.walkInAddress = "Interview Address is required.";
    }
    if (!candidateAndInterview.walkInStartDate) {
      errors.walkInStartDate = "Please select Walk-in Start Date.";
    }
    if (!candidateAndInterview.walkInEndDate) {
      errors.walkInEndDate = "Please select Walk-in End Date.";
    }
    if (!candidateAndInterview.walkInStartTime) {
      errors.walkInStartTime = "Please select Walk-in Start Time.";
    }
    if (!candidateAndInterview.walkInEndTime) {
      errors.walkInEndTime = "Please select Walk-in End Time.";
    }
    if (
      candidateAndInterview.walkInStartDate &&
      candidateAndInterview.walkInEndDate &&
      candidateAndInterview.walkInEndDate < candidateAndInterview.walkInStartDate
    ) {
      errors.walkInEndDate = "Walk-in End Date must be on or after Start Date.";
    }
    if (
      candidateAndInterview.walkInStartTime &&
      candidateAndInterview.walkInEndTime &&
      candidateAndInterview.walkInEndTime <= candidateAndInterview.walkInStartTime
    ) {
      errors.walkInEndTime = "Walk-in End Time must be greater than Start Time.";
    }
  }
  if (
    candidateAndInterview.otherInstructions.trim() &&
    candidateAndInterview.otherInstructions.length >
      OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH
  ) {
    errors.otherInstructions = `Other Instructions must be ${OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH} characters or less.`;
  }

  return errors;
}

export function validateOperationsPostJobStep(
  step: 1 | 2 | 3,
  formData: OperationsPostJobWizardFormData,
): Record<string, string> {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;

  if (step === 1) {
    return validateJobInformationCore(jobInformation, {
      requireCompanyProfile: true,
    });
  }
  if (step === 2) {
    return validateLocationSalaryStep(locationAndSalary);
  }
  return validateCandidateInterviewStep(candidateAndInterview);
}

/**
 * Validation for the Aligned Post/Edit Job wizard.
 * Matches fields collected in that form (no separate Industry / Company Size / Category inputs).
 */
export function validateOperationsAlignedPostJobStep(
  step: 1 | 2 | 3,
  formData: OperationsPostJobWizardFormData,
): Record<string, string> {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;

  if (step === 1) {
    return validateJobInformationCore(jobInformation, {
      requireCompanyProfile: false,
    });
  }
  if (step === 2) {
    return validateLocationSalaryStep(locationAndSalary);
  }
  return validateCandidateInterviewStep(candidateAndInterview);
}

export function validateOperationsPostJobForPublish(
  formData: OperationsPostJobWizardFormData,
): Record<string, string> {
  return {
    ...validateOperationsPostJobStep(1, formData),
    ...validateOperationsPostJobStep(2, formData),
    ...validateOperationsPostJobStep(3, formData),
  };
}

export function validateOperationsAlignedPostJobForPublish(
  formData: OperationsPostJobWizardFormData,
): Record<string, string> {
  return {
    ...validateOperationsAlignedPostJobStep(1, formData),
    ...validateOperationsAlignedPostJobStep(2, formData),
    ...validateOperationsAlignedPostJobStep(3, formData),
  };
}
