"use client";

import {
  ageFromDateOfBirth,
  buildTelHref,
  buildWhatsAppHref,
  employerApplicationStatusClass,
  formatCandidateDate,
  formatCandidateDateTime,
  formatExpectedSalary,
  formatTimelineActivityTitle,
  getCandidateInitials,
  parseInterviewCancelledRemark,
} from "@/components/employer-candidates/candidates-ats-utils";
import { EmployerCandidateInterviewEditor } from "@/components/employer-candidates/EmployerCandidateInterviewEditor";
import { EmployerCandidateNotesEditor } from "@/components/employer-candidates/EmployerCandidateNotesEditor";
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
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
import { isResumeJson } from "@/types/job-seeker-resume";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  FileText,
  MessageCircle,
  Phone,
  Printer,
  X,
} from "lucide-react";
import { useState } from "react";

export type CandidatesDetailTab =
  | "profile"
  | "experience"
  | "skills"
  | "resume"
  | "timeline"
  | "notes"
  | "interview"
  | "offer";

type CandidatesDetailPanelProps = {
  applicationId: string | null;
  activeTab: CandidatesDetailTab;
  onTabChange: (tab: CandidatesDetailTab) => void;
  onClose?: () => void;
  variant?: "panel" | "drawer";
};

const TABS: { id: CandidatesDetailTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "resume", label: "Resume" },
  { id: "timeline", label: "Timeline" },
  { id: "notes", label: "Notes" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
];

