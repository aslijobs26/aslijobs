import type { OperationsJobDetail } from "../types/operations-jobs";
import type {
  OperationsEmployerOption,
  OperationsPostJobWizardFormData,
} from "../types/operations-post-job";
import {
  OPERATIONS_POST_JOB_EDUCATION_OPTIONS,
  OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS,
  OPERATIONS_POST_JOB_GENDER_OPTIONS,
  OPERATIONS_POST_JOB_PERK_OPTIONS,
  OPERATIONS_POST_JOB_TYPE_OPTIONS,
  OPERATIONS_POST_JOB_WORK_MODE_OPTIONS,
} from "../constants/operations-post-job";

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatSalaryPreview(
  formData: OperationsPostJobWizardFormData,
): string {
  const { locationAndSalary } = formData;
  const period =
    locationAndSalary.salaryPeriod === "per-year" ? "/year" : "/month";

  if (
    locationAndSalary.salaryType === "fixed" &&
    locationAndSalary.incentives.trim()
  ) {
    const amount = Number(locationAndSalary.incentives.replace(/[^\d.]/g, ""));
    if (Number.isFinite(amount)) {
      return `₹${amount.toLocaleString("en-IN")} ${period}`;
    }
  }

  if (locationAndSalary.salaryType === "range") {
    const min = Number(locationAndSalary.salaryMin.replace(/[^\d.]/g, ""));
    const max = Number(locationAndSalary.salaryMax.replace(/[^\d.]/g, ""));
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")} ${period}`;
    }
  }

  return "";
}

