import { JOB_TYPE_OPTIONS } from "@/constants/post-job";
import {
  EMPLOYER_JOB_STATUS_LABELS,
  EMPLOYER_LIVE_CHANGE_PENDING_LABEL,
} from "@/constants/employer-jobs";
import type { EmployerJobDetail, JobStatus } from "@/types/employer-jobs";
import { formatEmployerJobLocationFull } from "@/utils/employer-jobs-format";

export type EmployerJobUiPhase =
  | "under_review"
  | "live_change_review"
  | "live"
  | "rejected"
  | "other";

export function resolveEmployerJobUiPhase(
  job: Pick<EmployerJobDetail, "status" | "liveChangeReviewStatus">,
): EmployerJobUiPhase {
  if (
    job.status === "active" &&
    job.liveChangeReviewStatus === "pending_approval"
  ) {
    return "live_change_review";
  }
  if (job.status === "pending_approval") {
    return "under_review";
  }
  if (job.status === "active") {
    return "live";
  }
  if (job.status === "rejected") {
    return "rejected";
  }
  return "other";
}

/** Employer-facing label for backend job status (never invents Live). */
export function getEmployerFacingJobStatusLabel(
  job: Pick<EmployerJobDetail, "status" | "liveChangeReviewStatus">,
): string {
  const phase = resolveEmployerJobUiPhase(job);
  if (phase === "under_review") {
    return "Under Review";
  }
  if (phase === "live_change_review") {
    return EMPLOYER_LIVE_CHANGE_PENDING_LABEL;
  }
  if (phase === "live") {
    return EMPLOYER_JOB_STATUS_LABELS.active;
  }
  if (phase === "rejected") {
    return EMPLOYER_JOB_STATUS_LABELS.rejected;
  }
  return EMPLOYER_JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status;
}

export function formatEmployerJobEmploymentTypeLabel(jobType: string): string {
  const match = JOB_TYPE_OPTIONS.find((option) => option.value === jobType);
  return match?.label ?? (jobType.trim() || "—");
}

export function formatEmployerJobSubmittedAt(job: EmployerJobDetail): string {
  const iso =
    job.submittedForApprovalAt?.trim() ||
    job.liveChangeSubmittedAt?.trim() ||
    job.createdAt?.trim() ||
    null;

  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatEmployerJobSummaryLocation(job: EmployerJobDetail): string {
  const formatted = formatEmployerJobLocationFull(
    job.cityName ?? "",
    job.stateName ?? "",
    job.city ?? "",
    job.state ?? "",
  );
  return formatted && formatted !== "—" ? formatted : "India";
}
