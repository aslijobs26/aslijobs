"use client";

import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import { ROUTES } from "@/constants/routes";
import {
  downloadEmployerApplicationPdf,
  fetchEmployerApplication,
  updateEmployerApplicationHiring,
  updateEmployerApplicationNotes,
  updateEmployerApplicationStatus,
} from "@/services/employer-applications.service";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  getAllowedEmployerStatusTransitions,
  isEmployerTerminalStatus,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import type {
  ApplicationInterview,
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

const EMPTY_INTERVIEW: ApplicationInterview = {
  date: "",
  time: "",
  mode: "",
  meetingLink: "",
  venue: "",
  instructions: "",
  interviewerName: "",
};

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
  const [notesDraft, setNotesDraft] = useState("");
  const [notesVisible, setNotesVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [interviewDraft, setInterviewDraft] =
    useState<ApplicationInterview>(EMPTY_INTERVIEW);
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
    setNotesDraft(application.employerNotes ?? "");
    setNotesVisible(application.employerNotesVisibleToSeeker === true);
    setRejectReason(application.rejectReason ?? "");
    setInterviewDraft(application.interview ?? EMPTY_INTERVIEW);
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
      showAppToast("Application status updated.");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const notesMutation = useMutation({
    mutationFn: async (notes: string) => {
      await updateEmployerApplicationNotes(applicationId, notes);
      return updateEmployerApplicationHiring(applicationId, {
        employerNotesVisibleToSeeker: notesVisible,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["employer", "application", applicationId], data);
      showAppToast("Notes saved.");
    },
    onError: (error) => {
      showAppToast(getErrorMessage(error), "error");
    },
  });

  const hiringMutation = useMutation({
    mutationFn: () =>
      updateEmployerApplicationHiring(applicationId, {
        interview: interviewDraft,
        offer: offerDraft,
        rejectReason,
        employerNotesVisibleToSeeker: notesVisible,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["employer", "application", applicationId], data);
      void queryClient.invalidateQueries({
        queryKey: ["employer", "applications"],
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
          <div>
            <dt className="inline">Location: </dt>
            <dd className="inline font-semibold text-foreground">
              {[application.candidate.city, application.candidate.state]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="inline">Applied: </dt>
            <dd className="inline font-semibold text-foreground">
              {formatDateTime(application.appliedAt)}
            </dd>
          </div>
          <div>
            <dt className="inline">Resume version: </dt>
            <dd className="inline font-semibold text-foreground">
              v{application.resumeVersion}
            </dd>
          </div>
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
                application.statusHistory.map((entry, index) => (
                  <li
                    key={`${entry.status}-${entry.at}-${index}`}
                    className="relative border-l-2 border-primary/20 pl-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {EMPLOYER_APPLICATION_STATUS_LABELS[entry.status]}
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

          <ResumePreview resumeJson={application.resumeSnapshot.resumeJson} />
        </div>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Resume Actions
            </h2>
            <div className="mt-3 space-y-2">
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
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => void handleDownload()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              >
                <Download className="size-4" aria-hidden="true" />
                {isDownloading ? "Downloading…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Printer className="size-4" aria-hidden="true" />
                Print Resume
              </button>
            </div>
          </section>

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
            ) : (
              <select
                id="application-status"
                className="mt-1.5 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                value=""
                disabled={statusMutation.isPending}
                onChange={(event) => {
                  const next = event.target
                    .value as EmployerApplicationStatus;
                  if (!next) {
                    return;
                  }
                  statusMutation.mutate(next);
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
            )}
          </section>

          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Interview details
            </h2>
            <div className="mt-3 space-y-2">
              <Field
                id="interview-date"
                label="Date"
                value={interviewDraft.date}
                onChange={(value) =>
                  setInterviewDraft((current) => ({ ...current, date: value }))
                }
              />
              <Field
                id="interview-time"
                label="Time"
                value={interviewDraft.time}
                onChange={(value) =>
                  setInterviewDraft((current) => ({ ...current, time: value }))
                }
              />
              <div>
                <label
                  htmlFor="interview-mode"
                  className="block text-xs font-medium text-muted"
                >
                  Mode
                </label>
                <select
                  id="interview-mode"
                  value={interviewDraft.mode}
                  onChange={(event) =>
                    setInterviewDraft((current) => ({
                      ...current,
                      mode: event.target.value as ApplicationInterview["mode"],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <option value="">Select</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <Field
                id="interview-link"
                label="Meeting link"
                value={interviewDraft.meetingLink}
                onChange={(value) =>
                  setInterviewDraft((current) => ({
                    ...current,
                    meetingLink: value,
                  }))
                }
              />
              <Field
                id="interview-venue"
                label="Venue"
                value={interviewDraft.venue}
                onChange={(value) =>
                  setInterviewDraft((current) => ({ ...current, venue: value }))
                }
              />
              <Field
                id="interview-interviewer"
                label="Interviewer"
                value={interviewDraft.interviewerName}
                onChange={(value) =>
                  setInterviewDraft((current) => ({
                    ...current,
                    interviewerName: value,
                  }))
                }
              />
              <div>
                <label
                  htmlFor="interview-instructions"
                  className="block text-xs font-medium text-muted"
                >
                  Instructions
                </label>
                <textarea
                  id="interview-instructions"
                  rows={3}
                  value={interviewDraft.instructions}
                  onChange={(event) =>
                    setInterviewDraft((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>
          </section>

          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
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

          <section className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">Notes</h2>
            <p className="mt-1 text-xs text-muted">
              Private by default. Share with the candidate only when enabled.
            </p>
            <label className="sr-only" htmlFor="employer-notes">
              Employer notes
            </label>
            <textarea
              id="employer-notes"
              rows={5}
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              className="mt-3 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="Good communication, call tomorrow…"
            />
            <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={notesVisible}
                onChange={(event) => setNotesVisible(event.target.checked)}
                className="mt-0.5 size-4 rounded border-border-subtle text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <span>Share notes with candidate</span>
            </label>
            <button
              type="button"
              disabled={notesMutation.isPending}
              onClick={() => notesMutation.mutate(notesDraft)}
              className={cn(
                "mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold text-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
                "bg-primary hover:bg-primary-hover",
              )}
            >
              {notesMutation.isPending ? "Saving…" : "Save notes"}
            </button>
            <button
              type="button"
              disabled={hiringMutation.isPending}
              onClick={() => hiringMutation.mutate()}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-border-subtle px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            >
              {hiringMutation.isPending
                ? "Saving…"
                : "Save interview / offer / visibility"}
            </button>
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
