import type {
  EmployerAccountType,
  PostJobActiveStep,
  PostJobWizardFormData,
} from "@/types/post-job";
import { POST_JOB_LONG_TEXT_MAX_LENGTH } from "@/constants/post-job";

export type PostJobFieldErrors = Record<string, string>;

export type PostJobValidationContext = {
  accountType?: EmployerAccountType | null;
};

/** Maps wizard field keys to DOM element ids for scroll/focus. */
export const POST_JOB_FIELD_ELEMENT_IDS: Record<string, string> = {
  companyDetails: "company-details",
  industry: "job-industry",
  businessCategory: "job-business-category",
  companySize: "job-company-size",
  jobTitle: "job-title",
  jobType: "job-type-group",
  contractPeriodFrom: "contract-period-from",
  contractPeriodTo: "contract-period-to",
  partTimeSchedule: "part-time-schedule-group",
  partTimeStartTime: "part-time-start-time",
  partTimeEndTime: "part-time-end-time",
  partTimeFlexibleHours: "part-time-flexible-hours",
  workMode: "work-mode-group",
  vacancies: "job-vacancies",
  jobDescription: "job-description",
  state: "job-state",
  city: "job-city",
  address: "job-address",
  salaryType: "salary-type",
  salaryPeriod: "salary-period",
  incentives: "salary-incentives",
  salaryMin: "salary-min",
  salaryMax: "salary-max",
  education: "education-group",
  experienceRequired: "experience-group",
  languages: "language-group",
  gender: "gender-group",
  ageMin: "age-min",
  ageMax: "age-max",
  walkInAddress: "walk-in-address",
  walkInStartDate: "walk-in-start-date",
  walkInEndDate: "walk-in-end-date",
  walkInStartTime: "walk-in-start-time",
  walkInEndTime: "walk-in-end-time",
  otherInstructions: "other-instructions",
  contactName: "contact-name",
  contactEmail: "contact-email",
  contactMobile: "contact-mobile",
};

function requireText(
  value: string,
  field: string,
  message: string,
  errors: PostJobFieldErrors,
) {
  if (!value.trim()) {
    errors[field] = message;
  }
}

function toNumber(value: string): number {
  return Number(value.trim().replace(/[^\d.]/g, ""));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidMobile(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

export function focusFirstInvalidPostJobField(errors: PostJobFieldErrors) {
  const firstField = Object.keys(errors)[0];
  if (!firstField) {
    return;
  }

  const elementId = POST_JOB_FIELD_ELEMENT_IDS[firstField] ?? firstField;
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });

  const focusTarget =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLButtonElement
      ? element
      : element.querySelector<HTMLElement>(
          "input, textarea, select, button",
        );

  focusTarget?.focus({ preventScroll: true });
}