export function mapWizardDataToPreviewDetail(
  formData: OperationsPostJobWizardFormData,
  employer: OperationsEmployerOption | null,
): OperationsJobDetail {
  const { jobInformation, locationAndSalary, candidateAndInterview } = formData;
  const cityName = locationAndSalary.city.trim();
  const stateName = locationAndSalary.state.trim();
  const locationLabel = [cityName, stateName].filter(Boolean).join(", ");
  const walkInEnabled = candidateAndInterview.walkIn === "yes";
  const companyName =
    employer?.displayName ||
    jobInformation.companyDetails.trim() ||
    "Employer not assigned";

  return {
    id: "preview",
    jobId: "Preview",
    employerId: employer?.id ?? "",
    companyId: employer?.id ?? "",
    companyName,
    industry: jobInformation.industry.trim(),
    businessCategory: jobInformation.businessCategory.trim(),
    companySize: jobInformation.companySize.trim(),
    jobTitle: jobInformation.jobTitle.trim() || "Untitled job",
    jobType: jobInformation.jobType,
    contractPeriodFrom: jobInformation.contractPeriodFrom,
    contractPeriodTo: jobInformation.contractPeriodTo,
    partTimeSchedule: jobInformation.partTimeSchedule,
    partTimeStartTime: jobInformation.partTimeStartTime,
    partTimeEndTime: jobInformation.partTimeEndTime,
    partTimeFlexibleHours: jobInformation.partTimeFlexibleHours,
    workMode: jobInformation.workMode,
    vacancies: Number(jobInformation.vacancies) || 0,
    description: jobInformation.jobDescription.trim(),
    state: stateName,
    stateName,
    city: cityName,
    cityName,
    address: locationAndSalary.address.trim(),
    landmark: locationAndSalary.landmark.trim(),
    locationLabel,
    salaryType: locationAndSalary.salaryType,
    salaryPeriod: locationAndSalary.salaryPeriod || "per-month",
    fixedSalary:
      locationAndSalary.salaryType === "fixed"
        ? Number(locationAndSalary.incentives.replace(/[^\d.]/g, "")) || null
        : null,
    minimumSalary:
      locationAndSalary.salaryType === "range"
        ? Number(locationAndSalary.salaryMin.replace(/[^\d.]/g, "")) || null
        : null,
    maximumSalary:
      locationAndSalary.salaryType === "range"
        ? Number(locationAndSalary.salaryMax.replace(/[^\d.]/g, "")) || null
        : null,
    salaryLabel: formatSalaryPreview(formData),
    perks: locationAndSalary.perks,
    education: candidateAndInterview.education,
    educationLabel: candidateAndInterview.education
      .map((value) => optionLabel(OPERATIONS_POST_JOB_EDUCATION_OPTIONS, value))
      .join(", "),
    experience: candidateAndInterview.experienceRequired,
    experienceLabel: optionLabel(
      OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS,
      candidateAndInterview.experienceRequired,
    ),
    languages: candidateAndInterview.additionalRequirements.language
      ? candidateAndInterview.languages
      : [],
    gender: candidateAndInterview.additionalRequirements.gender
      ? candidateAndInterview.gender
      : [],
    genderLabel: candidateAndInterview.additionalRequirements.gender
      ? candidateAndInterview.gender
          .map((value) => optionLabel(OPERATIONS_POST_JOB_GENDER_OPTIONS, value))
          .join(", ")
      : "",
    minimumAge: candidateAndInterview.additionalRequirements.age
      ? Number(candidateAndInterview.ageMin) || null
      : null,
    maximumAge: candidateAndInterview.additionalRequirements.age
      ? Number(candidateAndInterview.ageMax) || null
      : null,
    walkInEnabled,
    interviewAddress: walkInEnabled
      ? candidateAndInterview.walkInAddress.trim()
      : "",
    walkInStartDate: walkInEnabled ? candidateAndInterview.walkInStartDate : "",
    walkInEndDate: walkInEnabled ? candidateAndInterview.walkInEndDate : "",
    walkInStartTime: walkInEnabled ? candidateAndInterview.walkInStartTime : "",
    walkInEndTime: walkInEnabled ? candidateAndInterview.walkInEndTime : "",
    interviewInstructions: candidateAndInterview.otherInstructions.trim(),
    contactPersonName: candidateAndInterview.contactName.trim(),
    contactEmail: candidateAndInterview.contactEmail.trim(),
    contactMobile: candidateAndInterview.contactMobile.trim(),
    status: "draft",
    statusLabel: "Draft",
    listingPaymentStatus: "pending",
    paymentStatusLabel: "Pending",
    listingPackageLabel: "",
    listingValidUntil: null,
    isFeatured: false,
    visibilityLabel: "Draft",
    jobTypeLabel: optionLabel(
      OPERATIONS_POST_JOB_TYPE_OPTIONS,
      jobInformation.jobType,
    ),
    workModeLabel: optionLabel(
      OPERATIONS_POST_JOB_WORK_MODE_OPTIONS,
      jobInformation.workMode,
    ),
    completedStep: 1,
    lastEditedAt: null,
    publishedAt: null,
    reactivatedAt: null,
    lastStatusChangedAt: null,
    closedReason: "",
    closedAt: null,
    employerNotified: false,
    submittedForApprovalAt: null,
    reviewDecision: "",
    reviewedAt: null,
    reviewedByOperationsUserId: "",
    reviewedByLabel: "",
    rejectionReason: "",
    reviewNotificationSent: false,
    pendingLiveRevision: null,
    liveChangeReviewStatus: "",
    liveChangeSubmittedAt: null,
    liveChangeReviewedAt: null,
    liveChangeReviewedByOperationsUserId: "",
    liveChangeRejectionReason: "",
    isLiveChangeReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wizardSnapshot: formData,
    creationSource: "operations",
    employerAssigned: Boolean(employer?.id),
    employer: {
      id: employer?.id ?? "",
      companyName,
      logoUrl: employer?.logoUrl ?? "",
      isWhatsappVerified: employer?.isWhatsappVerified ?? false,
      registrationCompleted: employer?.registrationCompleted ?? false,
    },
    analytics: {
      views: 0,
      applications: 0,
      applicationRatePercent: null,
      shares: 0,
      bookmarks: 0,
      shortlisted: 0,
      interviews: 0,
      hired: 0,
      applicationsToday: 0,
      daysRemaining: null,
      autoExpiryAt: null,
    },
    activity: [],
  };
}

export function resolveOperationsPostJobWorkflowState(options: {
  employerAssigned: boolean;
  publishReady: boolean;
  status: OperationsJobDetail["status"];
}): { id: "draft" | "employer_assigned" | "ready_to_publish" | "live"; label: string } {
  if (options.status === "active") {
    return { id: "live", label: "Live" };
  }
  if (options.publishReady && options.employerAssigned) {
    return { id: "ready_to_publish", label: "Ready to Publish" };
  }
  if (options.employerAssigned) {
    return { id: "employer_assigned", label: "Employer Assigned" };
  }
  return { id: "draft", label: "Draft" };
}

export function perkLabel(perk: string): string {
  return (
    OPERATIONS_POST_JOB_PERK_OPTIONS.find((option) => option.value === perk)
      ?.label ?? perk.replace(/_/g, " ")
  );
}
