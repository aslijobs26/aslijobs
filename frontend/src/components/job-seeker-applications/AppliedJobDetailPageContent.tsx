"use client";

import { ApplicationInterviewDetails } from "@/components/applications/ApplicationInterviewDetails";
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import { ROUTES } from "@/constants/routes";
import {
  fetchSeekerApplication,
  withdrawSeekerApplication,
} from "@/services/job-seeker-applications.service";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type ApplicationStatusHistoryEntry,
} from "@/types/job-seeker-applications";
import { isResumeJson } from "@/types/job-seeker-resume";
import { cn } from "@/utils/cn";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type AppliedJobDetailPageContentProps = {
  applicationId: string;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Something went wrong. Please try again.";
}

function actorLabel(actorType: ApplicationStatusHistoryEntry["actorType"]): string {
  switch (actorType) {
    case "job_seeker":
      return "You";
    case "employer":
      return "Employer";
    default:
      return "System";
  }
}

export function AppliedJobDetailPageContent({
  applicationId,
}: AppliedJobDetailPageContentProps) {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["job-seeker", "application", applicationId],
    queryFn: () => fetchSeekerApplication(applicationId),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawSeekerApplication(applicationId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["job-seeker", "application", applicationId],
        data,
      );
      void queryClient.invalidateQueries({
        queryKey: ["job-seeker", "applications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["job-seeker", "application-stats"],
      });
      showAppToast("Application withdrawn.");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-primary-light/50" />
          <div className="h-4 w-72 max-w-full rounded bg-primary-light/30" />
          <div className="mt-6 h-64 rounded-xl bg-primary-light/25" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Application</h1>
        <p className="mt-3 text-sm text-muted">
          {getErrorMessage(detailQuery.error ?? new Error("Not found"))}
        </p>
        <Link
          href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
          className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
        >
          Back to My Applications
        </Link>
      </div>
    );
  }

  const application = detailQuery.data;
  const candidatePhone = readCandidatePhoneFromSnapshot(
    application.resumeSnapshot.resumeJson,
  );
  const status = application.status as ApplicationStatus;
  const jobHref = ROUTES.jobPublic(application.publicJobId);
  const meetingLink = application.interview?.meetingLink?.trim() || "";
  const canJoinInterview =
    status === "interview_scheduled" && Boolean(meetingLink);
  const showPrepareInterview =
    status === "shortlisted" ||
    status === "interview_scheduled" ||
    status === "interview_completed";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link
          href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
        >
          <ArrowLeft className="size-3.5 sm:size-4" aria-hidden="true" />
          Back to My Applications
        </Link>
      </div>

      <header className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {application.jobTitle}
            </h1>
            <p className="mt-1 text-xs font-medium text-primary sm:text-sm">
              {application.companyName || "Company"}
            </p>
            <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
              {[application.location, application.salaryLabel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-primary-light/60 px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-inset ring-border-subtle sm:px-2.5 sm:py-1 sm:text-xs">
            {APPLICATION_STATUS_LABELS[status]}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2 sm:mt-4">
          <Link
            href={jobHref}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
          >
            View Job
          </Link>

          {showPrepareInterview ? (
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              Prepare Interview
            </Link>
          ) : null}

          {canJoinInterview ? (
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              Join Interview
            </a>
          ) : null}

          {application.interview &&
          (status === "interview_scheduled" ||
            status === "interview_completed") ? (
            <a
              href="#interview-details"
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              View Schedule
            </a>
          ) : null}

          {status === "offer_sent" && application.offer ? (
            <a
              href="#offer-details"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              View Offer
            </a>
          ) : null}

          {status === "rejected" && application.rejectReason ? (
            <a
              href="#rejection-feedback"
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              View Feedback
            </a>
          ) : null}

          {status === "withdrawn" ? (
            <Link
              href={jobHref}
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              View Job to Reapply
            </Link>
          ) : null}

          {application.canWithdraw ? (
            <button
              type="button"
              disabled={withdrawMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Withdraw this application? You cannot undo this action.",
                  )
                ) {
                  withdrawMutation.mutate();
                }
              }}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-pin-state/30 bg-primary-light px-3 py-1.5 text-xs font-semibold text-pin-state hover:bg-primary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {withdrawMutation.isPending
                ? "Withdrawing…"
                : "Withdraw Application"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
            <ol className="mt-4 space-y-3">
              {application.statusHistory.length === 0 ? (
                <li className="text-sm text-muted">No status updates yet.</li>
              ) : (
                application.statusHistory.map((entry, index) => (
                  <li
                    key={`${entry.status}-${entry.at}-${index}`}
                    className="relative border-l-2 border-primary/20 pl-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {APPLICATION_STATUS_LABELS[entry.status]}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(entry.at)} · {actorLabel(entry.actorType)}
                    </p>
                    {entry.remark ? (
                      <p className="mt-1 text-xs text-muted">{entry.remark}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ol>
          </section>

          {application.interview ? (
            <section
              id="interview-details"
              className="scroll-mt-24 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Interview details
              </h2>
              <div className="mt-3">
                <ApplicationInterviewDetails
                  interview={application.interview}
                  candidatePhone={candidatePhone}
                />
              </div>
            </section>
          ) : null}

          {application.offer ? (
            <section
              id="offer-details"
              className="scroll-mt-24 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Offer details
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <DetailRow
                  label="Offer date"
                  value={application.offer.offerDate || "—"}
                />
                <DetailRow
                  label="Joining date"
                  value={application.offer.joiningDate || "—"}
                />
                <DetailRow
                  label="Package"
                  value={application.offer.packageText || "—"}
                />
                <DetailRow label="Notes" value={application.offer.notes || "—"} />
              </dl>
            </section>
          ) : null}

          {application.rejectReason ? (
            <section
              id="rejection-feedback"
              className="scroll-mt-24 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Rejection reason
              </h2>
              <p className="mt-2 text-sm text-muted">{application.rejectReason}</p>
            </section>
          ) : null}

          {application.employerNotes !== null && application.employerNotes ? (
            <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Employer notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {application.employerNotes}
              </p>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Resume used
            </h2>
            <p className="mb-3 text-sm text-muted">
              {application.resumeSource === "uploaded"
                ? `My Uploaded Resume${
                    application.uploadedResumeSnapshot?.originalName
                      ? ` · ${application.uploadedResumeSnapshot.originalName}`
                      : ""
                  }`
                : `AsliJobs Resume · v${application.resumeVersion}`}
            </p>
            {application.resumeSource === "uploaded" &&
            application.uploadedResumeSnapshot?.url ? (
              <a
                href={resolveMediaUrl(application.uploadedResumeSnapshot.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Open submitted file
              </a>
            ) : (
              <ResumePreview resumeJson={application.resumeSnapshot.resumeJson} />
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Application info
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <DetailRow
                label="Job ID"
                value={application.publicJobId}
              />
              <DetailRow
                label="Applied"
                value={formatDateTime(application.appliedAt)}
              />
              <DetailRow
                label="Resume used"
                value={
                  application.resumeSource === "uploaded"
                    ? "My Uploaded Resume"
                    : "AsliJobs Resume"
                }
              />
              <DetailRow
                label="Resume version"
                value={`v${application.resumeVersion}`}
              />
              <DetailRow
                label="Work mode"
                value={application.workMode || "—"}
              />
              <DetailRow label="Job type" value={application.jobType || "—"} />
            </dl>
            <Link
              href={ROUTES.jobPublic(application.publicJobId)}
              className={cn(
                "mt-4 inline-flex w-full items-center justify-center rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
            >
              View job posting
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium capitalize text-foreground break-words">
        {value}
      </dd>
    </div>
  );
}

function readCandidatePhoneFromSnapshot(
  resumeJson: Parameters<typeof isResumeJson>[0],
): string | null {
  if (!isResumeJson(resumeJson)) {
    return null;
  }
  const phone =
    resumeJson.header.phone?.trim() ||
    resumeJson.sections.contact.phone?.trim() ||
    "";
  return phone || null;
}
