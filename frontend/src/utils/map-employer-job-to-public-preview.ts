import type { PublicJobDetail } from "@/services/public-jobs.service";
import type { EmployerJobDetail } from "@/types/employer-jobs";

function asJobType(value: string): PublicJobDetail["jobType"] {
  if (value === "part-time" || value === "contract" || value === "full-time") {
    return value;
  }
  return "full-time";
}

function asWorkMode(value: string): PublicJobDetail["workMode"] {
  if (
    value === "office" ||
    value === "field" ||
    value === "both" ||
    value === "home"
  ) {
    return value;
  }
  return "office";
}

function asSalaryType(value: string): PublicJobDetail["salaryType"] {
  return value === "range" ? "range" : "fixed";
}

function asSalaryPeriod(
  value: string | undefined,
): PublicJobDetail["salaryPeriod"] {
  if (value === "per-year" || value === "per-month") {
    return value;
  }
  return undefined;
}

function toApplyWhatsAppNumber(contactMobile: string): string | null {
  const digits = contactMobile.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }
  return digits;
}

export type EmployerJobPreviewFieldAccess = {
  canViewSalary: boolean;
  canViewBenefits: boolean;
  canViewContact: boolean;
};

/**
 * Maps employer job detail (all statuses) into the PublicJobDetail shape
 * used by JobDetailsCenterPanel so preview reuses the seeker job UI.
 */
export function mapEmployerJobDetailToPublicPreview(
  job: EmployerJobDetail,
  access: EmployerJobPreviewFieldAccess,
): PublicJobDetail {
  return {
    id: job.id,
    jobId: job.jobId,
    companyName: job.companyName,
    jobTitle: job.jobTitle,
    jobType: asJobType(job.jobType),
    workMode: asWorkMode(job.workMode),
    vacancies: job.vacancies,
    description: job.description,
    state: job.state,
    stateName: job.stateName,
    city: job.city,
    cityName: job.cityName,
    salaryType: asSalaryType(job.salaryType),
    salaryPeriod: asSalaryPeriod(job.salaryPeriod),
    fixedSalary: access.canViewSalary ? job.fixedSalary : null,
    minimumSalary: access.canViewSalary ? job.minimumSalary : null,
    maximumSalary: access.canViewSalary ? job.maximumSalary : null,
    perks: access.canViewBenefits ? job.perks : [],
    education: job.education,
    experience: job.experience,
    publishedAt: job.publishedAt ?? null,
    applyWhatsAppNumber: access.canViewContact
      ? toApplyWhatsAppNumber(job.contactMobile)
      : null,
    createdAt: job.createdAt,
    views: job.views,
    address: job.address,
    landmark: job.landmark,
    languages: job.languages,
    gender: job.gender,
    minimumAge: job.minimumAge,
    maximumAge: job.maximumAge,
    walkInEnabled: job.walkInEnabled,
    interviewAddress: job.interviewAddress,
    walkInStartDate: job.walkInStartDate,
    walkInEndDate: job.walkInEndDate,
    walkInStartTime: job.walkInStartTime,
    walkInEndTime: job.walkInEndTime,
    interviewInstructions: job.interviewInstructions,
    contactPersonName: access.canViewContact
      ? job.contactPersonName || null
      : null,
  };
}
