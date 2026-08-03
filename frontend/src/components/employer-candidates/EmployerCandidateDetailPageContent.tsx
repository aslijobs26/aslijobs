"use client";

import { EmployerCandidateInterviewEditor } from "@/components/employer-candidates/EmployerCandidateInterviewEditor";
import { EmployerCandidateNotesEditor } from "@/components/employer-candidates/EmployerCandidateNotesEditor";
import {
  formatExpectedSalary,
  formatTimelineActivityTitle,
  parseInterviewCancelledRemark,
} from "@/components/employer-candidates/candidates-ats-utils";
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import {
  downloadEmployerApplicationPdf,
  fetchEmployerApplication,
  updateEmployerApplicationHiring,
  updateEmployerApplicationInterview,
  updateEmployerApplicationNotes,
  updateEmployerApplicationStatus,
} from "@/services/employer-applications.service";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  getAllowedEmployerStatusTransitions,
  isEmployerTerminalStatus,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import { resolveEmployerStatusSelect } from "@/components/employer-candidates/employer-status-select";
import type {
  ApplicationOffer,
  ApplicationStatusHistoryEntry,
} from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EmployerCandidateDetailPageContentProps = {
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

function actorLabel(
  actorType: ApplicationStatusHistoryEntry["actorType"],
): string {
  switch (actorType) {
    case "job_seeker":
      return "Candidate";
    case "employer":
      return "You";
    default:
      return "System";
  }
}

const EMPTY_OFFER: ApplicationOffer = {
  offerDate: "",
  joiningDate: "",
  packageText: "",
  notes: "",
};

export function EmployerCandidateDetailPageContent({
  applicationId,
}: EmployerCandidateDetailPageContentProps) {
  const queryClient = useQueryClient();
  const { can, canField, getFieldLevel } = useCan();
  const canExportCandidates = can("candidates", "export");
  const canViewResume = canField("candidates", "resume");
  const canUpdateCandidates = can("candidates", "update");
  const canScheduleInterview =
    can("interviews", "create") || can("interviews", "update");
  const canUpdateInterview = can("interviews", "update");
  const canViewLocation = canField("candidates", "location");
  const canViewExpectedSalary = canField("candidates", "expected_salary");
  const canViewPhone =
    canField("candidates", "phone") &&
    getFieldLevel("candidates", "phone") !== "mask";
  const canWriteNotes = canField("candidates", "notes", "write");
  const canViewOffer = canField("candidates", "offer_amount");
  const canWriteOffer = canField("candidates", "offer_amount", "write");
  const [rejectReason, setRejectReason] = useState("");
  const [offerDraft, setOfferDraft] = useState<ApplicationOffer>(EMPTY_OFFER);
  const [isDownloading, setIsDownloading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["employer", "application", applicationId],
    queryFn: () => fetchEmployerApplication(applicationId),
  });

  const application = detailQuery.data;

  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(
    null,
  );

  if (application && draftApplicationId !== application.id) {
    setDraftApplicationId(application.id);
    setRejectReason(application.rejectReason ?? "");
    setOfferDraft(application.offer ?? EMPTY_OFFER);
  }

  const statusMutation = useMutation({
    mutationFn: (status: EmployerApplicationStatus) =>
      updateEmployerApplicationStatus(applicationId, status),
    onSuccess: (data) => {
      queryClient.setQueryData(["employer", "application", applicationId], data);
      void queryClient.invalidateQueries({
        queryKey: ["employer", "applications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["employer", "application-stats"],
      });
      void queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      void queryClient.invalidateQueries({
        queryKey: ["employer-dashboard-home"],
      });
      showAppToast("Application status updated.");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const notesMutation = useMutation({
    mutationFn: (payload: {
      notes: string;
      employerNotesVisibleToSeeker: boolean;
    }) => updateEmployerApplicationNotes(applicationId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["employer", "application", applicationId], data);
      void queryClient.invalidateQueries({
        queryKey: ["employer", "applications"],
      });
      showAppToast("Notes saved successfully.", "success");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const interviewMutation = useMutation({
    mutationFn: (payload: Parameters<
      typeof updateEmployerApplicationInterview
    >[1]) => updateEmployerApplicationInterview(applicationId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["employer", "application", applicationId],
        data.application,
      );
      void queryClient.invalidateQueries({
        queryKey: ["employer", "applications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["employer", "application-stats"],
      });
      showAppToast(
        data.action === "scheduled"
          ? "Interview scheduled successfully."
          : "Interview updated successfully.",
        "success",
      );
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const hiringMutation = useMutation({
    mutationFn: () =>
      updateEmployerApplicationHiring(applicationId, {
        offer: offerDraft,
        rejectReason,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["employer", "application", applicationId], data);
      void queryClient.invalidateQueries({
        queryKey: ["employer", "applications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["employer", "application-stats"],
      });
      void queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      void queryClient.invalidateQueries({
        queryKey: ["employer-dashboard-home"],
      });
      showAppToast("Hiring details saved.");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { blob, fileName } = await downloadEmployerApplicationPdf(
        applicationId,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showAppToast("PDF download started.");
    } catch (error) {
      showAppToast(getErrorMessage(error), "error");
    } finally {
      setIsDownloading(false);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-primary-light/50" />
          <div className="h-4 w-80 max-w-full rounded bg-primary-light/30" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="h-[28rem] rounded-xl bg-primary-light/25" />
            <div className="h-64 rounded-xl bg-primary-light/25" />
          </div>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !application) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Candidate</h1>
        <p className="mt-3 text-sm text-muted">
          {getErrorMessage(detailQuery.error ?? new Error("Not found"))}
        </p>
        <Link
          href={ROUTES.EMPLOYER_CANDIDATES}
          className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
        >
          Back to candidates
        </Link>
      </div>
    );
  }

  const backHref = `${ROUTES.EMPLOYER_CANDIDATES}?jobId=${encodeURIComponent(application.publicJobId)}`;
  const experienceLabel = application.resumeSnapshot.resumeJson.sections
    .isFresher
    ? "Fresher"
    : application.candidate.headline || "Experienced";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="resume-no-print mb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to applicants
        </Link>
      </div>

      <header className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {application.candidate.fullName}
            </h1>
            <p className="mt-1 text-sm font-medium text-primary">
              {application.candidate.headline || "Candidate"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Applied for{" "}
              <span className="font-semibold text-foreground">
                {application.jobTitle}
              </span>{" "}
              ({application.publicJobId})
            </p>
          </div>
          <span className="inline-flex rounded-full bg-primary-light/60 px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-inset ring-border-subtle">
            {EMPLOYER_APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <div>
            <dt className="inline">Experience: </dt>
            <dd className="inline font-semibold text-foreground">
              {experienceLabel}
            </dd>
          </div>
          {canViewLocation ? (
            <div>
              <dt className="inline">Location: </dt>
              <dd className="inline font-semibold text-foreground">
                {application.candidate.preferredJobLocation?.trim() || "—"}
              </dd>
            </div>
          ) : null}
          {canViewExpectedSalary ? (
            <div>
              <dt className="inline">Expected salary: </dt>
              <dd className="inline font-semibold text-foreground">
                {formatExpectedSalary(
                  application.candidate.expectedSalary,
                  application.candidate.expectedSalaryPeriod,
                )}
              </dd>
            </div>
          ) : null}
          {canViewPhone ? (
            <div>
              <dt className="inline">Phone: </dt>
              <dd className="inline font-semibold text-foreground">
                {application.candidate.phone?.trim() || "—"}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="inline">Applied: </dt>
            <dd className="inline font-semibold text-foreground">
              {formatDateTime(application.appliedAt)}
            </dd>
          </div>
          {canViewResume ? (
            <div>
              <dt className="inline">Resume version: </dt>
              <dd className="inline font-semibold text-foreground">
                v{application.resumeVersion}
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="order-2 space-y-6 lg:order-1">
          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
            <ol className="mt-4 space-y-3">
              {(application.statusHistory ?? []).length === 0 ? (
                <li className="text-sm text-muted">No status updates yet.</li>
              ) : (
                application.statusHistory.map((entry, index) => {
                  const cancelled = parseInterviewCancelledRemark(entry.remark);
                  return (
                  <li
                    key={`${entry.status}-${entry.at}-${index}`}
                    className="relative border-l-2 border-primary/20 pl-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {formatTimelineActivityTitle({
                        status: entry.status,
                        remark: entry.remark,
                      })}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(entry.at)} · {actorLabel(entry.actorType)}
                    </p>
                    {cancelled ? (
                      <div className="mt-1 space-y-0.5 text-xs text-muted">
                        {cancelled.reason ? (
                          <p>
                            Reason{" "}
                            <span className="font-medium text-foreground">
                              {cancelled.reason}
                            </span>
                          </p>
                        ) : null}
                        {cancelled.byName ? (
                          <p>
                            By{" "}
                            <span className="font-medium text-foreground">
                              {cancelled.byName}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : entry.remark &&
                      !entry.remark.startsWith("Interview Scheduled") &&
                      !entry.remark.startsWith("Interview Rescheduled") ? (
                      <p className="mt-1 text-xs text-muted">{entry.remark}</p>
                    ) : null}
                  </li>
                  );
                })
              )}
            </ol>
          </section>

          {canViewResume ? (
            <ResumePreview resumeJson={application.resumeSnapshot.resumeJson} />
          ) : null}
        </div>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
          {canViewResume || canExportCandidates ? (
          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Resume Actions
            </h2>
            <div className="mt-3 space-y-2">
              {canViewResume ? (
              <button
                type="button"
                onClick={() => {
                  document.getElementById("resume-preview")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Preview Resume
              </button>
              ) : null}
              {canExportCandidates || canViewResume ? (
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => void handleDownload()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              >
                <Download className="size-4" aria-hidden="true" />
                {isDownloading ? "Downloading…" : "Download PDF"}
              </button>
              ) : null}
              {canViewResume ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Printer className="size-4" aria-hidden="true" />
                Print Resume
              </button>
              ) : null}
            </div>
          </section>
          ) : null}

          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Hiring Actions
            </h2>
            <label
              className="mt-3 block text-xs font-medium text-muted"
              htmlFor="application-status"
            >
              Application status
            </label>
            {isEmployerTerminalStatus(application.status) ? (
              <div className="mt-1.5 rounded-lg border border-border-subtle bg-hero-bg px-3 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {EMPLOYER_APPLICATION_STATUS_LABELS[application.status]}
                </p>
                <p className="mt-0.5 text-xs text-muted">Hiring Completed</p>
              </div>
            ) : canUpdateCandidates ? (
              <select
                id="application-status"
                className="mt-1.5 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                value=""
                disabled={statusMutation.isPending}
                onChange={(event) => {
                  const next = event.target
                    .value as EmployerApplicationStatus;
                  event.target.value = "";
                  if (!next) {
                    return;
                  }
                  const result = resolveEmployerStatusSelect({
                    nextStatus: next,
                    interview: application.interview,
                    offer: application.offer,
                  });
                  if (result.action === "open_interview") {
                    document
                      .getElementById("employer-candidate-interview-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    showAppToast(result.message, "info");
                    return;
                  }
                  if (result.action === "open_offer") {
                    document
                      .getElementById("employer-candidate-offer-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    showAppToast(result.message, "warning");
                    return;
                  }
                  if (result.action === "blocked") {
                    showAppToast(result.message, "warning");
                    return;
                  }
                  statusMutation.mutate(result.status);
                }}
              >
                <option value="" disabled>
                  Update status…
                </option>
                {getAllowedEmployerStatusTransitions(application.status).map(
                  (status) => (
                    <option key={status} value={status}>
                      {EMPLOYER_APPLICATION_STATUS_LABELS[status]}
                    </option>
                  ),
                )}
              </select>
            ) : (
              <div className="mt-1.5 rounded-lg border border-border-subtle bg-hero-bg px-3 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {EMPLOYER_APPLICATION_STATUS_LABELS[application.status]}
                </p>
              </div>
            )}
          </section>

          {canScheduleInterview || canUpdateInterview ? (
          <section
            id="employer-candidate-interview-section"
            className="resume-no-print scroll-mt-24 rounded-xl border border-border-subtle bg-surface p-4"
          >
            <h2 className="text-sm font-semibold text-foreground">
              Interview details
            </h2>
            <div className="mt-3">
              <EmployerCandidateInterviewEditor
                application={application}
                isSaving={interviewMutation.isPending}
                onSave={(payload) => interviewMutation.mutate(payload)}
              />
            </div>
          </section>
          ) : null}

          {canViewOffer ? (
          <section
            id="employer-candidate-offer-section"
            className="resume-no-print scroll-mt-24 rounded-xl border border-border-subtle bg-surface p-4"
          >
            <h2 className="text-sm font-semibold text-foreground">
              Offer details
            </h2>
            <div className="mt-3 space-y-2">
              <Field
                id="offer-date"
                label="Offer date"
                value={offerDraft.offerDate}
                onChange={(value) =>
                  setOfferDraft((current) => ({ ...current, offerDate: value }))
                }
              />
              <Field
                id="joining-date"
                label="Joining date"
                value={offerDraft.joiningDate}
                onChange={(value) =>
                  setOfferDraft((current) => ({
                    ...current,
                    joiningDate: value,
                  }))
                }
              />
              <Field
                id="offer-package"
                label="Package"
                value={offerDraft.packageText}
                onChange={(value) =>
                  setOfferDraft((current) => ({
                    ...current,
                    packageText: value,
                  }))
                }
              />
              <div>
                <label
                  htmlFor="offer-notes"
                  className="block text-xs font-medium text-muted"
                >
                  Notes
                </label>
                <textarea
                  id="offer-notes"
                  rows={3}
                  value={offerDraft.notes}
                  onChange={(event) =>
                    setOfferDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>
          </section>
          ) : null}

          {canUpdateCandidates ? (
          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Rejection reason
            </h2>
            <label className="sr-only" htmlFor="reject-reason">
              Rejection reason
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="mt-3 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="Optional reason shared with the candidate timeline"
            />
          </section>
          ) : null}

          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">Notes</h2>
            <div className="mt-3">
              <EmployerCandidateNotesEditor
                application={application}
                isSaving={notesMutation.isPending}
                canWrite={canWriteNotes && canUpdateCandidates}
                onSave={(payload) => notesMutation.mutate(payload)}
              />
            </div>
            {canWriteOffer && canUpdateCandidates ? (
            <button
              type="button"
              disabled={hiringMutation.isPending}
              onClick={() => hiringMutation.mutate()}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            >
              {hiringMutation.isPending
                ? "Saving…"
                : "Save offer / rejection"}
            </button>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />
    </div>
  );
}
