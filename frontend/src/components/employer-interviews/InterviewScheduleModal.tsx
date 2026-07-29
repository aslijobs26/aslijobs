"use client";

import { EmployerCandidateInterviewEditor } from "@/components/employer-candidates/EmployerCandidateInterviewEditor";
import {
  fetchEmployerApplication,
  fetchEmployerApplications,
  updateEmployerApplicationInterview,
} from "@/services/employer-applications.service";
import { fetchEmployerInterviews } from "@/services/employer-interviews.service";
import {
  isEmployerTerminalStatus,
  type EmployerApplicationDetail,
  type EmployerApplicationListItem,
} from "@/types/employer-applications";
import type { EmployerInterviewListItem } from "@/types/employer-interviews";
import { interviewDisplayStatus } from "@/types/employer-interviews";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

type InterviewScheduleModalProps = {
  onClose: () => void;
  applicationId?: string | null;
  onSaved?: (applicationId: string) => void;
};

type PickerInterviewBadge = {
  label: "Scheduled" | "Rescheduled" | "Completed" | "Cancelled";
  className: string;
  tooltip: string;
  sortRank: number;
};

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

const EMPTY_INTERVIEW_LIST_ITEM: EmployerInterviewListItem = {
  id: "",
  publicJobId: "",
  jobTitle: "",
  jobLocation: "",
  status: "interview_scheduled",
  wasRescheduled: false,
  isCancelled: false,
  cancellationReason: "",
  cancelledAt: null,
  candidateName: "",
  candidatePhone: "",
  interviewDate: "",
  interviewTime: "",
  interviewMode: "",
  interviewerName: "",
  interviewerDesignation: "",
  meetingLink: "",
  venue: "",
  appliedAt: "",
  updatedAt: null,
};

const SCHEDULED_BADGE_CLASS = interviewDisplayStatus({
  ...EMPTY_INTERVIEW_LIST_ITEM,
  status: "interview_scheduled",
}).className;

const COMPLETED_BADGE_CLASS = interviewDisplayStatus({
  ...EMPTY_INTERVIEW_LIST_ITEM,
  status: "interview_completed",
}).className;

function resolvePickerInterviewBadge(
  application: EmployerApplicationListItem,
  interview: EmployerInterviewListItem | undefined,
): PickerInterviewBadge | null {
  if (interview) {
    const status = interviewDisplayStatus(interview);
    if (status.label === "Cancelled") {
      return {
        label: "Cancelled",
        className: status.className,
        tooltip: "Interview was cancelled.",
        sortRank: 4,
      };
    }
    if (status.label === "Completed") {
      return {
        label: "Completed",
        className: status.className,
        tooltip: "Interview completed.",
        sortRank: 3,
      };
    }
    if (status.label === "Rescheduled") {
      return {
        label: "Rescheduled",
        className: status.className,
        tooltip: "Interview has been rescheduled.",
        sortRank: 2,
      };
    }
    return {
      label: "Scheduled",
      className: status.className,
      tooltip: "Interview already scheduled.",
      sortRank: 1,
    };
  }

  if (application.status === "interview_completed") {
    return {
      label: "Completed",
      className: COMPLETED_BADGE_CLASS,
      tooltip: "Interview completed.",
      sortRank: 3,
    };
  }

  if (application.status === "interview_scheduled") {
    return {
      label: "Scheduled",
      className: SCHEDULED_BADGE_CLASS,
      tooltip: "Interview already scheduled.",
      sortRank: 1,
    };
  }

  return null;
}

