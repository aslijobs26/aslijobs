import { JOB_POSTED_SUCCESS_STORAGE_KEY } from "@/constants/job-posted-success";
import type { JobPostedSuccessSummary } from "@/types/job-posted-success";

function isJobPostedSuccessSummary(
  value: unknown,
): value is JobPostedSuccessSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const summary = value as Partial<JobPostedSuccessSummary>;

  return (
    typeof summary.jobTitle === "string" &&
    typeof summary.companyName === "string" &&
    typeof summary.location === "string" &&
    typeof summary.salaryLabel === "string" &&
    typeof summary.jobTypeLabel === "string" &&
    typeof summary.status === "string" &&
    typeof summary.applications === "number" &&
    summary.visibility === "Public"
  );
}

export function setJobPostedSuccessSummary(
  summary: JobPostedSuccessSummary,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    JOB_POSTED_SUCCESS_STORAGE_KEY,
    JSON.stringify(summary),
  );
}

export function getJobPostedSuccessSummary(): JobPostedSuccessSummary | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(JOB_POSTED_SUCCESS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isJobPostedSuccessSummary(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearJobPostedSuccessSummary(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(JOB_POSTED_SUCCESS_STORAGE_KEY);
}
