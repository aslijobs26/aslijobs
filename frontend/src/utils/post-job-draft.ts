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
  const revision = job.pendingLiveRevision;
  const source: EmployerJobDetail =
    revision && typeof revision === "object"
      ? {
          ...job,
          companyName: revision.companyName ?? job.companyName,
          industry: revision.industry ?? job.industry,
          businessCategory: revision.businessCategory ?? job.businessCategory,
          companySize: revision.companySize ?? job.companySize,
          jobTitle: revision.jobTitle ?? job.jobTitle,
          jobType: revision.jobType ?? job.jobType,
          contractPeriodFrom:
            revision.contractPeriodFrom ?? job.contractPeriodFrom,
          contractPeriodTo: revision.contractPeriodTo ?? job.contractPeriodTo,
          partTimeSchedule: revision.partTimeSchedule ?? job.partTimeSchedule,
          partTimeStartTime:
            revision.partTimeStartTime ?? job.partTimeStartTime,
          partTimeEndTime: revision.partTimeEndTime ?? job.partTimeEndTime,
          partTimeFlexibleHours:
            revision.partTimeFlexibleHours ?? job.partTimeFlexibleHours,
          workMode: revision.workMode ?? job.workMode,
          vacancies: revision.vacancies ?? job.vacancies,
          description: revision.description ?? job.description,
          state: revision.state ?? job.state,
          stateName: revision.stateName ?? job.stateName,
          city: revision.city ?? job.city,
          cityName: revision.cityName ?? job.cityName,
          address: revision.address ?? job.address,
          landmark: revision.landmark ?? job.landmark,
          salaryType: revision.salaryType ?? job.salaryType,
          salaryPeriod: revision.salaryPeriod ?? job.salaryPeriod,
          fixedSalary: revision.fixedSalary ?? job.fixedSalary,
          minimumSalary: revision.minimumSalary ?? job.minimumSalary,
          maximumSalary: revision.maximumSalary ?? job.maximumSalary,
          perks: revision.perks ?? job.perks,
          education: revision.education ?? job.education,
          experience: revision.experience ?? job.experience,
          languages: revision.languages ?? job.languages,
          gender: revision.gender ?? job.gender,
          minimumAge: revision.minimumAge ?? job.minimumAge,
          maximumAge: revision.maximumAge ?? job.maximumAge,
          walkInEnabled: revision.walkInEnabled ?? job.walkInEnabled,
          interviewAddress: revision.interviewAddress ?? job.interviewAddress,
          walkInStartDate: revision.walkInStartDate ?? job.walkInStartDate,
          walkInEndDate: revision.walkInEndDate ?? job.walkInEndDate,
          walkInStartTime: revision.walkInStartTime ?? job.walkInStartTime,
          walkInEndTime: revision.walkInEndTime ?? job.walkInEndTime,
          interviewInstructions:
            revision.interviewInstructions ?? job.interviewInstructions,
          contactPersonName:
            revision.contactPersonName ?? job.contactPersonName,
          contactEmail: revision.contactEmail ?? job.contactEmail,
          contactMobile: revision.contactMobile ?? job.contactMobile,
          // Prefer revision fields over draft wizard snapshot when reviewing edits.
          wizardSnapshot: null,
        }
      : job;

  const snapshot = source.wizardSnapshot;
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
          salaryPeriod:
            (snapshot.locationAndSalary
              .salaryPeriod as PostJobWizardFormData["locationAndSalary"]["salaryPeriod"]) ||
            "per-month",
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
          companyDetails: source.companyName,
          industry: source.industry ?? "",
          businessCategory: source.businessCategory ?? "",
          companySize: source.companySize ?? "",
          jobTitle: source.jobTitle === "Untitled draft" ? "" : source.jobTitle,
        jobType:
          (source.jobType as PostJobWizardFormData["jobInformation"]["jobType"]) ||
          "",
        contractPeriodFrom: source.contractPeriodFrom,
        contractPeriodTo: source.contractPeriodTo,
        partTimeSchedule:
          (source.partTimeSchedule as PostJobWizardFormData["jobInformation"]["partTimeSchedule"]) ||
          "",
        partTimeStartTime: source.partTimeStartTime,
        partTimeEndTime: source.partTimeEndTime,
        partTimeFlexibleHours: source.partTimeFlexibleHours,
        workMode:
          (source.workMode as PostJobWizardFormData["jobInformation"]["workMode"]) ||
          "",
        vacancies: source.vacancies ? String(source.vacancies) : "",
        jobDescription: source.description,
      },
      locationAndSalary: {
        ...POST_JOB_INITIAL_WIZARD_DATA.locationAndSalary,
        state: source.stateName || source.state,
        city: source.cityName || source.city,
        address: source.address,
        landmark: source.landmark,
        salaryType:
          (source.salaryType as PostJobWizardFormData["locationAndSalary"]["salaryType"]) ||
          "",
        salaryPeriod:
          (source.salaryPeriod as PostJobWizardFormData["locationAndSalary"]["salaryPeriod"]) ||
          "per-month",
        salaryMin:
          source.minimumSalary != null ? String(source.minimumSalary) : "",
        salaryMax:
          source.maximumSalary != null ? String(source.maximumSalary) : "",
        incentives: source.fixedSalary != null ? String(source.fixedSalary) : "",
        perks: source.perks as PostJobWizardFormData["locationAndSalary"]["perks"],
      },
      candidateAndInterview: {
        ...POST_JOB_INITIAL_WIZARD_DATA.candidateAndInterview,
        education:
          source.education as PostJobWizardFormData["candidateAndInterview"]["education"],
        experienceRequired:
          (source.experience as PostJobWizardFormData["candidateAndInterview"]["experienceRequired"]) ||
          "",
        languages:
          source.languages as PostJobWizardFormData["candidateAndInterview"]["languages"],
        gender:
          source.gender as PostJobWizardFormData["candidateAndInterview"]["gender"],
        ageMin: source.minimumAge != null ? String(source.minimumAge) : "",
        ageMax: source.maximumAge != null ? String(source.maximumAge) : "",
        walkIn: source.walkInEnabled ? "yes" : "no",
        walkInAddress: source.interviewAddress,
        walkInStartDate: source.walkInStartDate,
        walkInEndDate: source.walkInEndDate,
        walkInStartTime: source.walkInStartTime,
        walkInEndTime: source.walkInEndTime,
        otherInstructions: source.interviewInstructions,
        contactName: source.contactPersonName,
        contactEmail: source.contactEmail,
        contactMobile: source.contactMobile,
      },
    },
    activeStep: completedStep,
  };
}