export function InterviewScheduleModal({
  onClose,
  applicationId = null,
  onSaved,
}: InterviewScheduleModalProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const [searchDraft, setSearchDraft] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(applicationId);

  useEffect(() => {
    setSelectedId(applicationId);
  }, [applicationId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const candidatesQuery = useQuery({
    queryKey: ["employer", "applications", "interview-picker", searchDraft],
    queryFn: () =>
      fetchEmployerApplications({
        search: searchDraft.trim() || undefined,
        page: 1,
        limit: 30,
        sort: "newest",
      }),
    enabled: !selectedId,
  });

  /** Existing interviews for badge status — reuses Interview List API. */
  const interviewsBadgeQuery = useQuery({
    queryKey: ["employer", "interviews", "picker-badges"],
    queryFn: () =>
      fetchEmployerInterviews({
        page: 1,
        limit: 200,
        sort: "newest",
      }),
    enabled: !selectedId,
  });

  const interviewByApplicationId = useMemo(() => {
    const map = new Map<string, EmployerInterviewListItem>();
    for (const item of interviewsBadgeQuery.data?.interviews ?? []) {
      map.set(item.id, item);
    }
    return map;
  }, [interviewsBadgeQuery.data?.interviews]);

  const eligibleCandidates = useMemo(() => {
    const rows = (candidatesQuery.data?.applications ?? [])
      .filter((item) => !isEmployerTerminalStatus(item.status))
      .map((item) => {
        const badge = resolvePickerInterviewBadge(
          item,
          interviewByApplicationId.get(item.id),
        );
        return { item, badge };
      });

    rows.sort((left, right) => {
      const leftRank = left.badge?.sortRank ?? 0;
      const rightRank = right.badge?.sortRank ?? 0;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.item.candidateName.localeCompare(right.item.candidateName);
    });

    return rows;
  }, [candidatesQuery.data?.applications, interviewByApplicationId]);

  const detailQuery = useQuery({
    queryKey: ["employer", "application", selectedId],
    queryFn: () => fetchEmployerApplication(selectedId!),
    enabled: Boolean(selectedId),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<
      typeof updateEmployerApplicationInterview
    >[1]) => updateEmployerApplicationInterview(selectedId!, payload),
    onSuccess: async (data) => {
      showAppToast(
        data.action === "scheduled"
          ? "Interview scheduled successfully."
          : "Interview updated successfully.",
        "success",
      );
      queryClient.setQueryData(
        ["employer", "application", selectedId],
        data.application,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["employer", "interviews"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "interview-stats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "application-stats"],
        }),
      ]);
      onSaved?.(selectedId!);
      onClose();
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const application = detailQuery.data as EmployerApplicationDetail | undefined;
  const hasExistingInterview = Boolean(
    application?.interview?.date?.trim() ||
      application?.interview?.cancelledAt ||
      application?.status === "interview_scheduled" ||
      application?.status === "interview_completed",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog backdrop"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border-subtle bg-surface shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold text-foreground"
            >
              {hasExistingInterview ? "Edit interview" : "Schedule interview"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {selectedId && hasExistingInterview
                ? "Update or reschedule the existing interview. A new interview is not created."
                : selectedId
                  ? "Add the interview details for this candidate."
                  : "Select a candidate, then schedule their interview."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-hidden sm:p-5">
          {!selectedId ? (
            <div className="space-y-3">
              <label
                htmlFor="interview-candidate-search"
                className="block text-xs font-medium text-muted"
              >
                Select candidate
              </label>
              <input
                id="interview-candidate-search"
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search by name, phone, job…"
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
                {candidatesQuery.isLoading ? (
                  <li className="px-3 py-4 text-sm text-muted">Loading…</li>
                ) : eligibleCandidates.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-muted">
                    No eligible candidates available for interview scheduling.
                  </li>
                ) : (
                  eligibleCandidates.map(({ item, badge }) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {item.candidateName}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {item.jobTitle}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {item.publicJobId}
                          </span>
                        </span>
                        {badge ? (
                          <span
                            title={badge.tooltip}
                            className={cn(
                              "mt-0.5 inline-flex shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold ring-1 ring-inset",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : detailQuery.isLoading ? (
            <p className="text-sm text-muted">Loading interview form…</p>
          ) : detailQuery.isError || !application ? (
            <p className="text-sm text-muted">
              {getErrorMessage(detailQuery.error ?? new Error("Not found"))}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border-subtle bg-hero-bg px-3 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {application.candidate.fullName}
                </p>
                <p className="text-xs text-muted">
                  {application.jobTitle} · {application.publicJobId}
                </p>
                {!applicationId ? (
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    Change candidate
                  </button>
                ) : null}
              </div>
              <EmployerCandidateInterviewEditor
                application={application}
                isSaving={saveMutation.isPending}
                onSave={(payload) => saveMutation.mutate(payload)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
