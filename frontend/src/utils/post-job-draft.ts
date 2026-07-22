import { POST_JOB_INITIAL_WIZARD_DATA } from "@/constants/post-job";
import type {
  EmployerJobDetail,
  PostJobWizardSnapshot,
  SaveDraftJobPayload,
} from "@/types/employer-jobs";
import type {
  PostJobActiveStep,
  PostJobWizardFormData,
} from "@/types/post-job";

export function hasMeaningfulPostJobDraftContent(
  formData: PostJobWizardFormData,
): boolean {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;

  const stringFields = [
    jobInformation.companyDetails,
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

  if (locationAndSalary.perks.length > 0) {
    return true;
  }

  if (candidateAndInterview.education.length > 0) {
    return true;
  }

  if (candidateAndInterview.languages.length > 0) {
    return true;
  }

  if (candidateAndInterview.gender.length > 0) {
    return true;
  }

  return false;
}

export function mapWizardDataToDraftPayload(
  formData: PostJobWizardFormData,
  completedStep: PostJobActiveStep,
): SaveDraftJobPayload {
  return {
    completedStep,
    wizardSnapshot: structuredClone(formData) as PostJobWizardSnapshot,
  };
}

export function mapJobDetailToWizardState(job: EmployerJobDetail): {
  formData: PostJobWizardFormData;
  activeStep: PostJobActiveStep;
} {
  const snapshot = job.wizardSnapshot;
  const completedStep = ([1, 2, 3].includes(job.completedStep)
    ? job.completedStep
    : 1) as PostJobActiveStep;

  if (snapshot) {
    return {
      formData: {
        jobInformation: {
          ...POST_JOB_INITIAL_WIZARD_DATA.jobInformation,
          ...snapshot.jobInformation,
          jobType:
            (snapshot.jobInformation.jobType as PostJobWizardFormData["jobInformation"]["jobType"]) ||
            "",
          partTimeSchedule:
            (snapshot.jobInformation
              .partTimeSchedule as PostJobWizardFormData["jobInformation"]["partTimeSchedule"]) ||
            "",
          workMode:
            (snapshot.jobInformation.workMode as PostJobWizardFormData["jobInformation"]["workMode"]) ||
            "",
        },
        locationAndSalary: {
          ...POST_JOB_INITIAL_WIZARD_DATA.locationAndSalary,
          ...snapshot.locationAndSalary,
          salaryType:
            (snapshot.locationAndSalary
              .salaryType as PostJobWizardFormData["locationAndSalary"]["salaryType"]) ||
            "",
          perks: (snapshot.locationAndSalary.perks ??
            []) as PostJobWizardFormData["locationAndSalary"]["perks"],
        },
        candidateAndInterview: {
          ...POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
          ...snapshot.candidateAndInterview,
          education: (snapshot.candidateAndInterview.education ??
            []) as PostJobWizardFormData["candidateAndInterview"]["education"],
          experienceRequired:
            (snapshot.candidateAndInterview
              .experienceRequired as PostJobWizardFormData["candidateAndInterview"]["experienceRequired"]) ||
            "",
          additionalRequirements: {
            ...POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview
              .additionalRequirements,
            ...snapshot.candidateAndInterview.additionalRequirements,
          },
          languages: (snapshot.candidateAndInterview.languages ??
            []) as PostJobWizardFormData["candidateAndInterview"]["languages"],
          gender: (snapshot.candidateAndInterview.gender ??
            []) as PostJobWizardFormData["candidateAndInterview"]["gender"],
          walkIn:
            (snapshot.candidateAndInterview
              .walkIn as PostJobWizardFormData["candidateAndInterview"]["walkIn"]) ||
            "yes",
        },
      },
      activeStep: completedStep,
    };
  }

  return {
    formData: {
      jobInformation: {
        ...POST_JOB_INITIAL_WIZARD_DATA.jobInformation,
        companyDetails: job.companyName,
        jobTitle: job.jobTitle === "Untitled draft" ? "" : job.jobTitle,
        jobType:
          (job.jobType as PostJobWizardFormData["jobInformation"]["jobType"]) ||
          "",
        contractPeriodFrom: job.contractPeriodFrom,
        contractPeriodTo: job.contractPeriodTo,
        partTimeSchedule:
          (job.partTimeSchedule as PostJobWizardFormData["jobInformation"]["partTimeSchedule"]) ||
          "",
        partTimeStartTime: job.partTimeStartTime,
        partTimeEndTime: job.partTimeEndTime,
        partTimeFlexibleHours: job.partTimeFlexibleHours,
        workMode:
          (job.workMode as PostJobWizardFormData["jobInformation"]["workMode"]) ||
          "",
        vacancies: job.vacancies ? String(job.vacancies) : "",
        jobDescription: job.description,
      },
      locationAndSalary: {
        ...POST_JOB_INITIAL_WIZARD_DATA.locationAndSalary,
        state: job.stateName || job.state,
        city: job.cityName || job.city,
        address: job.address,
        landmark: job.landmark,
        salaryType:
          (job.salaryType as PostJobWizardFormData["locationAndSalary"]["salaryType"]) ||
          "",
        salaryMin:
          job.minimumSalary != null ? String(job.minimumSalary) : "",
        salaryMax:
          job.maximumSalary != null ? String(job.maximumSalary) : "",
        incentives: job.fixedSalary != null ? String(job.fixedSalary) : "",
        perks: job.perks as PostJobWizardFormData["locationAndSalary"]["perks"],
      },
      candidateAndInterview: {
        ...POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
        education:
          job.education as PostJobWizardFormData["candidateAndInterview"]["education"],
        experienceRequired:
          (job.experience as PostJobWizardFormData["candidateAndInterview"]["experienceRequired"]) ||
          "",
        languages:
          job.languages as PostJobWizardFormData["candidateAndInterview"]["languages"],
        gender:
          job.gender as PostJobWizardFormData["candidateAndInterview"]["gender"],
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
    activeStep: completedStep,
  };
}
