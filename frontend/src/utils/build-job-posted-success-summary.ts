import { JOB_TYPE_OPTIONS } from "@/constants/post-job";
import {
  JOB_POSTED_SUCCESS_FALLBACK_COMPANY,
  JOB_POSTED_SUCCESS_FALLBACK_JOB_TYPE,
  JOB_POSTED_SUCCESS_FALLBACK_LOCATION,
  JOB_POSTED_SUCCESS_FALLBACK_SALARY,
  JOB_POSTED_SUCCESS_FALLBACK_TITLE,
  JOB_POSTED_SUCCESS_VISIBILITY_PUBLIC,
} from "@/constants/job-posted-success";
import type { EmployerJobDetail, JobStatus } from "@/types/employer-jobs";
import type { JobPostedSuccessSummary } from "@/types/job-posted-success";
import type { PostJobWizardFormData } from "@/types/post-job";
import { formatEmployerJobLocationFull } from "@/utils/employer-jobs-format";

type JobPostedApiFields = Partial<
  Pick<
    EmployerJobDetail,
    | "id"
    | "jobId"
    | "jobTitle"
    | "companyName"
    | "city"
    | "cityName"
    | "state"
    | "stateName"
    | "jobType"
    | "salaryType"
    | "salaryPeriod"
    | "fixedSalary"
    | "minimumSalary"
    | "maximumSalary"
    | "status"
    | "applications"
  >
> & {
  publishedAt?: string | null;
};

function formatCurrencyAmount(value: number): string {
  return `₹ ${new Intl.NumberFormat("en-IN").format(value)}`;
}

function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d.]/g, "").trim();
  if (!digits) {
    return null;
  }

  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : null;
}

function salaryPeriodSuffix(period?: string | null): string {
  return period === "per-year" ? " /year" : " /month";
}

function formatSalaryFromForm(formData: PostJobWizardFormData): string {
  const { salaryType, salaryPeriod, incentives, salaryMin, salaryMax } =
    formData.locationAndSalary;
  const period = salaryPeriodSuffix(salaryPeriod);

  if (salaryType === "fixed") {
    const amount = parseAmount(incentives);
    if (amount !== null) {
      return `${formatCurrencyAmount(amount)}${period}`;
    }
  }

  if (salaryType === "range") {
    const min = parseAmount(salaryMin);
    const max = parseAmount(salaryMax);

    if (min !== null && max !== null) {
      return `${formatCurrencyAmount(min)} - ${formatCurrencyAmount(max)}${period}`;
    }

    if (min !== null) {
      return `${formatCurrencyAmount(min)}${period}`;
    }

    if (max !== null) {
      return `${formatCurrencyAmount(max)}${period}`;
    }
  }

  return "";
}

function formatSalaryFromJob(job: JobPostedApiFields): string {
  const period = salaryPeriodSuffix(job.salaryPeriod);

  if (job.salaryType === "fixed" && typeof job.fixedSalary === "number") {
    return `${formatCurrencyAmount(job.fixedSalary)}${period}`;
  }

  if (
    job.salaryType === "range" &&
    typeof job.minimumSalary === "number" &&
    typeof job.maximumSalary === "number"
  ) {
    return `${formatCurrencyAmount(job.minimumSalary)} - ${formatCurrencyAmount(job.maximumSalary)}${period}`;
  }

  if (typeof job.minimumSalary === "number") {
    return `${formatCurrencyAmount(job.minimumSalary)}${period}`;
  }

  if (typeof job.maximumSalary === "number") {
    return `${formatCurrencyAmount(job.maximumSalary)}${period}`;
  }

  if (typeof job.fixedSalary === "number") {
    return `${formatCurrencyAmount(job.fixedSalary)}${period}`;
  }

  return "";
}

function formatJobTypeLabel(jobType: string): string {
  const match = JOB_TYPE_OPTIONS.find((option) => option.value === jobType);
  return match?.label ?? jobType;
}

export function formatJobPostedSuccessDate(isoDate: string | null): string {
  if (!isoDate) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildJobPostedSuccessSummary(
  formData: PostJobWizardFormData,
  job?: JobPostedApiFields | null,
): JobPostedSuccessSummary {
  const formTitle = formData.jobInformation.jobTitle.trim();
  const formCompany = formData.jobInformation.companyDetails.trim();
  const formLocation = [
    formData.locationAndSalary.city.trim(),
    formData.locationAndSalary.state.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const apiLocation = job
    ? formatEmployerJobLocationFull(
        job.cityName ?? "",
        job.stateName ?? "",
        job.city ?? "",
        job.state ?? "",
      )
    : "";

  const salaryFromJob = job ? formatSalaryFromJob(job) : "";
  const salaryFromForm = formatSalaryFromForm(formData);

  const status: JobStatus =
    job?.status === "active" ||
    job?.status === "draft" ||
    job?.status === "paused" ||
    job?.status === "closed" ||
    job?.status === "expired"
      ? job.status
      : "active";

  return {
    jobMongoId: job?.id?.trim() || "",
    publicJobId: job?.jobId?.trim() || "",
    jobTitle:
      job?.jobTitle?.trim() || formTitle || JOB_POSTED_SUCCESS_FALLBACK_TITLE,
    companyName:
      job?.companyName?.trim() ||
      formCompany ||
      JOB_POSTED_SUCCESS_FALLBACK_COMPANY,
    location:
      (apiLocation && apiLocation !== "—" ? apiLocation : "") ||
      formLocation ||
      JOB_POSTED_SUCCESS_FALLBACK_LOCATION,
    salaryLabel:
      salaryFromJob || salaryFromForm || JOB_POSTED_SUCCESS_FALLBACK_SALARY,
    jobTypeLabel:
      formatJobTypeLabel(
        job?.jobType?.trim() || formData.jobInformation.jobType || "",
      ) || JOB_POSTED_SUCCESS_FALLBACK_JOB_TYPE,
    status,
    publishedAt: job?.publishedAt ?? new Date().toISOString(),
    applications:
      typeof job?.applications === "number" && job.applications >= 0
        ? job.applications
        : 0,
    visibility: JOB_POSTED_SUCCESS_VISIBILITY_PUBLIC,
  };
}
