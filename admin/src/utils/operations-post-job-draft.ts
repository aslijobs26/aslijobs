import type {
  OperationsPostJobActiveStep,
  OperationsPostJobWizardFormData,
  SaveOperationsJobDraftPayload,
} from "../types/operations-post-job";
import { OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA } from "../constants/operations-post-job";

function asText(value: string | null | undefined): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function normalizeMobile(value: string | null | undefined): string {
  const digits = asText(value).replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function hasMeaningfulOperationsPostJobContent(
  formData: OperationsPostJobWizardFormData,
): boolean {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;

  const stringFields = [
    jobInformation.companyDetails,
    jobInformation.industry,
    jobInformation.businessCategory,
    jobInformation.companySize,
    jobInformation.jobTitle,
    jobInformation.jobType,
    jobInformation.contractPeriodFrom,
    jobInformation.contractPeriodTo,
    jobInformation.partTimeSchedule,
    jobInformation.partTimeStartTime,
    jobInformation.partTimeEndTime,
    jobInformation.partTimeFlexibleHours,
    jobInformation.workMode,
    jobInformation.vacancies,
    jobInformation.jobDescription,
    locationAndSalary.state,
    locationAndSalary.city,
    locationAndSalary.address,
    locationAndSalary.landmark,
    locationAndSalary.salaryType,
    locationAndSalary.salaryPeriod,
    locationAndSalary.salaryMin,
    locationAndSalary.salaryMax,
    locationAndSalary.incentives,
    candidateAndInterview.experienceRequired,
    candidateAndInterview.ageMin,
    candidateAndInterview.ageMax,
    candidateAndInterview.walkInAddress,
    candidateAndInterview.walkInStartDate,
    candidateAndInterview.walkInEndDate,
    candidateAndInterview.walkInStartTime,
    candidateAndInterview.walkInEndTime,
    candidateAndInterview.otherInstructions,
    candidateAndInterview.contactName,
    candidateAndInterview.contactEmail,
    candidateAndInterview.contactMobile,
  ];

  if (stringFields.some((value) => value.trim().length > 0)) {
    return true;
  }

  return (
    locationAndSalary.perks.length > 0 ||
    candidateAndInterview.education.length > 0 ||
    candidateAndInterview.languages.length > 0 ||
    candidateAndInterview.gender.length > 0
  );
}

export function mapWizardDataToOperationsDraftPayload(
  formData: OperationsPostJobWizardFormData,
  completedStep: OperationsPostJobActiveStep,
  employerId?: string | null,
): SaveOperationsJobDraftPayload {
  return {
    completedStep,
    wizardSnapshot: structuredClone(formData),
    employerId: employerId ?? null,
  };
}

/** Prefills the post-job wizard from persisted job fields (source of truth). */
export function mapOperationsJobDetailToWizardState(job: {
  wizardSnapshot?: unknown;
  completedStep: number;
  companyName: string;
  industry: string;
  businessCategory: string;
  companySize: string;
  jobTitle: string;
  jobType: string;
  contractPeriodFrom: string;
  contractPeriodTo: string;
  partTimeSchedule: string;
  partTimeStartTime: string;
  partTimeEndTime: string;
  partTimeFlexibleHours: string;
  workMode: string;
  vacancies: number;
  description: string;
  stateName: string;
  cityName: string;
  address: string;
  landmark: string;
  salaryType: string;
  salaryPeriod?: string;
  minimumSalary: number | null;
  maximumSalary: number | null;
  fixedSalary: number | null;
  perks: string[];
  education: string[];
  experience: string;
  languages: string[];
  gender: string[];
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
  employer?: { companyName?: string };
}): {
  formData: OperationsPostJobWizardFormData;
  activeStep: OperationsPostJobActiveStep;
} {
  const activeStep = ([1, 2, 3].includes(job.completedStep)
    ? job.completedStep
    : 1) as OperationsPostJobActiveStep;

  const languages = Array.isArray(job.languages) ? job.languages : [];
  const gender = Array.isArray(job.gender) ? job.gender : [];
  const education = Array.isArray(job.education) ? job.education : [];
  const perks = Array.isArray(job.perks) ? job.perks : [];
  const hasAge = job.minimumAge != null || job.maximumAge != null;

  const companyDetails =
    asText(job.companyName).trim() ||
    asText(job.employer?.companyName).trim() ||
    "";

  const fromJob: OperationsPostJobWizardFormData = {
    jobInformation: {
      ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.jobInformation,
      companyDetails,
      industry: asText(job.industry),
      businessCategory: asText(job.businessCategory),
      companySize: asText(job.companySize),
      jobTitle: asText(job.jobTitle),
      jobType:
        job.jobType as OperationsPostJobWizardFormData["jobInformation"]["jobType"],
      contractPeriodFrom: asText(job.contractPeriodFrom),
      contractPeriodTo: asText(job.contractPeriodTo),
      partTimeSchedule:
        job.partTimeSchedule as OperationsPostJobWizardFormData["jobInformation"]["partTimeSchedule"],
      partTimeStartTime: asText(job.partTimeStartTime),
      partTimeEndTime: asText(job.partTimeEndTime),
      partTimeFlexibleHours: asText(job.partTimeFlexibleHours),
      workMode:
        job.workMode as OperationsPostJobWizardFormData["jobInformation"]["workMode"],
      vacancies: job.vacancies ? String(job.vacancies) : "",
      jobDescription: asText(job.description),
    },
    locationAndSalary: {
      ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.locationAndSalary,
      state: asText(job.stateName),
      city: asText(job.cityName),
      address: asText(job.address),
      landmark: asText(job.landmark),
      salaryType:
        job.salaryType as OperationsPostJobWizardFormData["locationAndSalary"]["salaryType"],
      salaryPeriod: (asText(job.salaryPeriod).trim() ||
        "per-month") as OperationsPostJobWizardFormData["locationAndSalary"]["salaryPeriod"],
      salaryMin: job.minimumSalary != null ? String(job.minimumSalary) : "",
      salaryMax: job.maximumSalary != null ? String(job.maximumSalary) : "",
      incentives: job.fixedSalary != null ? String(job.fixedSalary) : "",
      perks: perks as OperationsPostJobWizardFormData["locationAndSalary"]["perks"],
    },
    candidateAndInterview: {
      ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
      education:
        education as OperationsPostJobWizardFormData["candidateAndInterview"]["education"],
      experienceRequired:
        asText(
          job.experience,
        ) as OperationsPostJobWizardFormData["candidateAndInterview"]["experienceRequired"],
      languages:
        languages as OperationsPostJobWizardFormData["candidateAndInterview"]["languages"],
      gender:
        gender as OperationsPostJobWizardFormData["candidateAndInterview"]["gender"],
      ageMin: job.minimumAge != null ? String(job.minimumAge) : "",
      ageMax: job.maximumAge != null ? String(job.maximumAge) : "",
      additionalRequirements: {
        language: languages.length > 0,
        gender: gender.length > 0,
        age: hasAge,
      },
      walkIn: job.walkInEnabled ? "yes" : "no",
      walkInAddress: asText(job.interviewAddress),
      walkInStartDate: asText(job.walkInStartDate),
      walkInEndDate: asText(job.walkInEndDate),
      walkInStartTime: asText(job.walkInStartTime),
      walkInEndTime: asText(job.walkInEndTime),
      otherInstructions: asText(job.interviewInstructions),
      contactName:
        asText(job.contactPersonName).trim() || companyDetails || "",
      contactEmail: asText(job.contactEmail),
      contactMobile: normalizeMobile(job.contactMobile),
    },
  };

  const snapshot = job.wizardSnapshot as OperationsPostJobWizardFormData | null;
  if (!snapshot?.jobInformation || !snapshot.locationAndSalary) {
    return { formData: fromJob, activeStep };
  }

  // Prefer live job values; keep snapshot values only where the live job field is empty.
  return {
    formData: {
      jobInformation: {
        ...snapshot.jobInformation,
        ...fromJob.jobInformation,
        industry:
          fromJob.jobInformation.industry.trim() ||
          asText(snapshot.jobInformation.industry),
        businessCategory:
          fromJob.jobInformation.businessCategory.trim() ||
          asText(snapshot.jobInformation.businessCategory),
        companySize:
          fromJob.jobInformation.companySize.trim() ||
          asText(snapshot.jobInformation.companySize),
        companyDetails:
          fromJob.jobInformation.companyDetails.trim() ||
          asText(snapshot.jobInformation.companyDetails),
      },
      locationAndSalary: {
        ...snapshot.locationAndSalary,
        ...fromJob.locationAndSalary,
        salaryPeriod:
          fromJob.locationAndSalary.salaryPeriod ||
          snapshot.locationAndSalary.salaryPeriod ||
          "per-month",
      },
      candidateAndInterview: {
        ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
        ...snapshot.candidateAndInterview,
        ...fromJob.candidateAndInterview,
        additionalRequirements: fromJob.candidateAndInterview.additionalRequirements,
        contactName:
          fromJob.candidateAndInterview.contactName.trim() ||
          asText(snapshot.candidateAndInterview?.contactName),
        contactEmail:
          fromJob.candidateAndInterview.contactEmail.trim() ||
          asText(snapshot.candidateAndInterview?.contactEmail),
        contactMobile:
          fromJob.candidateAndInterview.contactMobile ||
          normalizeMobile(snapshot.candidateAndInterview?.contactMobile),
      },
    },
    activeStep,
  };
}
