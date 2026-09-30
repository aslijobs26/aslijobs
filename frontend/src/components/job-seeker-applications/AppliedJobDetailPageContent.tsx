"use client";

import { JobSeekerApplicationDetailSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import { ApplicationInterviewDetails } from "@/components/applications/ApplicationInterviewDetails";
import { getApiErrorMessage } from "@/components/job-seeker-profile/get-api-error-message";
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import { ROUTES } from "@/constants/routes";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import {
  fetchSeekerApplication,
  withdrawSeekerApplication,
} from "@/services/job-seeker-applications.service";
import type {
  ApplicationStatus,
  ApplicationStatusHistoryEntry,
} from "@/types/job-seeker-applications";
import { isResumeJson } from "@/types/job-seeker-resume";
import { cn } from "@/utils/cn";
import {
  formatJobSearchJobType,
  formatJobSearchWorkMode,
} from "@/utils/job-search-format";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { APPLICATION_STATUS_LABEL_KEYS } from "./applied-jobs-utils";

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

function actorLabelKey(
  actorType: ApplicationStatusHistoryEntry["actorType"],
): MessageKey {
  switch (actorType) {
    case "job_seeker":
      return "seeker.applicationDetail.actorYou";
    case "employer":
      return "seeker.applicationDetail.actorEmployer";
    default:
      return "seeker.applicationDetail.actorSystem";
  }
}

export function AppliedJobDetailPageContent({
  applicationId,
}: AppliedJobDetailPageContentProps) {
  const t = useTranslate();
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
      showAppToast(t("seeker.applicationDetail.withdrawnToast"));
    },
    onError: (error) => {
      showAppToast(
        getApiErrorMessage(error, t("seeker.common.genericError")),
        "error",
      );
    },
  });

  if (detailQuery.isLoading) {
    return <JobSeekerApplicationDetailSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("seeker.applicationDetail.heading")}
        </h1>
        <p className="mt-3 break-words text-sm text-muted">
          {getApiErrorMessage(
            detailQuery.error,
            t("seeker.applicationDetail.notFound"),
          )}
        </p>
        <Link
          href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
          className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
        >
          {t("seeker.applicationDetail.back")}
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
  const uploadedResumeName =
    application.uploadedResumeSnapshot?.originalName?.trim() || "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link
          href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
        >
          <ArrowLeft className="size-3.5 sm:size-4" aria-hidden="true" />
          {t("seeker.applicationDetail.back")}
        </Link>
      </div>

      <header className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {application.jobTitle}
            </h1>
            <p className="mt-1 text-xs font-medium text-primary sm:text-sm">
              {application.companyName || t("seeker.common.company")}
            </p>
            <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
              {[application.location, application.salaryLabel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-primary-light/60 px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-inset ring-border-subtle sm:px-2.5 sm:py-1 sm:text-xs">
            {t(APPLICATION_STATUS_LABEL_KEYS[status])}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2 sm:mt-4">
          <Link
            href={jobHref}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
          >
            {t("seeker.common.viewJob")}
          </Link>

          {showPrepareInterview ? (
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {t("seeker.applicationDetail.prepareInterview")}
            </Link>
          ) : null}

          {canJoinInterview ? (
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {t("seeker.applicationDetail.joinInterview")}
            </a>
          ) : null}

          {application.interview &&
          (status === "interview_scheduled" ||
            status === "interview_completed") ? (
            <a
              href="#interview-details"
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {t("seeker.applicationDetail.viewSchedule")}
            </a>
          ) : null}

          {status === "offer_sent" && application.offer ? (
            <a
              href="#offer-details"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {t("seeker.applicationDetail.viewOffer")}
            </a>
          ) : null}

          {status === "rejected" && application.rejectReason ? (
            <a
              href="#rejection-feedback"
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {t("seeker.applicationDetail.viewFeedback")}
            </a>
          ) : null}

          {status === "withdrawn" ? (
            <Link
              href={jobHref}
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {t("seeker.applicationDetail.viewJobToReapply")}
            </Link>
          ) : null}

          {application.canWithdraw ? (
            <button
              type="button"
              disabled={withdrawMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(t("seeker.applicationDetail.withdrawConfirm"))
                ) {
                  withdrawMutation.mutate();
                }
              }}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-pin-state/30 bg-primary-light px-3 py-1.5 text-xs font-semibold text-pin-state hover:bg-primary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60 sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              {withdrawMutation.isPending
                ? t("seeker.applicationDetail.withdrawing")
                : t("seeker.applicationDetail.withdraw")}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">
              {t("seeker.applicationDetail.timeline")}
            </h2>
            <ol className="mt-4 space-y-3">
              {application.statusHistory.length === 0 ? (
                <li className="text-sm text-muted">
                  {t("seeker.applicationDetail.noUpdates")}
                </li>
              ) : (
                application.statusHistory.map((entry, index) => (
                  <li
                    key={`${entry.status}-${entry.at}-${index}`}
                    className="relative border-l-2 border-primary/20 pl-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {t(APPLICATION_STATUS_LABEL_KEYS[entry.status])}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(entry.at)} ·{" "}
                      {t(actorLabelKey(entry.actorType))}
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
                {t("seeker.applicationDetail.interviewDetails")}
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
                {t("seeker.applicationDetail.offerDetails")}
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <DetailRow
                  label={t("seeker.applicationDetail.offerDate")}
                  value={application.offer.offerDate || "—"}
                />
                <DetailRow
                  label={t("seeker.applicationDetail.joiningDate")}
                  value={application.offer.joiningDate || "—"}
                />
                <DetailRow
                  label={t("seeker.applicationDetail.package")}
                  value={application.offer.packageText || "—"}
                />
                <DetailRow
                  label={t("seeker.applicationDetail.notes")}
                  value={application.offer.notes || "—"}
                />
              </dl>
            </section>
          ) : null}

          {application.rejectReason ? (
            <section
              id="rejection-feedback"
              className="scroll-mt-24 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                {t("seeker.applicationDetail.rejectionReason")}
              </h2>
              <p className="mt-2 text-sm text-muted">{application.rejectReason}</p>
            </section>
          ) : null}

          {application.employerNotes !== null && application.employerNotes ? (
            <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-foreground">
                {t("seeker.applicationDetail.employerNotes")}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {application.employerNotes}
              </p>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              {t("seeker.applicationDetail.resumeUsed")}
            </h2>
            <p className="mb-3 break-words text-sm text-muted">
              {application.resumeSource === "uploaded"
                ? uploadedResumeName
                  ? t("seeker.applicationDetail.uploadedResumeNamed", {
                      name: uploadedResumeName,
                    })
                  : t("seeker.applicationDetail.uploadedResume")
                : t("seeker.applicationDetail.asliResumeVersion", {
                    version: application.resumeVersion,
                  })}
            </p>
            {application.resumeSource === "uploaded" ? (
              <p className="break-words text-sm text-muted">
                {uploadedResumeName
                  ? t("seeker.applicationDetail.uploadedCapturedNamed", {
                      name: uploadedResumeName,
                    })
                  : t("seeker.applicationDetail.uploadedCaptured")}
              </p>
            ) : (
              <ResumePreview resumeJson={application.resumeSnapshot.resumeJson} />
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("seeker.applicationDetail.info")}
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <DetailRow
                label={t("seeker.applicationDetail.jobId")}
                value={application.publicJobId}
              />
              <DetailRow
                label={t("seeker.applicationDetail.applied")}
                value={formatDateTime(application.appliedAt)}
              />
              <DetailRow
                label={t("seeker.applicationDetail.resumeUsed")}
                value={
                  application.resumeSource === "uploaded"
                    ? t("seeker.applicationDetail.uploadedResume")
                    : t("seeker.applicationDetail.asliResume")
                }
              />
              <DetailRow
                label={t("seeker.applicationDetail.resumeVersion")}
                value={`v${application.resumeVersion}`}
              />
              <DetailRow
                label={t("seeker.applicationDetail.workMode")}
                value={
                  application.workMode
                    ? formatJobSearchWorkMode(application.workMode)
                    : "—"
                }
              />
              <DetailRow
                label={t("seeker.applicationDetail.jobType")}
                value={
                  application.jobType
                    ? formatJobSearchJobType(application.jobType)
                    : "—"
                }
              />
            </dl>
            <Link
              href={ROUTES.jobPublic(application.publicJobId)}
              className={cn(
                "mt-4 inline-flex w-full items-center justify-center rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
            >
              {t("seeker.applicationDetail.viewPosting")}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <dt className="min-w-0 break-words text-muted">{label}</dt>
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