const EMPTY_OFFER: ApplicationOffer = {
  offerDate: "",
  joiningDate: "",
  packageText: "",
  notes: "",
};

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

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export function CandidatesDetailPanel({
  applicationId,
  activeTab,
  onTabChange,
  onClose,
  variant = "panel",
}: CandidatesDetailPanelProps) {
  const queryClient = useQueryClient();
  const [offerDraft, setOfferDraft] = useState<ApplicationOffer>(EMPTY_OFFER);
  const [rejectReason, setRejectReason] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["employer", "application", applicationId],
    queryFn: () => fetchEmployerApplication(applicationId!),
    enabled: Boolean(applicationId),
  });

  const application = detailQuery.data;

  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(
    null,
  );

  if (application && draftApplicationId !== application.id) {
    setDraftApplicationId(application.id);
    setOfferDraft(application.offer ?? EMPTY_OFFER);
    setRejectReason(application.rejectReason ?? "");
  }

  const invalidate = async () => {
      await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["employer", "applications"] }),
      queryClient.invalidateQueries({
        queryKey: ["employer", "application-stats"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["employer", "application", applicationId],
      }),
      queryClient.invalidateQueries({ queryKey: ["employer", "interviews"] }),
      queryClient.invalidateQueries({
        queryKey: ["employer", "interview-stats"],
      }),
    ]);
  };

  const statusMutation = useMutation({
    mutationFn: (status: EmployerApplicationStatus) =>
      updateEmployerApplicationStatus(applicationId!, status),
    onSuccess: async () => {
      showAppToast("Status updated", "success");
      await invalidate();
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const notesMutation = useMutation({
    mutationFn: (payload: {
      notes: string;
      employerNotesVisibleToSeeker: boolean;
    }) => updateEmployerApplicationNotes(applicationId!, payload),
    onSuccess: async () => {
      showAppToast("Notes saved successfully.", "success");
      await invalidate();
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const interviewMutation = useMutation({
    mutationFn: (payload: Parameters<
      typeof updateEmployerApplicationInterview
    >[1]) => updateEmployerApplicationInterview(applicationId!, payload),
    onSuccess: async (data) => {
      showAppToast(
        data.action === "scheduled"
          ? "Interview scheduled successfully."
          : "Interview updated successfully.",
        "success",
      );
      await invalidate();
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const hiringMutation = useMutation({
    mutationFn: () =>
      updateEmployerApplicationHiring(applicationId!, {
        offer: offerDraft,
        rejectReason,
      }),
    onSuccess: async () => {
      showAppToast("Hiring details saved", "success");
      await invalidate();
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const handleDownload = async () => {
    if (!applicationId) {
      return;
    }
    setIsDownloading(true);
    try {
      const { blob, fileName } =
        await downloadEmployerApplicationPdf(applicationId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showAppToast(getErrorMessage(error), "error");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!applicationId) {
    return (
      <aside
        className={cn(
          "flex flex-col rounded-xl border border-border-subtle bg-surface",
          variant === "panel" && "sticky top-20 max-h-[calc(100dvh-6rem)]",
        )}
      >
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <p className="text-sm text-muted">
            Select a candidate to preview their profile, resume, and hiring
            actions.
          </p>
        </div>
      </aside>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <aside className="rounded-xl border border-border-subtle bg-surface p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary-light/50" />
          <div className="h-4 w-40 rounded bg-primary-light/40" />
          <div className="h-3 w-56 rounded bg-primary-light/30" />
          <div className="h-40 rounded-lg bg-primary-light/25" />
        </div>
      </aside>
    );
  }

  if (detailQuery.isError || !application) {
    return (
      <aside className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <p className="text-sm text-muted">
          {getErrorMessage(detailQuery.error ?? new Error("Not found"))}
        </p>
      </aside>
    );
  }

  const resumeJson = application.resumeSnapshot.resumeJson;
  const sections = isResumeJson(resumeJson) ? resumeJson.sections : null;
  const location =
    application.candidate.preferredJobLocation?.trim() || "—";
  const age = ageFromDateOfBirth(application.candidate.dateOfBirth ?? null);
  const whatsappHref = buildWhatsAppHref(application.candidate.phone);
  const telHref = buildTelHref(application.candidate.phone);
  const education = sections?.education ?? [];
  const experience = sections?.experience ?? [];
  const skills = sections?.skills ?? [];
  const languages = application.candidate.languages ?? [];
  const experienceLabel = application.candidate.experienceLabel || "—";
  const availabilityLabel = application.candidate.availability || "—";

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface",
        variant === "panel" &&
          "sticky top-20 max-h-[calc(100dvh-6rem)] lg:w-[22rem] xl:w-[24rem]",
        variant === "drawer" && "h-full max-h-[90dvh] w-full",
      )}
    >
      <div className="shrink-0 border-b border-border-subtle p-4">
        <div className="flex items-start gap-3">
          <span
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-surface"
            aria-hidden="true"
          >
            {getCandidateInitials(application.candidate.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-foreground">
                  {application.candidate.fullName}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {application.candidate.headline || experienceLabel}
                </p>
              </div>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Close candidate details"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                employerApplicationStatusClass(application.status),
              )}
            >
              {EMPLOYER_APPLICATION_STATUS_LABELS[application.status]}
            </span>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-xs text-muted">
                Applied for{" "}
                <span className="font-semibold text-foreground">
                  {application.jobTitle}
                </span>
              </p>
              <div className="flex shrink-0 items-center gap-1">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp candidate"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                  </a>
                ) : (
                  <span
                    aria-label="WhatsApp unavailable"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                  </span>
                )}
                {telHref ? (
                  <a
                    href={telHref}
                    aria-label="Call candidate"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                  </a>
                ) : (
                  <span
                    aria-label="Call unavailable"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onTabChange("resume")}
                  aria-label="View resume"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <FileText className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("interview")}
                  aria-label="Schedule interview"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Calendar className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          {isEmployerTerminalStatus(application.status) ? (
            <div className="rounded-lg border border-border-subtle bg-hero-bg px-2.5 py-2">
              <p className="text-sm font-semibold text-foreground">
                {EMPLOYER_APPLICATION_STATUS_LABELS[application.status]}
              </p>
              <p className="mt-0.5 text-xs text-muted">Hiring Completed</p>
            </div>
          ) : (
            <>
              <label className="sr-only" htmlFor="panel-status">
                Application status
              </label>
              <select
                id="panel-status"
                value=""
                disabled={statusMutation.isPending}
                onChange={(event) => {
                  const next = event.target.value as EmployerApplicationStatus;
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
                    onTabChange("interview");
                    showAppToast(result.message, "info");
                    return;
                  }
                  if (result.action === "open_offer") {
                    onTabChange("offer");
                    showAppToast(result.message, "warning");
                    return;
                  }
                  if (result.action === "blocked") {
                    showAppToast(result.message, "warning");
                    return;
                  }
                  statusMutation.mutate(result.status);
                }}
                className="w-full rounded-lg border border-primary/30 bg-primary-light px-2.5 py-2 text-sm font-semibold text-primary transition-[border-color,box-shadow,background-color] hover:border-primary/50 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
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
            </>
          )}
        </div>
      </div>

      <div
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-border-subtle px-2 py-2 scrollbar-hidden"
        role="tablist"
        aria-label="Candidate detail sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              activeTab === tab.id
                ? "bg-primary-soft text-surface"
                : "text-muted hover:bg-primary-light hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-hidden">
        {activeTab === "profile" ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <ProfileField label="Name" value={application.candidate.fullName} />
            <ProfileField label="Age" value={age ?? "Not available"} />
            <ProfileField label="Experience" value={experienceLabel} />
            <ProfileField label="Location" value={location} />
            <ProfileField
              label="Expected Salary"
              value={formatExpectedSalary(
                application.candidate.expectedSalary,
                application.candidate.expectedSalaryPeriod,
              )}
            />
            <ProfileField
              label="Languages"
              value={
                languages.length > 0 ? languages.join(", ") : "—"
              }
            />
            <ProfileField label="Availability" value={availabilityLabel} />
            <ProfileField
              label="Applied"
              value={formatCandidateDate(application.appliedAt)}
            />
            {sections?.professionalSummary || sections?.careerObjective ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted">About</dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground">
                  {sections.professionalSummary || sections.careerObjective}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {activeTab === "experience" ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Employment history
              </h3>
              {experience.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  {sections?.isFresher
                    ? "Fresher — no employment history."
                    : "No experience listed."}
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {experience.map((entry, index) => (
                    <li
                      key={`${entry.companyName}-${index}`}
                      className="rounded-lg border border-border-subtle p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {entry.jobRole || "Role"}
                      </p>
                      <p className="text-xs text-muted">
                        {[entry.companyName, entry.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {[entry.startDate, entry.endDate || (entry.currentlyWorking ? "Present" : "")]
                          .filter(Boolean)
                          .join(" – ")}
                        {entry.duration ? ` · ${entry.duration}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Education</h3>
              {education.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No education listed.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {education.map((entry, index) => (
                    <li
                      key={`${entry.level}-${index}`}
                      className="rounded-lg border border-border-subtle p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {entry.degree ||
                          entry.stream ||
                          entry.trade ||
                          entry.level ||
                          "Education"}
                      </p>
                      <p className="text-xs text-muted">
                        {[
                          entry.collegeName ||
                            entry.instituteName ||
                            entry.schoolName,
                          entry.passingYear,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "skills" ? (
          skills.length === 0 ? (
            <p className="text-sm text-muted">No skills listed on resume.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex rounded-lg border border-border-subtle bg-primary-light/40 px-2.5 py-1 text-xs font-semibold text-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )
        ) : null}

        {activeTab === "resume" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => void handleDownload()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Download className="size-3.5" aria-hidden="true" />
                {isDownloading ? "Downloading…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                Print
              </button>
            </div>
            <p className="text-xs text-muted">
              Version v{application.resumeVersion} · Status{" "}
              {application.resumeStatus}
            </p>
            {isResumeJson(resumeJson) ? (
              <div className="overflow-hidden rounded-lg border border-border-subtle">
                <ResumePreview resumeJson={resumeJson} />
              </div>
            ) : (
              <p className="text-sm text-muted">Resume preview unavailable.</p>
            )}
          </div>
        ) : null}

        {activeTab === "timeline" ? (
          <ol className="space-y-3">
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
                    {formatCandidateDateTime(entry.at)} ·{" "}
                    {actorLabel(entry.actorType)}
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
        ) : null}

        {activeTab === "notes" ? (
          <EmployerCandidateNotesEditor
            application={application}
            isSaving={notesMutation.isPending}
            compact
            onSave={(payload) => notesMutation.mutate(payload)}
          />
        ) : null}

        {activeTab === "interview" ? (
          <EmployerCandidateInterviewEditor
            application={application}
            isSaving={interviewMutation.isPending}
            compact
            onSave={(payload) => interviewMutation.mutate(payload)}
          />
        ) : null}

        {activeTab === "offer" ? (
          <div className="space-y-2">
            <Field
              id="panel-offer-date"
              label="Offer date"
              value={offerDraft.offerDate}
              onChange={(value) =>
                setOfferDraft((current) => ({ ...current, offerDate: value }))
              }
            />
            <Field
              id="panel-joining-date"
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
              id="panel-offer-package"
              label="Salary / package"
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
                htmlFor="panel-offer-notes"
                className="block text-xs font-medium text-muted"
              >
                Offer notes
              </label>
              <textarea
                id="panel-offer-notes"
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
            <div>
              <label
                htmlFor="panel-reject-reason"
                className="block text-xs font-medium text-muted"
              >
                Rejection reason
              </label>
              <textarea
                id="panel-reject-reason"
                rows={2}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <button
              type="button"
              disabled={hiringMutation.isPending}
              onClick={() => hiringMutation.mutate()}
              className="mt-2 inline-flex w-full min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {hiringMutation.isPending ? "Saving…" : "Save offer details"}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