export function validateJobInformationStep(
  formData: PostJobWizardFormData["jobInformation"],
  context: PostJobValidationContext = {},
): PostJobFieldErrors {
  const errors: PostJobFieldErrors = {};
  const isConsultancy = context.accountType === "consultancy";

  if (isConsultancy) {
    requireText(
      formData.companyDetails,
      "companyDetails",
      "Recruiting For is required.",
      errors,
    );
    requireText(
      formData.companySize,
      "companySize",
      "Please select Company Size.",
      errors,
    );
    requireText(
      formData.industry,
      "industry",
      "Please select Industry.",
      errors,
    );
    requireText(
      formData.businessCategory,
      "businessCategory",
      "Please select Business Category.",
      errors,
    );
  } else {
    requireText(
      formData.companyDetails,
      "companyDetails",
      context.accountType === "individual"
        ? "Establishment Name is required."
        : "Company Name is required.",
      errors,
    );
  }

  requireText(
    formData.jobTitle,
    "jobTitle",
    "Job Title is required.",
    errors,
  );

  if (!formData.jobType) {
    errors.jobType = "Please select Job Type.";
  }

  if (formData.jobType === "contract") {
    requireText(
      formData.contractPeriodFrom,
      "contractPeriodFrom",
      "Contract Period is required.",
      errors,
    );
    requireText(
      formData.contractPeriodTo,
      "contractPeriodTo",
      "Contract Period is required.",
      errors,
    );
  }

  if (formData.jobType === "part-time") {
    if (!formData.partTimeSchedule) {
      errors.partTimeSchedule = "Please select Part Time Schedule.";
    } else if (formData.partTimeSchedule === "fixed-timings") {
      requireText(
        formData.partTimeStartTime,
        "partTimeStartTime",
        "Start Time is required.",
        errors,
      );
      requireText(
        formData.partTimeEndTime,
        "partTimeEndTime",
        "End Time is required.",
        errors,
      );
    } else if (formData.partTimeSchedule === "flexible-hours") {
      requireText(
        formData.partTimeFlexibleHours,
        "partTimeFlexibleHours",
        "Flexible hours are required.",
        errors,
      );
    }
  }

  if (!formData.workMode) {
    errors.workMode = "Please select Work Mode.";
  }

  requireText(
    formData.vacancies,
    "vacancies",
    "Please enter Number of Vacancies.",
    errors,
  );
  if (formData.vacancies.trim() && Number(formData.vacancies) < 1) {
    errors.vacancies = "Please enter Number of Vacancies.";
  }

  requireText(
    formData.jobDescription,
    "jobDescription",
    "Job Description is required.",
    errors,
  );
  if (
    formData.jobDescription.trim() &&
    formData.jobDescription.length > POST_JOB_LONG_TEXT_MAX_LENGTH
  ) {
    errors.jobDescription = `Job Description must be ${POST_JOB_LONG_TEXT_MAX_LENGTH} characters or less.`;
  }

  return errors;
}

export function validateLocationSalaryStep(
  formData: PostJobWizardFormData["locationAndSalary"],
): PostJobFieldErrors {
  const errors: PostJobFieldErrors = {};

  requireText(formData.state, "state", "Please select State.", errors);
  requireText(formData.city, "city", "Please enter City.", errors);
  requireText(formData.address, "address", "Please enter Address.", errors);

  if (!formData.salaryType) {
    errors.salaryType = "Please select Salary Type.";
  } else if (formData.salaryType === "fixed") {
    requireText(
      formData.incentives,
      "incentives",
      "Please enter Fixed Salary.",
      errors,
    );
  } else if (formData.salaryType === "range") {
    requireText(
      formData.salaryMin,
      "salaryMin",
      "Minimum Salary is required.",
      errors,
    );
    requireText(
      formData.salaryMax,
      "salaryMax",
      "Maximum Salary is required.",
      errors,
    );

    if (formData.salaryMin.trim() && formData.salaryMax.trim()) {
      const min = toNumber(formData.salaryMin);
      const max = toNumber(formData.salaryMax);

      if (Number.isFinite(min) && Number.isFinite(max) && max <= min) {
        errors.salaryMax =
          "Maximum Salary must be greater than Minimum Salary.";
      }
    }
  }

  if (!formData.salaryPeriod) {
    errors.salaryPeriod = "Please select Salary Period.";
  }

  return errors;
}

