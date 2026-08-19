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
import { ResumePreview } from "@/components/job-seeker-resume/ResumePreview";
import {
  downloadEmployerApplicationPdf,
  fetchEmployerApplication,
  updateEmployerApplicationHiring,
  updateEmployerApplicationInterview,
  updateEmployerApplicationStatus,
} from "@/services/employer-applications.service";
import { savedCandidatesQueryKeys } from "@/services/saved-candidates.service";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  getAllowedEmployerStatusTransitions,
  isEmployerTerminalStatus,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import { resolveEmployerStatusSelect } from "@/components/employer-candidates/employer-status-select";
import { useCan } from "@/providers/employer-permission-provider";
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
  ChevronDown,
  Download,
  FileText,
  MessageCircle,
  Phone,
  Printer,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type CandidatesDetailTab =
  | "profile"
  | "experience"
  | "skills"
  | "resume"
  | "timeline"
  | "interview"
  | "offer";

type CandidatesDetailPanelProps = {
  applicationId: string | null;
  activeTab: CandidatesDetailTab;
  onTabChange: (tab: CandidatesDetailTab) => void;
  onScheduleInterview?: (applicationId: string) => void;
  onOpenShortlist?: (applicationId: string) => void;
  onClose?: () => void;
  variant?: "panel" | "drawer";
  /** When set, only these tabs are shown (still subject to RBAC). */
  allowedTabs?: readonly CandidatesDetailTab[];
};

const PANEL_DESKTOP_CLASSES =
  "flex h-full min-h-0 w-full flex-col overflow-hidden xl:w-[24rem]";

const TABS: { id: CandidatesDetailTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "resume", label: "Resume" },
  { id: "timeline", label: "Timeline" },
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

