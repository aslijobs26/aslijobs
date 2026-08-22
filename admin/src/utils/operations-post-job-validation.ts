import type { OperationsPostJobWizardFormData } from "../types/operations-post-job";
import { OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH } from "../constants/operations-post-job";

export function validateOperationsPostJobStep(
  step: 1 | 2 | 3,
  formData: OperationsPostJobWizardFormData,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;

  if (step === 1) {
    if (!jobInformation.jobTitle.trim()) {
      errors.jobTitle = "Job title is required.";
    }
    if (!jobInformation.jobType) {
      errors.jobType = "Job type is required.";
    }
    if (!jobInformation.workMode) {
      errors.workMode = "Work mode is required.";
    }
    if (!jobInformation.vacancies.trim() || Number(jobInformation.vacancies) < 1) {
      errors.vacancies = "At least one vacancy is required.";
    }
    if (!jobInformation.jobDescription.trim()) {
      errors.jobDescription = "Job description is required.";
    } else if (
      jobInformation.jobDescription.length > OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH
    ) {
      errors.jobDescription = `Description must be ${OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH} characters or less.`;
    }
  }

  if (step === 2) {
    if (!locationAndSalary.state.trim()) {
      errors.state = "State is required.";
    }
    if (!locationAndSalary.city.trim()) {
      errors.city = "City is required.";
    }
    if (!locationAndSalary.address.trim()) {
      errors.address = "Job address is required.";
    }
    if (!locationAndSalary.salaryType) {
      errors.salaryType = "Salary type is required.";
    }
    if (!locationAndSalary.salaryPeriod) {
      errors.salaryPeriod = "Salary period is required.";
    }
    if (
      locationAndSalary.salaryType === "fixed" &&
      !locationAndSalary.incentives.trim()
    ) {
      errors.incentives = "Fixed salary is required.";
    }
    if (locationAndSalary.salaryType === "range") {
      if (!locationAndSalary.salaryMin.trim()) {
        errors.salaryMin = "Minimum salary is required.";
      }
      if (!locationAndSalary.salaryMax.trim()) {
        errors.salaryMax = "Maximum salary is required.";
      }
      if (
        Number(locationAndSalary.salaryMax) <= Number(locationAndSalary.salaryMin)
      ) {
        errors.salaryMax = "Maximum salary must be greater than minimum salary.";
      }
    }
  }

  if (step === 3) {
    if (candidateAndInterview.education.length === 0) {
      errors.education = "Select at least one education level.";
    }
    if (!candidateAndInterview.experienceRequired) {
      errors.experienceRequired = "Experience is required.";
    }
    if (!candidateAndInterview.contactName.trim()) {
      errors.contactName = "Contact name is required.";
    }
    if (!candidateAndInterview.contactEmail.trim()) {
      errors.contactEmail = "Contact email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateAndInterview.contactEmail.trim())
    ) {
      errors.contactEmail = "Enter a valid email address.";
    }
    if (!/^\d{10}$/.test(candidateAndInterview.contactMobile.trim())) {
      errors.contactMobile = "Mobile number must be 10 digits.";
    }
    if (candidateAndInterview.walkIn === "yes") {
      if (!candidateAndInterview.walkInAddress.trim()) {
        errors.walkInAddress = "Walk-in address is required.";
      }
      if (!candidateAndInterview.walkInStartDate) {
        errors.walkInStartDate = "Walk-in start date is required.";
      }
      if (!candidateAndInterview.walkInEndDate) {
        errors.walkInEndDate = "Walk-in end date is required.";
      }
      if (!candidateAndInterview.walkInStartTime) {
        errors.walkInStartTime = "Walk-in start time is required.";
      }
      if (!candidateAndInterview.walkInEndTime) {
        errors.walkInEndTime = "Walk-in end time is required.";
      }
    }
  }

  return errors;
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