export function validateCandidateInterviewStep(
  formData: PostJobWizardFormData["candidateAndInterview"],
): PostJobFieldErrors {
  const errors: PostJobFieldErrors = {};

  if (formData.education.length === 0) {
    errors.education = "Please select Education.";
  }

  if (!formData.experienceRequired) {
    errors.experienceRequired = "Please select Experience.";
  }

  if (formData.additionalRequirements.language) {
    if (formData.languages.length === 0) {
      errors.languages = "Please select Language.";
    }
  }

  if (formData.additionalRequirements.gender) {
    if (formData.gender.length === 0) {
      errors.gender = "Please select Gender.";
    }
  }

  if (formData.additionalRequirements.age) {
    requireText(
      formData.ageMin,
      "ageMin",
      "Minimum Age is required.",
      errors,
    );
    requireText(
      formData.ageMax,
      "ageMax",
      "Maximum Age is required.",
      errors,
    );

    if (formData.ageMin.trim() && formData.ageMax.trim()) {
      const minAge = Number(formData.ageMin);
      const maxAge = Number(formData.ageMax);

      if (
        Number.isFinite(minAge) &&
        Number.isFinite(maxAge) &&
        minAge > maxAge
      ) {
        errors.ageMax = "Maximum Age must be greater than Minimum Age.";
      }
    }
  }

  if (formData.walkIn === "yes") {
    requireText(
      formData.walkInAddress,
      "walkInAddress",
      "Interview Address is required.",
      errors,
    );
    requireText(
      formData.walkInStartDate,
      "walkInStartDate",
      "Please select Walk-in Start Date.",
      errors,
    );
    requireText(
      formData.walkInEndDate,
      "walkInEndDate",
      "Please select Walk-in End Date.",
      errors,
    );
    requireText(
      formData.walkInStartTime,
      "walkInStartTime",
      "Please select Walk-in Start Time.",
      errors,
    );
    requireText(
      formData.walkInEndTime,
      "walkInEndTime",
      "Please select Walk-in End Time.",
      errors,
    );

    if (
      formData.walkInStartDate.trim() &&
      formData.walkInEndDate.trim() &&
      formData.walkInEndDate < formData.walkInStartDate
    ) {
      errors.walkInEndDate =
        "Walk-in End Date must be on or after Start Date.";
    }

    if (
      formData.walkInStartTime.trim() &&
      formData.walkInEndTime.trim() &&
      formData.walkInEndTime <= formData.walkInStartTime
    ) {
      errors.walkInEndTime =
        "Walk-in End Time must be greater than Start Time.";
    }
  }

  if (
    formData.otherInstructions.trim() &&
    formData.otherInstructions.length > POST_JOB_LONG_TEXT_MAX_LENGTH
  ) {
    errors.otherInstructions = `Other Instructions must be ${POST_JOB_LONG_TEXT_MAX_LENGTH} characters or less.`;
  }

  requireText(
    formData.contactName,
    "contactName",
    "Contact Person Name is required.",
    errors,
  );

  if (!formData.contactMobile.trim()) {
    errors.contactMobile = "Please enter Mobile Number.";
  } else if (!isValidMobile(formData.contactMobile)) {
    errors.contactMobile = "Please enter Mobile Number.";
  }

  if (!formData.contactEmail.trim()) {
    errors.contactEmail = "Please enter a valid Email Address.";
  } else if (!isValidEmail(formData.contactEmail)) {
    errors.contactEmail = "Please enter a valid Email Address.";
  }

  return errors;
}

export function validatePostJobStep(
  step: PostJobActiveStep,
  formData: PostJobWizardFormData,
  context: PostJobValidationContext = {},
): PostJobFieldErrors {
  if (step === 1) {
    return validateJobInformationStep(formData.jobInformation, context);
  }

  if (step === 2) {
    return validateLocationSalaryStep(formData.locationAndSalary);
  }

  return validateCandidateInterviewStep(formData.candidateAndInterview);
}

export function findFirstInvalidPostJobStep(
  formData: PostJobWizardFormData,
  context: PostJobValidationContext = {},
): { step: PostJobActiveStep; errors: PostJobFieldErrors } | null {
  const step1Errors = validateJobInformationStep(
    formData.jobInformation,
    context,
  );
  if (Object.keys(step1Errors).length > 0) {
    return { step: 1, errors: step1Errors };
  }

  const step2Errors = validateLocationSalaryStep(formData.locationAndSalary);
  if (Object.keys(step2Errors).length > 0) {
    return { step: 2, errors: step2Errors };
  }

  const step3Errors = validateCandidateInterviewStep(
    formData.candidateAndInterview,
  );
  if (Object.keys(step3Errors).length > 0) {
    return { step: 3, errors: step3Errors };
  }

  return null;
}