function PanelStatusSelect({
  currentStatus,
  disabled,
  interview,
  offer,
  onOpenShortlist,
  onOpenInterview,
  onOpenOffer,
  onSelectStatus,
  isDrawer = false,
}: {
  currentStatus: EmployerApplicationStatus;
  disabled: boolean;
  interview: Parameters<typeof resolveEmployerStatusSelect>[0]["interview"];
  offer: Parameters<typeof resolveEmployerStatusSelect>[0]["offer"];
  onOpenShortlist: () => void;
  onOpenInterview: () => void;
  onOpenOffer: () => void;
  onSelectStatus: (status: EmployerApplicationStatus) => void;
  isDrawer?: boolean;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const options = getAllowedEmployerStatusTransitions(currentStatus);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (next: EmployerApplicationStatus) => {
    setOpen(false);
    const result = resolveEmployerStatusSelect({
      nextStatus: next,
      interview,
      offer,
    });
    if (result.action === "open_shortlist") {
      onOpenShortlist();
      showAppToast(result.message, "info");
      return;
    }
    if (result.action === "open_interview") {
      onOpenInterview();
      showAppToast(result.message, "info");
      return;
    }
    if (result.action === "open_offer") {
      onOpenOffer();
      showAppToast(result.message, "warning");
      return;
    }
    if (result.action === "blocked") {
      showAppToast(result.message, "warning");
      return;
    }
    onSelectStatus(result.status);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <label className="sr-only" htmlFor="panel-status">
        Application status
      </label>
      <button
        id="panel-status"
        type="button"
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-primary bg-primary-light px-3 text-left text-sm font-semibold text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
          isDrawer ? "min-h-11" : "h-9",
        )}
      >
        <span className="truncate">Update status…</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Update application status"
          className={cn(
            "absolute z-30 mt-1.5 w-full overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-surface p-1.5 shadow-lg",
            isDrawer
              ? "max-h-[min(16rem,calc(100dvh-14rem))]"
              : "max-h-64",
          )}
        >
          {options.map((status) => (
            <li key={status} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelect(status)}
                className={cn(
                  "flex w-full items-center rounded-md px-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:bg-primary-light focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/30",
                  isDrawer ? "min-h-11 py-2.5" : "py-2",
                )}
              >
                {status === "interview_scheduled"
                  ? "Interview Schedule"
                  : EMPLOYER_APPLICATION_STATUS_LABELS[status]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CandidatesDetailPanel({
  applicationId,
  activeTab,
  onTabChange,
  onScheduleInterview,
  onOpenShortlist,
  onClose,
  variant = "panel",
  allowedTabs,
}: CandidatesDetailPanelProps) {
  const queryClient = useQueryClient();
  const { can, canField, getFieldLevel } = useCan();
  const canViewPhone = canField("candidates", "phone");
  const phoneLevel = getFieldLevel("candidates", "phone");
  const canUsePhone = canViewPhone && phoneLevel !== "mask";
  const canViewResume = canField("candidates", "resume");
  const canScheduleInterview =
    can("interviews", "create") || can("interviews", "update");
  const canUpdateCandidates = can("candidates", "update");
  const canViewExpectedSalary = canField("candidates", "expected_salary");
  const canViewLocation = canField("candidates", "location");
  const canViewDob = canField("candidates", "dob");
  const canViewOffer = canField("candidates", "offer_amount");
  const canWriteOffer = canField("candidates", "offer_amount", "write");
  const canViewInterview =
    can("interviews", "read") ||
    can("interviews", "create") ||
    can("interviews", "update");

  const visibleTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        if (allowedTabs && !allowedTabs.includes(tab.id)) {
          return false;
        }
        if (tab.id === "resume") return canViewResume;
        if (tab.id === "offer") return canViewOffer;
        if (tab.id === "interview") return canViewInterview;
        return true;
      }),
    [
      allowedTabs,
      canViewResume,
      canViewOffer,
      canViewInterview,
    ],
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      onTabChange(visibleTabs[0]?.id ?? "profile");
    }
  }, [activeTab, onTabChange, visibleTabs]);

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
      // My Jobs / dashboard job rows derive shortlisted & hired from applications.
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] }),
      queryClient.invalidateQueries({ queryKey: ["employer-dashboard-home"] }),
      queryClient.invalidateQueries({
        queryKey: savedCandidatesQueryKeys.all,
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
          "rounded-xl border border-border-subtle bg-surface",
          variant === "panel" && PANEL_DESKTOP_CLASSES,
        )}
      >
        <div className="p-8 pb-9 text-center">
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
      <aside
        className={cn(
          "rounded-xl border border-border-subtle bg-surface p-6",
          variant === "panel" && PANEL_DESKTOP_CLASSES,
        )}
      >
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
      <aside
        className={cn(
          "rounded-xl border border-border-subtle bg-surface p-6 text-center",
          variant === "panel" && PANEL_DESKTOP_CLASSES,
        )}
      >
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
  const whatsappHref = canUsePhone
    ? buildWhatsAppHref(application.candidate.phone)
    : null;
  const telHref = canUsePhone
    ? buildTelHref(application.candidate.phone)
    : null;
  const education = sections?.education ?? [];
  const experience = sections?.experience ?? [];
  const skills = sections?.skills ?? [];
  const languages = application.candidate.languages ?? [];
  const experienceLabel = application.candidate.experienceLabel || "—";
  const availabilityLabel = application.candidate.availability || "—";

  const isDrawer = variant === "drawer";
  const headerActionClassName = cn(
    "inline-flex items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    isDrawer ? "size-11" : "size-8",
  );

  return (
    <aside
      className={cn(
        "rounded-xl border border-border-subtle bg-surface",
        variant === "panel" && PANEL_DESKTOP_CLASSES,
        variant === "drawer" &&
          "flex min-h-0 h-full w-full flex-col overflow-hidden border-0 shadow-none",
      )}
    >
      <div
        className={cn(
          "border-b border-border-subtle p-4",
          "shrink-0",
          variant === "drawer" && "relative z-20",
        )}
      >
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
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg text-muted hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isDrawer ? "size-11" : "size-8",
                  )}
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
                {canUsePhone && whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp candidate"
                    className={headerActionClassName}
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
                {canUsePhone && telHref ? (
                  <a
                    href={telHref}
                    aria-label="Call candidate"
                    className={headerActionClassName}
                  >
                    <Phone className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
                {canViewResume ? (
                  <button
                    type="button"
                    onClick={() => onTabChange("resume")}
                    aria-label="View resume"
                    className={headerActionClassName}
                  >
                    <FileText className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
                {canScheduleInterview ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onScheduleInterview) {
                        onScheduleInterview(application.id);
                        return;
                      }
                      onTabChange("interview");
                    }}
                    aria-label="Schedule interview"
                    className={headerActionClassName}
                  >
                    <Calendar className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
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
          ) : canUpdateCandidates ? (
            <div className="space-y-2">
              <PanelStatusSelect
                currentStatus={application.status}
                disabled={statusMutation.isPending}
                interview={application.interview}
                offer={application.offer}
                isDrawer={isDrawer}
                onOpenShortlist={() => {
                  onOpenShortlist?.(application.id);
                }}
                onOpenInterview={() => {
                  if (onScheduleInterview && canScheduleInterview) {
                    onScheduleInterview(application.id);
                    return;
                  }
                  if (canViewInterview) {
                    onTabChange("interview");
                  }
                }}
                onOpenOffer={() => {
                  if (canViewOffer) {
                    onTabChange("offer");
                  }
                }}
                onSelectStatus={(status) => statusMutation.mutate(status)}
              />
              {application.status === "shortlisted" && onOpenShortlist ? (
                <button
                  type="button"
                  onClick={() => onOpenShortlist(application.id)}
                  className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Edit shortlist details
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-border-subtle bg-hero-bg px-2.5 py-2">
              <p className="text-sm font-semibold text-foreground">
                {EMPLOYER_APPLICATION_STATUS_LABELS[application.status]}
              </p>
            </div>
          )}
        </div>
      </div>

      {visibleTabs.length > 1 ? (
        <div
          className={cn(
            "flex shrink-0 gap-1 overflow-x-auto border-b border-border-subtle px-2 py-2 scrollbar-hidden",
          )}
          role="tablist"
          aria-label="Candidate detail sections"
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isDrawer ? "min-h-11 px-3 py-2.5" : "py-1.5",
                activeTab === tab.id
                  ? "bg-primary-soft text-surface"
                  : "text-muted hover:bg-primary-light hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-5 scrollbar-hidden",
        )}
      >
        {activeTab === "profile" ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <ProfileField label="Name" value={application.candidate.fullName} />
            {canViewDob ? (
              <ProfileField label="Age" value={age ?? "Not available"} />
            ) : null}
            <ProfileField label="Experience" value={experienceLabel} />
            {canViewLocation ? (
              <ProfileField label="Location" value={location} />
            ) : null}
            {canViewExpectedSalary ? (
              <ProfileField
                label="Expected Salary"
                value={formatExpectedSalary(
                  application.candidate.expectedSalary,
                  application.candidate.expectedSalaryPeriod,
                )}
              />
            ) : null}
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

        {activeTab === "interview" ? (
          canScheduleInterview || can("interviews", "update") ? (
            <EmployerCandidateInterviewEditor
              application={application}
              isSaving={interviewMutation.isPending}
              compact
              onSave={(payload) => interviewMutation.mutate(payload)}
            />
          ) : (
            <p className="text-sm text-muted">
              You do not have permission to schedule or update interviews.
            </p>
          )
        ) : null}

        {activeTab === "offer" ? (
          <div className="space-y-2">
            {canViewOffer ? (
              <>
                <Field
                  id="panel-offer-date"
                  label="Offer date"
                  value={offerDraft.offerDate}
                  onChange={(value) =>
                    setOfferDraft((current) => ({
                      ...current,
                      offerDate: value,
                    }))
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
              </>
            ) : null}
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
            {canWriteOffer && canUpdateCandidates ? (
              <button
                type="button"
                disabled={hiringMutation.isPending}
                onClick={() => hiringMutation.mutate()}
                className="mt-2 inline-flex w-full min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {hiringMutation.isPending ? "Saving…" : "Save offer details"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
