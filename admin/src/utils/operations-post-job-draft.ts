import type {
  OperationsPostJobActiveStep,
  OperationsPostJobWizardFormData,
  SaveOperationsJobDraftPayload,
} from "../types/operations-post-job";
import { OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA } from "../constants/operations-post-job";

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

export function mapOperationsJobDetailToWizardState(job: {
  wizardSnapshot: unknown;
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
  salaryPeriod: string;
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
}): {
  formData: OperationsPostJobWizardFormData;
  activeStep: OperationsPostJobActiveStep;
} {
  const snapshot = job.wizardSnapshot as OperationsPostJobWizardFormData | null;
  const activeStep = ([1, 2, 3].includes(job.completedStep)
    ? job.completedStep
    : 1) as OperationsPostJobActiveStep;

  if (snapshot?.jobInformation && snapshot.locationAndSalary) {
    return {
      formData: {
        jobInformation: {
          ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.jobInformation,
          ...snapshot.jobInformation,
        },
        locationAndSalary: {
          ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.locationAndSalary,
          ...snapshot.locationAndSalary,
        },
        candidateAndInterview: {
          ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
          ...snapshot.candidateAndInterview,
        },
      },
      activeStep,
    };
  }

  return {
    formData: {
      jobInformation: {
        ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.jobInformation,
        companyDetails: job.companyName,
        industry: job.industry,
        businessCategory: job.businessCategory,
        companySize: job.companySize,
        jobTitle: job.jobTitle,
        jobType: job.jobType as OperationsPostJobWizardFormData["jobInformation"]["jobType"],
        contractPeriodFrom: job.contractPeriodFrom,
        contractPeriodTo: job.contractPeriodTo,
        partTimeSchedule:
          job.partTimeSchedule as OperationsPostJobWizardFormData["jobInformation"]["partTimeSchedule"],
        partTimeStartTime: job.partTimeStartTime,
        partTimeEndTime: job.partTimeEndTime,
        partTimeFlexibleHours: job.partTimeFlexibleHours,
        workMode: job.workMode as OperationsPostJobWizardFormData["jobInformation"]["workMode"],
        vacancies: job.vacancies ? String(job.vacancies) : "",
        jobDescription: job.description,
      },
      locationAndSalary: {
        ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.locationAndSalary,
        state: job.stateName,
        city: job.cityName,
        address: job.address,
        landmark: job.landmark,
        salaryType:
          job.salaryType as OperationsPostJobWizardFormData["locationAndSalary"]["salaryType"],
        salaryPeriod:
          job.salaryPeriod as OperationsPostJobWizardFormData["locationAndSalary"]["salaryPeriod"],
        salaryMin: job.minimumSalary != null ? String(job.minimumSalary) : "",
        salaryMax: job.maximumSalary != null ? String(job.maximumSalary) : "",
        incentives: job.fixedSalary != null ? String(job.fixedSalary) : "",
        perks: job.perks as OperationsPostJobWizardFormData["locationAndSalary"]["perks"],
      },
      candidateAndInterview: {
        ...OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
        education:
          job.education as OperationsPostJobWizardFormData["candidateAndInterview"]["education"],
        experienceRequired:
          job.experience as OperationsPostJobWizardFormData["candidateAndInterview"]["experienceRequired"],
        languages:
          job.languages as OperationsPostJobWizardFormData["candidateAndInterview"]["languages"],
        gender:
          job.gender as OperationsPostJobWizardFormData["candidateAndInterview"]["gender"],
        ageMin: job.minimumAge != null ? String(job.minimumAge) : "",
        ageMax: job.maximumAge != null ? String(job.maximumAge) : "",
        walkIn: job.walkInEnabled ? "yes" : "no",
        walkInAddress: job.interviewAddress,
        walkInStartDate: job.walkInStartDate,
        walkInEndDate: job.walkInEndDate,
        walkInStartTime: job.walkInStartTime,
        walkInEndTime: job.walkInEndTime,
        otherInstructions: job.interviewInstructions,
        contactName: job.contactPersonName,
        contactEmail: job.contactEmail,
        contactMobile: job.contactMobile,
      },
    },
    activeStep,
  };
}
